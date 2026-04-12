import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { sendBookingConfirmation, sendAdminBookingAlert, sendEngineerNewBookingAlert, sendEngineerPriorityAlert } from '@/lib/email';
import { ENGINEERS, type Room } from '@/lib/constants';
import { calculatePriorityExpiry, getPriorityHoursLabel, calculateRescheduleDeadline } from '@/lib/priority';
import { awardXP } from '@/lib/xp-system';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};

      if (meta.type === 'booking_deposit') {
        // Session booking deposit paid
        const startDateTime = `${meta.session_date}T${meta.start_time}:00`;
        const endDateTime = `${meta.session_date}T${meta.end_time}:00`;

        // Calculate dynamic priority window: until 12 hours before session (min 2 hours from now)
        const priorityExpiry = meta.engineer ? calculatePriorityExpiry(startDateTime) : null;
        const rescheduleDeadline = calculateRescheduleDeadline(startDateTime);

        const { data: newBooking } = await supabase.from('bookings').insert({
          customer_name: meta.customer_name,
          customer_email: meta.customer_email,
          customer_phone: meta.customer_phone || null,
          start_time: startDateTime,
          end_time: endDateTime,
          duration: parseInt(meta.duration_hours),
          room: meta.room,
          engineer_name: null,
          requested_engineer: meta.engineer || null,
          total_amount: parseInt(meta.total_amount),
          deposit_amount: parseInt(meta.deposit_amount),
          remainder_amount: parseInt(meta.remainder_amount),
          actual_deposit_paid: session.amount_total,
          night_fees_amount: parseInt(meta.night_fees || '0'),
          same_day_fee: meta.same_day === 'true',
          same_day_fee_amount: parseInt(meta.same_day_fee || '0'),
          stripe_customer_id: session.customer as string,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'confirmed',
          priority_expires_at: priorityExpiry,
          reschedule_deadline: rescheduleDeadline,
          admin_notes: meta.notes || null,
        }).select().single();

        // Send emails — use Fort Wayne timezone since Vercel runs UTC
        const startDate = new Date(startDateTime);
        // Times are stored as local Fort Wayne hours in UTC — format as UTC to preserve the intended hour
        const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
        const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
        const duration = parseInt(meta.duration_hours);

        // Customer confirmation
        await sendBookingConfirmation(meta.customer_email, {
          customerName: meta.customer_name,
          date: dateStr,
          startTime: timeStr,
          duration,
          room: meta.room,
          total: parseInt(meta.total_amount),
          deposit: session.amount_total || parseInt(meta.deposit_amount),
          bookingId: newBooking?.id,
        });

        // Admin alert
        await sendAdminBookingAlert({
          id: newBooking?.id || '',
          customerName: meta.customer_name,
          customerEmail: meta.customer_email,
          date: dateStr,
          startTime: timeStr,
          duration,
          room: meta.room,
          total: parseInt(meta.total_amount),
        });

        // Notify engineers — priority to requested engineer, or all engineers for this studio
        const room = meta.room as string;
        if (meta.engineer && priorityExpiry) {
          // Requested engineer gets priority — only notify them
          const requestedEng = ENGINEERS.find(
            (e) => e.name === meta.engineer || e.displayName === meta.engineer
          );
          if (requestedEng) {
            const priorityLabel = getPriorityHoursLabel(priorityExpiry);
            await sendEngineerPriorityAlert(requestedEng.email, {
              id: newBooking?.id || '',
              customerName: meta.customer_name,
              date: dateStr,
              startTime: timeStr,
              duration,
              room: meta.room,
              priorityHours: priorityLabel,
            });
          }
        } else {
          // No preference — notify all engineers for this studio
          const engineerEmails = ENGINEERS
            .filter((e) => e.studios.includes(room as Room))
            .map((e) => e.email);
          if (engineerEmails.length > 0) {
            await sendEngineerNewBookingAlert(engineerEmails, {
              id: newBooking?.id || '',
              customerName: meta.customer_name,
              date: dateStr,
              startTime: timeStr,
              duration,
              room: meta.room,
            });
          }
        }

        // Award XP for booking — look up user by email
        try {
          const { data: bookerProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', meta.customer_email)
            .limit(1)
            .single();
          if (bookerProfile?.id && newBooking?.id) {
            await awardXP(supabase, bookerProfile.id, 'book_session', {
              referenceId: newBooking.id,
              metadata: { room: meta.room, date: meta.session_date },
            });
          }
        } catch { /* user may not have an account — skip XP */ }
      } else if (meta.type === 'invite_deposit') {
        // Invite booking — deposit paid, confirm the existing pending booking
        const bookingId = meta.booking_id;

        const { data: existingBooking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (existingBooking) {
          await supabase.from('bookings').update({
            status: 'confirmed',
            actual_deposit_paid: session.amount_total,
            stripe_customer_id: session.customer as string,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            updated_at: new Date().toISOString(),
          }).eq('id', bookingId);

          // Create media_sales records if booking has media add-ons (with dedup check)
          const mediaAddons = existingBooking.media_addons;
          if (mediaAddons && Array.isArray(mediaAddons) && mediaAddons.length > 0) {
            const { data: existingMediaSales } = await supabase
              .from('media_sales')
              .select('id')
              .eq('booking_id', bookingId)
              .limit(1);

            if (!existingMediaSales?.length) {
              for (const addon of mediaAddons) {
                await supabase.from('media_sales').insert({
                  description: addon.description || addon.type,
                  amount: addon.amount,
                  sale_type: addon.type,
                  sold_by: addon.sold_by || null,
                  filmed_by: addon.filmed_by || null,
                  edited_by: addon.edited_by || null,
                  client_name: existingBooking.customer_name,
                  client_email: existingBooking.customer_email,
                  booking_id: bookingId,
                  notes: `From session invite`,
                });
              }
            }
          }

          // Send confirmation emails
          const startDate = new Date(existingBooking.start_time);
          const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
          const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });

          if (existingBooking.customer_email) {
            await sendBookingConfirmation(existingBooking.customer_email, {
              customerName: existingBooking.customer_name,
              date: dateStr,
              startTime: timeStr,
              duration: existingBooking.duration,
              room: existingBooking.room || '',
              total: existingBooking.total_amount,
              deposit: session.amount_total || existingBooking.deposit_amount,
              bookingId,
            });
          }

          await sendAdminBookingAlert({
            id: bookingId,
            customerName: existingBooking.customer_name,
            customerEmail: existingBooking.customer_email || '',
            date: dateStr,
            startTime: timeStr,
            duration: existingBooking.duration,
            room: existingBooking.room || '',
            total: existingBooking.total_amount,
          });

          // Set dynamic priority window and reschedule deadline
          const invitePriorityExpiry = existingBooking.requested_engineer
            ? calculatePriorityExpiry(existingBooking.start_time)
            : null;
          const inviteRescheduleDeadline = calculateRescheduleDeadline(existingBooking.start_time);

          await supabase.from('bookings').update({
            priority_expires_at: invitePriorityExpiry,
            reschedule_deadline: inviteRescheduleDeadline,
          }).eq('id', bookingId);

          // Notify engineers — BUT NOT if the booking already has an engineer assigned (invite sessions)
          // Invite bookings auto-assign the engineer who created the invite, so no claim needed
          if (!existingBooking.engineer_name) {
            const room = existingBooking.room as string;
            if (existingBooking.requested_engineer && invitePriorityExpiry) {
              const requestedEng = ENGINEERS.find(
                (e) => e.name === existingBooking.requested_engineer || e.displayName === existingBooking.requested_engineer
              );
              if (requestedEng) {
                const priorityLabel = getPriorityHoursLabel(invitePriorityExpiry);
                await sendEngineerPriorityAlert(requestedEng.email, {
                  id: bookingId,
                  customerName: existingBooking.customer_name,
                  date: dateStr,
                  startTime: timeStr,
                  duration: existingBooking.duration,
                  room: existingBooking.room || '',
                  priorityHours: priorityLabel,
                });
              }
            } else {
              const engineerEmails = ENGINEERS
                .filter((e) => e.studios.includes(room as Room))
                .map((e) => e.email);
              if (engineerEmails.length > 0) {
                await sendEngineerNewBookingAlert(engineerEmails, {
                  id: bookingId,
                  customerName: existingBooking.customer_name,
                  date: dateStr,
                  startTime: timeStr,
                  duration: existingBooking.duration,
                  room: existingBooking.room || '',
                });
            }
          }
          } // end if (!existingBooking.engineer_name)
        }
      } else if (meta.type === 'booking_remainder') {
        // Remainder paid via Checkout (fallback when off-session charge failed)
        const bookingId = meta.booking_id;
        const chargeAmount = parseInt(meta.charge_amount || '0') || (session.amount_total || 0);

        const { data: remainderBooking } = await supabase
          .from('bookings')
          .select('remainder_amount, total_amount')
          .eq('id', bookingId)
          .single();

        if (remainderBooking) {
          await supabase.from('bookings').update({
            remainder_amount: Math.max(0, remainderBooking.remainder_amount - chargeAmount),
            updated_at: new Date().toISOString(),
          }).eq('id', bookingId);
        }
      } else if (meta.type === 'beat_purchase') {
        // Beat store purchase
        const buyerEmail = session.customer_details?.email || meta.buyer_email;
        const buyerName = meta.buyer_name || buyerEmail?.split('@')[0] || 'Buyer';

        // Generate license text
        let licenseText = '';
        try {
          const { generateLicenseText } = await import('@/lib/license-templates');
          licenseText = generateLicenseText({
            buyerName,
            buyerEmail,
            beatTitle: meta.beat_title || 'Unknown',
            producerName: meta.producer || 'Unknown',
            licenseType: meta.license_type as 'mp3_lease' | 'trackout_lease' | 'exclusive',
            amountPaid: session.amount_total || 0,
            purchaseDate: new Date().toLocaleDateString('en-US'),
            purchaseId: session.id,
          });
        } catch { /* license gen failure shouldn't block purchase */ }

        const { data: purchase } = await supabase.from('beat_purchases').insert({
          beat_id: meta.beat_id,
          buyer_id: meta.buyer_id || null,
          buyer_email: buyerEmail,
          license_type: meta.license_type,
          amount_paid: session.amount_total,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          payment_method: 'stripe',
          license_text: licenseText || null,
        }).select('id').single();

        // If exclusive and purchase was created, mark beat as sold and revoke existing leases
        if (purchase && meta.license_type === 'exclusive') {
          await supabase.from('beats').update({
            status: 'sold_exclusive',
            exclusive_buyer_id: meta.buyer_id || null,
            exclusive_sold_at: new Date().toISOString(),
          }).eq('id', meta.beat_id);

          // Revoke all existing leases for this beat
          try {
            const { data: existingLeases } = await supabase
              .from('beat_purchases')
              .select('id, buyer_email, license_type, created_at')
              .eq('beat_id', meta.beat_id)
              .in('license_type', ['mp3_lease', 'trackout_lease'])
              .is('revoked_at', null);

            if (existingLeases && existingLeases.length > 0) {
              // Mark all leases as revoked
              const leaseIds = existingLeases.map(l => l.id);
              await supabase.from('beat_purchases').update({
                revoked_at: new Date().toISOString(),
                revoked_reason: 'Exclusive rights purchased',
              }).in('id', leaseIds);

              // Notify each leaseholder (per-email isolation so one failure doesn't block others)
              const { sendLeaseRevokedNotification } = await import('@/lib/email');
              for (const lease of existingLeases) {
                if (lease.buyer_email) {
                  try {
                    const leaseName = lease.buyer_email.split('@')[0] || 'Customer';
                    await sendLeaseRevokedNotification(lease.buyer_email, {
                      buyerName: leaseName,
                      beatTitle: meta.beat_title || 'Beat',
                      producerName: meta.producer || 'Unknown',
                      licenseType: lease.license_type === 'mp3_lease' ? 'MP3 Lease' : 'Trackout Lease',
                      purchaseDate: new Date(lease.created_at).toLocaleDateString('en-US'),
                    });
                  } catch (emailErr) { console.error(`Failed to send revocation email to ${lease.buyer_email}:`, emailErr); }
                }
              }
              console.log(`Revoked ${existingLeases.length} lease(s) for beat ${meta.beat_id} — exclusive purchased`);
            }
          } catch (e) { console.error('Lease revocation error:', e); }
        }

        // Send purchase confirmation email to buyer
        try {
          const { sendBeatPurchaseConfirmation } = await import('@/lib/email');
          await sendBeatPurchaseConfirmation(buyerEmail, {
            buyerName,
            beatTitle: meta.beat_title || 'Beat',
            producerName: meta.producer || 'Unknown',
            licenseType: meta.license_type,
            amount: session.amount_total || 0,
            purchaseId: purchase?.id || session.id,
          });
        } catch (e) { console.error('Beat purchase email error:', e); }

        // Notify producer of sale
        try {
          if (meta.producer_id) {
            const { data: producerProfile } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('id', meta.producer_id)
              .single();
            if (producerProfile?.user_id) {
              const { data: { user: producerAuth } } = await supabase.auth.admin.getUserById(producerProfile.user_id);
              if (producerAuth?.email) {
                const { sendBeatSaleProducerNotification } = await import('@/lib/email');
                await sendBeatSaleProducerNotification(producerAuth.email, {
                  buyerName,
                  buyerEmail,
                  beatTitle: meta.beat_title || 'Beat',
                  licenseType: meta.license_type,
                  amount: session.amount_total || 0,
                  producerEarnings: Math.round((session.amount_total || 0) * 0.6),
                });
              }
            }
          }
        } catch (e) { console.error('Producer notification error:', e); }

        // Award XP for beat purchase
        if (meta.buyer_id) {
          try {
            await awardXP(supabase, meta.buyer_id, 'purchase_beat', {
              referenceId: `${meta.beat_id}_${meta.license_type}`,
              metadata: { beat_id: meta.beat_id, license_type: meta.license_type, beat_title: meta.beat_title },
            });
          } catch { /* buyer may not have a profile — skip XP */ }
        }
      } else if (meta.type === 'private_beat_sale') {
        // Private beat sale — buyer paid via Stripe after signing agreement
        const privateSaleId = meta.private_sale_id;
        const { data: sale } = await supabase
          .from('private_beat_sales')
          .select('*')
          .eq('id', privateSaleId)
          .single();

        if (sale && sale.status !== 'completed') {
          // Create beat_purchases record
          const { data: purchase } = await supabase
            .from('beat_purchases')
            .insert({
              beat_id: sale.beat_id || null,
              buyer_id: null,
              buyer_email: session.customer_details?.email || sale.buyer_email,
              license_type: sale.license_type,
              amount_paid: session.amount_total,
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent as string,
              payment_method: 'stripe',
              private_sale_id: sale.id,
            })
            .select('id')
            .single();

          // Update private sale to completed
          await supabase.from('private_beat_sales').update({
            status: 'completed',
            paid_at: new Date().toISOString(),
            purchase_id: purchase?.id || null,
          }).eq('id', privateSaleId);

          // If exclusive and has a beat_id and purchase was created, mark beat as sold + revoke leases
          if (purchase && sale.license_type === 'exclusive' && sale.beat_id) {
            await supabase.from('beats').update({
              status: 'sold_exclusive',
              exclusive_sold_at: new Date().toISOString(),
            }).eq('id', sale.beat_id);

            // Revoke all existing leases for this beat
            try {
              const { data: existingLeases } = await supabase
                .from('beat_purchases')
                .select('id, buyer_email, license_type, created_at')
                .eq('beat_id', sale.beat_id)
                .in('license_type', ['mp3_lease', 'trackout_lease'])
                .is('revoked_at', null);

              if (existingLeases && existingLeases.length > 0) {
                const leaseIds = existingLeases.map(l => l.id);
                await supabase.from('beat_purchases').update({
                  revoked_at: new Date().toISOString(),
                  revoked_reason: 'Exclusive rights purchased',
                }).in('id', leaseIds);

                const { sendLeaseRevokedNotification } = await import('@/lib/email');
                const { data: beatInfo } = await supabase.from('beats').select('title, producer').eq('id', sale.beat_id).single();
                for (const lease of existingLeases) {
                  if (lease.buyer_email) {
                    try {
                      await sendLeaseRevokedNotification(lease.buyer_email, {
                        buyerName: lease.buyer_email.split('@')[0] || 'Customer',
                        beatTitle: beatInfo?.title || sale.beat_title || 'Beat',
                        producerName: beatInfo?.producer || sale.beat_producer || 'Unknown',
                        licenseType: lease.license_type === 'mp3_lease' ? 'MP3 Lease' : 'Trackout Lease',
                        purchaseDate: new Date(lease.created_at).toLocaleDateString('en-US'),
                      });
                    } catch (emailErr) { console.error(`Failed to send revocation email to ${lease.buyer_email}:`, emailErr); }
                  }
                }
                console.log(`Revoked ${existingLeases.length} lease(s) for beat ${sale.beat_id} — exclusive purchased (private sale)`);
              }
            } catch (e) { console.error('Private sale lease revocation error:', e); }
          }

          // Send completion emails
          try {
            const { sendPrivateBeatSaleComplete, sendPrivateBeatSaleNotification } = await import('@/lib/email');
            await sendPrivateBeatSaleComplete(sale.buyer_email, {
              buyerName: sale.buyer_name || 'there',
              beatTitle: sale.beat_title,
              producerName: sale.beat_producer,
              licenseType: sale.license_type,
              amount: sale.amount,
              token: sale.token,
            });

            // Notify producer/creator
            if (sale.created_by) {
              const { data: creator } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('id', sale.created_by)
                .single();
              if (creator?.user_id) {
                const { data: { user: creatorAuth } } = await supabase.auth.admin.getUserById(creator.user_id);
                if (creatorAuth?.email) {
                  await sendPrivateBeatSaleNotification(creatorAuth.email, {
                    buyerName: sale.buyer_name || 'Unknown',
                    buyerEmail: sale.buyer_email,
                    beatTitle: sale.beat_title,
                    licenseType: sale.license_type,
                    amount: sale.amount,
                    paymentMethod: 'stripe',
                  });
                }
              }
            }
          } catch (e) {
            console.error('Private sale email error:', e);
          }
        }
      }
      break;
    }

    // Cash App Pay, bank transfers, and other async payment methods fire this event
    // instead of (or in addition to) checkout.session.completed. We handle it identically.
    case 'checkout.session.async_payment_succeeded': {
      const asyncSession = event.data.object as Stripe.Checkout.Session;
      const asyncMeta = asyncSession.metadata || {};

      // Only process if we haven't already (check if booking exists)
      if (asyncMeta.type === 'booking_deposit') {
        const { data: existing } = await supabase
          .from('bookings')
          .select('id')
          .eq('stripe_checkout_session_id', asyncSession.id)
          .single();

        if (!existing) {
          // Same logic as checkout.session.completed for booking_deposit
          const startDateTime = `${asyncMeta.session_date}T${asyncMeta.start_time}:00`;
          const endDateTime = `${asyncMeta.session_date}T${asyncMeta.end_time}:00`;
          const priorityExpiry = asyncMeta.engineer ? calculatePriorityExpiry(startDateTime) : null;
          const rescheduleDeadline = calculateRescheduleDeadline(startDateTime);

          const { data: newBooking } = await supabase.from('bookings').insert({
            customer_name: asyncMeta.customer_name,
            customer_email: asyncMeta.customer_email,
            customer_phone: asyncMeta.customer_phone || null,
            start_time: startDateTime,
            end_time: endDateTime,
            duration: parseInt(asyncMeta.duration_hours),
            room: asyncMeta.room,
            engineer_name: null,
            requested_engineer: asyncMeta.engineer || null,
            total_amount: parseInt(asyncMeta.total_amount),
            deposit_amount: parseInt(asyncMeta.deposit_amount),
            remainder_amount: parseInt(asyncMeta.remainder_amount),
            actual_deposit_paid: asyncSession.amount_total,
            night_fees_amount: parseInt(asyncMeta.night_fees || '0'),
            same_day_fee: asyncMeta.same_day === 'true',
            same_day_fee_amount: parseInt(asyncMeta.same_day_fee || '0'),
            stripe_customer_id: asyncSession.customer as string,
            stripe_checkout_session_id: asyncSession.id,
            stripe_payment_intent_id: asyncSession.payment_intent as string,
            status: 'confirmed',
            priority_expires_at: priorityExpiry,
            reschedule_deadline: rescheduleDeadline,
            admin_notes: asyncMeta.notes || null,
          }).select().single();

          // Send all emails
          const startDate = new Date(startDateTime);
          const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
          const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
          const duration = parseInt(asyncMeta.duration_hours);

          await sendBookingConfirmation(asyncMeta.customer_email, {
            customerName: asyncMeta.customer_name, date: dateStr, startTime: timeStr,
            duration, room: asyncMeta.room, total: parseInt(asyncMeta.total_amount),
            deposit: asyncSession.amount_total || parseInt(asyncMeta.deposit_amount),
            bookingId: newBooking?.id,
          });

          await sendAdminBookingAlert({
            id: newBooking?.id || '', customerName: asyncMeta.customer_name,
            customerEmail: asyncMeta.customer_email, date: dateStr, startTime: timeStr,
            duration, room: asyncMeta.room, total: parseInt(asyncMeta.total_amount),
          });

          const room = asyncMeta.room as string;
          if (asyncMeta.engineer && priorityExpiry) {
            const requestedEng = ENGINEERS.find(
              (e) => e.name === asyncMeta.engineer || e.displayName === asyncMeta.engineer
            );
            if (requestedEng) {
              const priorityLabel = getPriorityHoursLabel(priorityExpiry);
              await sendEngineerPriorityAlert(requestedEng.email, {
                id: newBooking?.id || '', customerName: asyncMeta.customer_name,
                date: dateStr, startTime: timeStr, duration, room: asyncMeta.room,
                priorityHours: priorityLabel,
              });
            }
          } else {
            const engineerEmails = ENGINEERS
              .filter((e) => e.studios.includes(room as Room))
              .map((e) => e.email);
            if (engineerEmails.length > 0) {
              await sendEngineerNewBookingAlert(engineerEmails, {
                id: newBooking?.id || '', customerName: asyncMeta.customer_name,
                date: dateStr, startTime: timeStr, duration, room: asyncMeta.room,
              });
            }
          }
        }
      } else if (asyncMeta.type === 'invite_deposit') {
        // Check if already confirmed
        const bookingId = asyncMeta.booking_id;
        const { data: existingBooking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (existingBooking && existingBooking.status !== 'confirmed') {
          await supabase.from('bookings').update({
            status: 'confirmed',
            actual_deposit_paid: asyncSession.amount_total,
            stripe_customer_id: asyncSession.customer as string,
            stripe_checkout_session_id: asyncSession.id,
            stripe_payment_intent_id: asyncSession.payment_intent as string,
            updated_at: new Date().toISOString(),
          }).eq('id', bookingId);

          // Create media_sales records if booking has media add-ons (with dedup check)
          const asyncMediaAddons = existingBooking.media_addons;
          if (asyncMediaAddons && Array.isArray(asyncMediaAddons) && asyncMediaAddons.length > 0) {
            const { data: existingAsyncSales } = await supabase
              .from('media_sales')
              .select('id')
              .eq('booking_id', bookingId)
              .limit(1);

            if (!existingAsyncSales?.length) {
              for (const addon of asyncMediaAddons) {
                await supabase.from('media_sales').insert({
                  description: addon.description || addon.type,
                  amount: addon.amount,
                  sale_type: addon.type,
                  sold_by: addon.sold_by || null,
                  filmed_by: addon.filmed_by || null,
                  edited_by: addon.edited_by || null,
                  client_name: existingBooking.customer_name,
                  client_email: existingBooking.customer_email,
                  booking_id: bookingId,
                  notes: `From session invite`,
                });
              }
            }
          }

          const startDate = new Date(existingBooking.start_time);
          const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
          const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });

          if (existingBooking.customer_email) {
            await sendBookingConfirmation(existingBooking.customer_email, {
              customerName: existingBooking.customer_name, date: dateStr, startTime: timeStr,
              duration: existingBooking.duration, room: existingBooking.room || '',
              total: existingBooking.total_amount,
              deposit: asyncSession.amount_total || existingBooking.deposit_amount,
              bookingId,
            });
          }

          await sendAdminBookingAlert({
            id: bookingId, customerName: existingBooking.customer_name,
            customerEmail: existingBooking.customer_email || '', date: dateStr, startTime: timeStr,
            duration: existingBooking.duration, room: existingBooking.room || '',
            total: existingBooking.total_amount,
          });

          // Engineer notifications
          const invitePriorityExpiry = existingBooking.requested_engineer
            ? calculatePriorityExpiry(existingBooking.start_time) : null;
          const inviteRescheduleDeadline = calculateRescheduleDeadline(existingBooking.start_time);

          await supabase.from('bookings').update({
            priority_expires_at: invitePriorityExpiry,
            reschedule_deadline: inviteRescheduleDeadline,
          }).eq('id', bookingId);

          // Skip claim emails if engineer already assigned (invite sessions)
          if (!existingBooking.engineer_name) {
            const room = existingBooking.room as string;
            if (existingBooking.requested_engineer && invitePriorityExpiry) {
              const requestedEng = ENGINEERS.find(
                (e) => e.name === existingBooking.requested_engineer || e.displayName === existingBooking.requested_engineer
              );
              if (requestedEng) {
                const priorityLabel = getPriorityHoursLabel(invitePriorityExpiry);
                await sendEngineerPriorityAlert(requestedEng.email, {
                  id: bookingId, customerName: existingBooking.customer_name,
                  date: dateStr, startTime: timeStr, duration: existingBooking.duration,
                  room: existingBooking.room || '', priorityHours: priorityLabel,
                });
              }
            } else {
              const engineerEmails = ENGINEERS
                .filter((e) => e.studios.includes(room as Room))
                .map((e) => e.email);
              if (engineerEmails.length > 0) {
                await sendEngineerNewBookingAlert(engineerEmails, {
                  id: bookingId, customerName: existingBooking.customer_name,
                  date: dateStr, startTime: timeStr, duration: existingBooking.duration,
                  room: existingBooking.room || '',
                });
              }
            }
          }
        }
      } else if (asyncMeta.type === 'booking_remainder') {
        const bookingId = asyncMeta.booking_id;
        const chargeAmount = parseInt(asyncMeta.charge_amount || '0') || (asyncSession.amount_total || 0);
        const { data: remainderBooking } = await supabase
          .from('bookings')
          .select('remainder_amount')
          .eq('id', bookingId)
          .single();

        if (remainderBooking) {
          await supabase.from('bookings').update({
            remainder_amount: Math.max(0, remainderBooking.remainder_amount - chargeAmount),
            updated_at: new Date().toISOString(),
          }).eq('id', bookingId);
        }
      }
      break;
    }

    // Handle failed async payments (Cash App declined, etc.)
    case 'checkout.session.async_payment_failed': {
      const failedSession = event.data.object as Stripe.Checkout.Session;
      const failedMeta = failedSession.metadata || {};
      console.error('Async payment failed:', failedSession.id, failedMeta);
      // If this was an invite, mark it back to pending
      if (failedMeta.type === 'invite_deposit' && failedMeta.booking_id) {
        await supabase.from('bookings').update({
          status: 'pending_deposit',
          updated_at: new Date().toISOString(),
        }).eq('id', failedMeta.booking_id);
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      // Update booking status if refunded
      if (charge.payment_intent) {
        await supabase.from('bookings')
          .update({ status: 'cancelled' })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
