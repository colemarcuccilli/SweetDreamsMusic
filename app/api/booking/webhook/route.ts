import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import {
  sendBookingConfirmation,
  sendAdminBookingAlert,
  sendEngineerNewBookingAlert,
  sendEngineerPriorityAlert,
  sendMediaPurchaseConfirmation,
  sendMediaPurchaseAdminAlert,
} from '@/lib/email';
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

  // ── Idempotency claim ────────────────────────────────────────────────
  // Stripe retries webhooks on 5xx or network timeout. Without dedup, retries
  // can double-insert bookings / beat purchases, double-award XP, etc.
  // Claim the event.id via a unique-constraint INSERT. If it succeeds, we
  // own this delivery. If it fails with 23505 (unique_violation), another
  // handler has already processed (or is processing) this event — ACK and
  // skip. See migration 035 for design rationale.
  {
    const { error: claimErr } = await supabase
      .from('stripe_webhook_events')
      .insert({ event_id: event.id, event_type: event.type });

    if (claimErr) {
      if (claimErr.code === '23505') {
        console.log(`[webhook] duplicate delivery for event ${event.id} (${event.type}) — deduped`);
        return NextResponse.json({ received: true, deduped: true });
      }
      // Any other DB error means we can't guarantee dedup — return 5xx so
      // Stripe retries, but don't process (risk of double-side-effects).
      console.error('[webhook] claim insert failed:', claimErr);
      return NextResponse.json({ error: 'Dedup claim failed' }, { status: 500 });
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};

      if (meta.type === 'booking_deposit' || meta.type === 'band_booking_deposit') {
        // Session booking deposit paid. Two flavors share this branch:
        //   - 'booking_deposit'       → solo session
        //   - 'band_booking_deposit'  → band session (has meta.band_id)
        // The only row-level difference is `band_id`; everything else
        // (emails, engineer notifications, XP) flows the same way because
        // the paying customer is still the booker, not the band.
        //
        // Special cases (band-only, both gated on meta.type === 'band_booking_deposit'):
        //   1) 24hr (3-day) block — fans out to 3 booking rows linked by
        //      a shared booking_group_id. Day 1 carries setup_minutes_before;
        //      days 2-3 don't.
        //   2) Sweet Spot filming add-on — extends the relevant day's
        //      duration by 2 hours and stamps sweet_spot_addon JSONB on
        //      that row. For 8hr the addon lives on the single row; for
        //      24hr it lives on the picked filming-day row.
        const startDateTime = `${meta.session_date}T${meta.start_time}:00`;
        const endDateTime = `${meta.session_date}T${meta.end_time}:00`;
        const baseDurationHours = parseInt(meta.duration_hours);
        const isBandBooking = meta.type === 'band_booking_deposit';
        const is3DayBlock = isBandBooking && baseDurationHours === 24;

        // Parse Sweet Spot add-on metadata (JSON-stringified by /create).
        // Shape after parse: { kind: '8hr-addon' } or { kind: '3day-addon', filmingDayIndex: 0|1|2 }.
        let sweetSpotAddon:
          | { kind: '8hr-addon'; price_cents: number; extra_filming_hours: number }
          | { kind: '3day-addon'; filmingDayIndex: 0 | 1 | 2; price_cents: number; extra_filming_hours: number }
          | null = null;
        if (meta.sweet_spot_addon) {
          try {
            const parsed = JSON.parse(meta.sweet_spot_addon);
            if (parsed?.kind === '8hr-addon') {
              sweetSpotAddon = { kind: '8hr-addon', price_cents: 200000, extra_filming_hours: 2 };
            } else if (parsed?.kind === '3day-addon' && [0, 1, 2].includes(parsed.filmingDayIndex)) {
              sweetSpotAddon = {
                kind: '3day-addon',
                filmingDayIndex: parsed.filmingDayIndex,
                price_cents: 100000,
                extra_filming_hours: 2,
              };
            }
          } catch (e) {
            // Sweet Spot is part of the priced deposit — silently dropping
            // it would mean the customer paid for an add-on with no row to
            // back it. Roll back the dedup claim so Stripe retries; if the
            // payload is permanently bad, admin investigates from logs.
            console.error('[webhook] sweet_spot_addon parse failed — rolling back claim:', e);
            await supabase.from('stripe_webhook_events').delete().eq('event_id', event.id);
            return NextResponse.json({ error: 'Sweet Spot metadata corrupted' }, { status: 500 });
          }
        }

        // Calculate dynamic priority window: until 12 hours before session (min 2 hours from now).
        // Bands always carry a priority window — even if meta.engineer is somehow
        // empty (defense-in-depth) we want Iszac to get the priority claim, not
        // fall through to the all-engineers fan-out.
        const priorityExpiry = (meta.engineer || isBandBooking) ? calculatePriorityExpiry(startDateTime) : null;
        const rescheduleDeadline = calculateRescheduleDeadline(startDateTime);

        // Branch on multi-day vs single-day. The multi-day path inserts 3
        // rows + tracks the day-1 row as the canonical "newBooking" so the
        // downstream notification + XP code paths continue to work.
        let newBooking: { id: string } | null = null;

        if (is3DayBlock) {
          // 3-day band block: insert 3 rows linked by a shared group UUID.
          // Day 1 has setup_minutes_before from metadata. Days 2-3 are 0.
          // The Sweet Spot day (if any) gets duration extended by 2 hours
          // AND the sweet_spot_addon JSONB.
          const groupId = randomUUID();
          // Stripe deposit covers all 3 days. We split the total/deposit/
          // remainder evenly across the 3 rows so the per-row accounting
          // keeps making sense to engineers and admins reading individual
          // sessions. Round to integer cents; the deposit lands on day 1.
          const totalCents = parseInt(meta.total_amount);
          const depositCents = parseInt(meta.deposit_amount);
          const remainderCents = parseInt(meta.remainder_amount);
          const perDayTotal = Math.round(totalCents / 3);
          const perDayRemainder = Math.round(remainderCents / 3);
          // Day 1 absorbs the rounding leftover so the sum of remainders
          // always equals remainderCents exactly. Math.round can leave a
          // 1-cent gap in either direction; deriving Day 1 from the others
          // (vs. from totals) keeps the math consistent and never negative.
          const day1Remainder = Math.max(0, remainderCents - 2 * perDayRemainder);
          const day1SetupMinutes = parseInt(meta.setup_minutes_before || '60', 10) || 60;

          // Day 1 / Day 2 / Day 3 anchor dates. We compute by adding 24h to
          // a Date built from the meta.session_date — UTC parsing keeps the
          // local Fort Wayne time intact (the rest of the system uses the
          // same convention).
          const baseDate = new Date(`${meta.session_date}T${meta.start_time}:00Z`);

          const insertedIds: string[] = [];
          // Narrow the addon to its 3day-addon shape once, outside the
          // loop, so TypeScript can prove `sweetSpotAddon.extra_filming_hours`
          // is defined inside the truthy branch.
          const filmingAddon =
            sweetSpotAddon?.kind === '3day-addon' ? sweetSpotAddon : null;
          for (let i = 0; i < 3; i++) {
            const dayStart = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
            const isFilmingDay = !!filmingAddon && filmingAddon.filmingDayIndex === i;
            const dayDuration = isFilmingDay ? 8 + filmingAddon.extra_filming_hours : 8;
            const dayEnd = new Date(dayStart.getTime() + dayDuration * 60 * 60 * 1000);
            const dayPriority = meta.engineer ? calculatePriorityExpiry(dayStart.toISOString()) : null;
            const dayReschedule = calculateRescheduleDeadline(dayStart.toISOString());

            const { data: row, error } = await supabase.from('bookings').insert({
              customer_name: meta.customer_name,
              customer_email: meta.customer_email,
              customer_phone: meta.customer_phone || null,
              start_time: dayStart.toISOString(),
              end_time: dayEnd.toISOString(),
              duration: dayDuration,
              room: meta.room,
              engineer_name: null,
              requested_engineer: meta.engineer || null,
              total_amount: perDayTotal,
              deposit_amount: i === 0 ? depositCents : 0,
              remainder_amount: i === 0 ? day1Remainder : perDayRemainder,
              actual_deposit_paid: i === 0 ? session.amount_total : 0,
              night_fees_amount: 0,
              same_day_fee: false,
              same_day_fee_amount: 0,
              guest_count: 1,
              guest_fee_amount: 0,
              stripe_customer_id: session.customer as string,
              stripe_checkout_session_id: session.id,
              // Only day 1 carries the payment_intent — the deposit hit there.
              stripe_payment_intent_id: i === 0 ? (session.payment_intent as string) : null,
              status: 'confirmed',
              priority_expires_at: dayPriority,
              reschedule_deadline: dayReschedule,
              admin_notes:
                i === 0
                  ? `${meta.notes || ''}\n\n3-day block — Day ${i + 1} of 3. Admin must call buyer to confirm logistics.`.trim()
                  : `3-day block — Day ${i + 1} of 3.`,
              band_id: meta.band_id || null,
              setup_minutes_before: i === 0 ? day1SetupMinutes : 0,
              booking_group_id: groupId,
              sweet_spot_addon: isFilmingDay ? sweetSpotAddon : null,
            }).select('id').single();

            if (error) {
              // 3-day inserts must all succeed atomically. If any day fails,
              // roll back what we wrote + clear the dedup claim so Stripe
              // retries the whole event. Without this, a partial insert would
              // be permanent (claim-at-start blocks future retries).
              console.error(`[webhook] 3-day band row insert (day ${i + 1}) failed — rolling back:`, error);
              if (insertedIds.length > 0) {
                await supabase.from('bookings').delete().in('id', insertedIds);
              }
              await supabase.from('stripe_webhook_events').delete().eq('event_id', event.id);
              return NextResponse.json(
                { error: `Day ${i + 1} insert failed: ${error.message}` },
                { status: 500 },
              );
            }
            if (row) {
              insertedIds.push(row.id);
              if (i === 0) newBooking = row;
            }
          }

          console.log(
            `[webhook] 3-day band block inserted: groupId=${groupId} rowCount=${insertedIds.length} band=${meta.band_id || 'none'}`,
          );
        } else {
          // Single-day path. Add Sweet Spot extension if 8hr add-on present.
          const filmingExtraHours =
            sweetSpotAddon?.kind === '8hr-addon' ? sweetSpotAddon.extra_filming_hours : 0;
          const finalDuration = baseDurationHours + filmingExtraHours;
          const finalEndTime =
            filmingExtraHours > 0
              ? new Date(
                  new Date(startDateTime).getTime() + finalDuration * 60 * 60 * 1000,
                ).toISOString()
              : endDateTime;

          const { data: row, error: insertErr } = await supabase.from('bookings').insert({
            customer_name: meta.customer_name,
            customer_email: meta.customer_email,
            customer_phone: meta.customer_phone || null,
            start_time: startDateTime,
            end_time: finalEndTime,
            duration: finalDuration,
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
            guest_count: parseInt(meta.guest_count || '1'),
            guest_fee_amount: parseInt(meta.guest_fee || '0'),
            stripe_customer_id: session.customer as string,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            status: 'confirmed',
            priority_expires_at: priorityExpiry,
            reschedule_deadline: rescheduleDeadline,
            admin_notes: meta.notes || null,
            band_id: meta.band_id || null,
            setup_minutes_before: parseInt(meta.setup_minutes_before || '0', 10) || 0,
            sweet_spot_addon: sweetSpotAddon,
          }).select('id').single();
          if (insertErr || !row) {
            // Customer paid; without a booking row we'd have a ghost charge.
            // Roll back the dedup claim so Stripe retries — better to receive
            // a duplicate event later than to silently lose the booking.
            console.error('[webhook] solo/band-single insert failed — rolling back claim:', insertErr);
            await supabase.from('stripe_webhook_events').delete().eq('event_id', event.id);
            return NextResponse.json(
              { error: insertErr?.message || 'Booking insert failed' },
              { status: 500 },
            );
          }
          newBooking = row;
        }

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

        // Notify engineers. Two routing rules:
        //   • Band sessions ALWAYS go to Iszac (the dedicated band engineer)
        //     with priority — never fan out to other Studio A engineers. If
        //     Iszac can't take it, he reschedules with the band directly via
        //     the chat thread (Round 8b) — no fallback claim path.
        //   • Solo sessions: requested engineer gets priority; if no
        //     preference, fan out to every engineer assigned to that studio.
        const room = meta.room as string;
        if (isBandBooking) {
          // Resolve Iszac from the roster. Use displayName "Iszac" or canonical
          // name "Iszac Griner" — both work since the roster carries both.
          // displayName 'Iszac' uniquely identifies him in the roster; checking
          // both `name` and `displayName` confuses TS narrowing in disjunctions.
          const iszac = ENGINEERS.find((e) => e.displayName === 'Iszac');
          if (iszac && priorityExpiry) {
            const priorityLabel = getPriorityHoursLabel(priorityExpiry);
            await sendEngineerPriorityAlert(iszac.email, {
              id: newBooking?.id || '',
              customerName: meta.customer_name,
              date: dateStr,
              startTime: timeStr,
              duration,
              room: meta.room,
              priorityHours: priorityLabel,
            });
          }
        } else if (meta.engineer && priorityExpiry) {
          // Solo: requested engineer gets priority — only notify them
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
          // Solo, no preference — notify all engineers for this studio
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

        // Calculate lease expiration date
        const { LEASE_DURATION_DAYS } = await import('@/lib/constants');
        const durationDays = LEASE_DURATION_DAYS[meta.license_type as string] ?? null;
        let leaseExpiresAt: string | null = null;
        if (durationDays) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + durationDays);
          leaseExpiresAt = expiry.toISOString();
        }
        // Check if this is a lifetime lease beat (explicit flag — never expires)
        // Producer can also offer "Lease Only" mode (MP3-only, no exclusive, but still 1yr expiring).
        if (meta.license_type !== 'exclusive') {
          const { data: beatInfo } = await supabase.from('beats').select('is_lifetime_lease').eq('id', meta.beat_id).single();
          if (beatInfo && beatInfo.is_lifetime_lease) {
            leaseExpiresAt = null; // Lifetime lease — never expires
          }
        }

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
          lease_expires_at: leaseExpiresAt,
        }).select('id').single();

        // If exclusive and purchase was created, mark beat as sold + grandfather existing leases
        if (purchase && meta.license_type === 'exclusive') {
          await supabase.from('beats').update({
            status: 'sold_exclusive',
            exclusive_buyer_id: meta.buyer_id || null,
            exclusive_sold_at: new Date().toISOString(),
          }).eq('id', meta.beat_id);

          // Grandfather existing leases — block renewal but let them run until expiry
          try {
            const { data: existingLeases } = await supabase
              .from('beat_purchases')
              .select('id, buyer_email, license_type, created_at, lease_expires_at')
              .eq('beat_id', meta.beat_id)
              .in('license_type', ['mp3_lease', 'trackout_lease'])
              .is('revoked_at', null)
              .neq('id', purchase.id);

            if (existingLeases && existingLeases.length > 0) {
              // Block renewal but do NOT revoke — leases stay active until expiry
              const leaseIds = existingLeases.map(l => l.id);
              await supabase.from('beat_purchases').update({
                renewal_blocked: true,
                revoked_reason: 'Exclusive purchased — lease grandfathered until expiry',
              }).in('id', leaseIds);

              // Notify each leaseholder that their lease is grandfathered
              const { sendLeaseRevokedNotification } = await import('@/lib/email');
              for (const lease of existingLeases) {
                if (lease.buyer_email) {
                  try {
                    const leaseName = lease.buyer_email.split('@')[0] || 'Customer';
                    const expiryDate = lease.lease_expires_at
                      ? new Date(lease.lease_expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : 'your license term';
                    await sendLeaseRevokedNotification(lease.buyer_email, {
                      buyerName: leaseName,
                      beatTitle: meta.beat_title || 'Beat',
                      producerName: meta.producer || 'Unknown',
                      licenseType: lease.license_type === 'mp3_lease' ? 'MP3 Lease' : 'Trackout Lease',
                      purchaseDate: new Date(lease.created_at).toLocaleDateString('en-US'),
                    });
                  } catch (emailErr) { console.error(`Failed to send grandfathered email to ${lease.buyer_email}:`, emailErr); }
                }
              }
              console.log(`Grandfathered ${existingLeases.length} lease(s) for beat ${meta.beat_id} — exclusive purchased`);
            }
          } catch (e) { console.error('Lease grandfathering error:', e); }
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
      } else if (meta.type === 'beat_renewal') {
        // Lease renewal — create new purchase record linked to original
        const { LEASE_DURATION_DAYS } = await import('@/lib/constants');
        const durationDays = LEASE_DURATION_DAYS[meta.license_type as string] ?? 365;
        const newExpiry = new Date();
        if (durationDays) newExpiry.setDate(newExpiry.getDate() + durationDays);

        await supabase.from('beat_purchases').insert({
          beat_id: meta.beat_id,
          buyer_id: meta.buyer_id || null,
          buyer_email: meta.buyer_email,
          license_type: meta.license_type,
          amount_paid: session.amount_total,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          payment_method: 'stripe',
          renewed_from_id: meta.original_purchase_id,
          lease_expires_at: durationDays ? newExpiry.toISOString() : null,
        });

      } else if (meta.type === 'beat_upgrade') {
        // License upgrade — create new purchase with upgraded license type
        const { LEASE_DURATION_DAYS } = await import('@/lib/constants');
        const durationDays = LEASE_DURATION_DAYS[meta.license_type as string] ?? null;
        let newExpiry: string | null = null;
        if (durationDays) {
          const exp = new Date();
          exp.setDate(exp.getDate() + durationDays);
          newExpiry = exp.toISOString();
        }

        // Generate license text for the new license type
        let licenseText = '';
        try {
          const { generateLicenseText } = await import('@/lib/license-templates');
          licenseText = generateLicenseText({
            buyerName: meta.buyer_email?.split('@')[0] || 'Buyer',
            buyerEmail: meta.buyer_email,
            beatTitle: meta.beat_title || 'Beat',
            producerName: meta.producer || 'Unknown',
            licenseType: meta.license_type as 'mp3_lease' | 'trackout_lease' | 'exclusive',
            amountPaid: session.amount_total || 0,
            purchaseDate: new Date().toLocaleDateString('en-US'),
            purchaseId: session.id,
          });
        } catch { /* */ }

        const { data: upgradePurchase } = await supabase.from('beat_purchases').insert({
          beat_id: meta.beat_id,
          buyer_id: meta.buyer_id || null,
          buyer_email: meta.buyer_email,
          license_type: meta.license_type,
          amount_paid: session.amount_total,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          payment_method: 'stripe',
          upgraded_from_id: meta.original_purchase_id,
          lease_expires_at: newExpiry,
          license_text: licenseText || null,
        }).select('id').single();

        // If upgraded to exclusive, run the grandfathering logic
        if (upgradePurchase && meta.license_type === 'exclusive') {
          await supabase.from('beats').update({
            status: 'sold_exclusive',
            exclusive_buyer_id: meta.buyer_id || null,
            exclusive_sold_at: new Date().toISOString(),
          }).eq('id', meta.beat_id);

          // Grandfather other leases
          const { data: otherLeases } = await supabase
            .from('beat_purchases')
            .select('id')
            .eq('beat_id', meta.beat_id)
            .in('license_type', ['mp3_lease', 'trackout_lease'])
            .is('revoked_at', null)
            .neq('id', meta.original_purchase_id);

          if (otherLeases && otherLeases.length > 0) {
            await supabase.from('beat_purchases').update({
              renewal_blocked: true,
              revoked_reason: 'Exclusive purchased — lease grandfathered until expiry',
            }).in('id', otherLeases.map(l => l.id));
          }
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

          // If exclusive and has a beat_id and purchase was created, mark beat as sold + grandfather leases
          if (purchase && sale.license_type === 'exclusive' && sale.beat_id) {
            await supabase.from('beats').update({
              status: 'sold_exclusive',
              exclusive_sold_at: new Date().toISOString(),
            }).eq('id', sale.beat_id);

            // Grandfather existing leases — block renewal but keep active until expiry
            try {
              const { data: existingLeases } = await supabase
                .from('beat_purchases')
                .select('id, buyer_email, license_type, created_at, lease_expires_at')
                .eq('beat_id', sale.beat_id)
                .in('license_type', ['mp3_lease', 'trackout_lease'])
                .is('revoked_at', null);

              if (existingLeases && existingLeases.length > 0) {
                const leaseIds = existingLeases.map(l => l.id);
                await supabase.from('beat_purchases').update({
                  renewal_blocked: true,
                  revoked_reason: 'Exclusive purchased — lease grandfathered until expiry',
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
                    } catch (emailErr) { console.error(`Failed to send grandfathered email to ${lease.buyer_email}:`, emailErr); }
                  }
                }
                console.log(`Grandfathered ${existingLeases.length} lease(s) for beat ${sale.beat_id} — exclusive purchased (private sale)`);
              }
            } catch (e) { console.error('Private sale lease grandfathering error:', e); }
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
      } else if (meta.type === 'media_purchase') {
        // ── Media Hub purchase ──────────────────────────────────────
        // Round 5: the checkout API can now stash a CART of multiple
        // offerings into the metadata under cart_part_0..N (chunked at
        // 480 chars to stay inside Stripe's 500-char per-field limit).
        // We reassemble + parse it here. When `cart_count > 0` we fan
        // out into N media_bookings rows; the legacy single-item path
        // (no cart parts) still works unchanged for direct API calls.
        const offeringTitle = meta.offering_title || meta.offering_slug;
        const buyerId = meta.buyer_id;
        const buyerName = meta.buyer_name || meta.buyer_email?.split('@')[0] || 'Buyer';
        const buyerEmail = session.customer_details?.email || meta.buyer_email;
        const bandId = meta.band_id || null;
        const amountPaid = session.amount_total || 0;
        const cartCount = parseInt(meta.cart_count || '0', 10);
        const cartParts = parseInt(meta.cart_parts || '0', 10);

        // Reassemble the cart JSON from chunks. If the buyer hit the
        // legacy single-item path, fall back to a synthetic cart with
        // ONE entry built from the flat metadata fields.
        let cart: Array<{
          offering_id: string;
          offering_slug: string;
          offering_title: string;
          offering_kind: string;
          studio_hours_included: number;
          price_cents: number;
          configured_components: unknown;
          project_details: unknown;
          summary: string;
        }> = [];

        if (cartCount > 0 && cartParts > 0) {
          let cartJson = '';
          for (let i = 0; i < cartParts; i++) {
            const chunk = meta[`cart_part_${i}`];
            if (typeof chunk === 'string') cartJson += chunk;
          }
          try {
            const parsed = JSON.parse(cartJson);
            if (Array.isArray(parsed)) cart = parsed;
          } catch {
            console.error('[webhook] media_purchase cart parse failed — falling back to single-item');
          }
        }

        if (cart.length === 0) {
          // Legacy single-item shape — build one cart entry from flat fields.
          let configuredComponents: unknown = null;
          if (meta.configured_components) {
            try {
              configuredComponents = JSON.parse(meta.configured_components);
            } catch {
              configuredComponents = { raw: meta.configured_components };
            }
          }
          let projectDetails: unknown = null;
          if (meta.project_details) {
            try {
              const parsed = JSON.parse(meta.project_details);
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                projectDetails = parsed;
              }
            } catch {
              projectDetails = { raw: meta.project_details };
            }
          }
          cart = [{
            offering_id: meta.offering_id || '',
            offering_slug: meta.offering_slug || '',
            offering_title: offeringTitle || '',
            offering_kind: meta.offering_kind || 'standalone',
            studio_hours_included: parseInt(meta.studio_hours_included || '0', 10),
            price_cents: amountPaid,
            configured_components: configuredComponents,
            project_details: projectDetails,
            summary: meta.configuration_summary || '',
          }];
        }

        // Track all created booking IDs + the total studio hours for
        // accounting (one studio_credits row per cart). The first row
        // is the "primary" booking — we use its id for XP + emails.
        const createdBookingIds: string[] = [];
        let primaryBookingId: string | null = null;
        let totalStudioHours = 0;

        // Round 6: Stripe now charges 50% deposit. Per-line full price
        // sits in the cart snapshot; per-line deposit is half (rounded
        // down to integer cents for Stripe). final_paid_at stays null
        // until admin marks the remainder paid via the future
        // /api/admin/media/bookings/[id] PATCH (same path that already
        // handles status flips + deliverables).
        const customerPhone = meta.customer_phone || null;

        for (let idx = 0; idx < cart.length; idx++) {
          const item = cart[idx];
          const fullPrice = Number(item.price_cents) || 0;
          const lineDeposit = Math.floor(fullPrice * 0.5);
          const { data: row, error: bookingErr } = await supabase
            .from('media_bookings')
            .insert({
              offering_id: item.offering_id,
              user_id: buyerId,
              band_id: bandId,
              status: 'deposited',
              configured_components: item.configured_components,
              project_details: item.project_details,
              // Full sticker price stored as final_price_cents; what was
              // actually charged today is deposit_cents. Remainder lives
              // in the gap (final - deposit) and gets billed later.
              final_price_cents: fullPrice,
              deposit_cents: lineDeposit,
              customer_phone: customerPhone,
              // Only the first row carries the Stripe payment intent / session
              // since they all share the same checkout session. Putting them
              // on every row would make the data redundant.
              stripe_payment_intent_id: idx === 0 ? (session.payment_intent as string) : null,
              stripe_session_id: session.id,
              deposit_paid_at: new Date().toISOString(),
              // final_paid_at stays NULL until admin charges the remainder.
              final_paid_at: null,
            })
            .select('id')
            .single();

          if (bookingErr) {
            console.error(
              `[webhook] media_bookings insert failed (item ${idx + 1}/${cart.length}):`,
              bookingErr,
            );
          } else if (row) {
            createdBookingIds.push((row as { id: string }).id);
            if (!primaryBookingId) primaryBookingId = (row as { id: string }).id;
          }

          totalStudioHours += Number(item.studio_hours_included) || 0;
        }

        // 2. If the cart includes studio hours, create ONE credit row
        //    ("gift card") for the total. Source-of-truth booking is
        //    the first row that had a positive hours grant. Owner is
        //    XOR'd per the studio_credits_owner_xor constraint.
        if (totalStudioHours > 0 && primaryBookingId) {
          const creditOwner = bandId
            ? { band_id: bandId, user_id: null }
            : { user_id: buyerId, band_id: null };

          const { error: creditErr } = await supabase.from('studio_credits').insert({
            ...creditOwner,
            source_booking_id: primaryBookingId,
            hours_granted: totalStudioHours,
            hours_used: 0,
            cost_basis_cents: amountPaid,
          });
          if (creditErr) {
            console.error('[webhook] studio_credits insert failed:', creditErr);
          }
        }

        // For the rest of the side-effect block we keep the legacy
        // variable names so the email + XP code below doesn't have to
        // change. `studioHours` is the total grant for the whole cart;
        // `newBooking` points to the primary row.
        const studioHours = totalStudioHours;
        const newBooking = primaryBookingId ? { id: primaryBookingId } : null;
        const offeringSlug = cart[0]?.offering_slug || meta.offering_slug || '';

        // 3. Award XP for the purchase — same hook the beat purchases use,
        //    same event name pattern. Skip silently if the buyer's profile
        //    isn't found (defensive — they should have one since checkout
        //    is gated on auth, but profile-row-creation is async via
        //    triggers, so brand-new users could race).
        if (buyerId && newBooking) {
          try {
            await awardXP(supabase, buyerId, 'book_session', {
              referenceId: newBooking.id,
              metadata: {
                kind: 'media_purchase',
                offering_slug: offeringSlug,
                amount_cents: amountPaid,
              },
            });
          } catch { /* skip XP on failure — never block the sale */ }
        }

        // 4. Confirmation email to the buyer + admin alert. Both are
        //    fire-and-forget (own try/catch inside the email helpers) so
        //    a Resend outage can never block the booking write or fail
        //    the webhook back to Stripe.
        //
        //    Round 6: cart-aware summary. For multi-item carts the
        //    summary lines come from cart_summary metadata (joined on
        //    ' || '); for legacy single-item flow we fall back to the
        //    older configuration_summary on ` · `. Phone shown to admin
        //    so they know how to reach the buyer.
        const configurationLines = meta.cart_summary
          ? meta.cart_summary.split(' || ').filter(Boolean)
          : meta.configuration_summary
            ? meta.configuration_summary.split(' · ').filter(Boolean)
            : [];
        const totalSticker = cart.reduce((sum, item) => sum + (Number(item.price_cents) || 0), 0);
        const totalDeposit = cart.reduce(
          (sum, item) => sum + Math.floor((Number(item.price_cents) || 0) * 0.5),
          0,
        );
        if (buyerEmail) {
          try {
            await sendMediaPurchaseConfirmation(buyerEmail, {
              buyerName,
              offeringTitle,
              amountPaid,
              studioHoursIncluded: studioHours,
              bandAttached: !!bandId,
              configurationLines,
              bookingId: newBooking?.id,
            });
          } catch (e) {
            console.error('[webhook] media confirmation email error:', e);
          }
        }
        try {
          await sendMediaPurchaseAdminAlert({
            buyerName,
            buyerEmail: buyerEmail || 'unknown',
            offeringTitle: cart.length > 1
              ? `${cart.length} media items (${cart.map((c) => c.offering_title).join(', ')})`
              : offeringTitle,
            amountPaid,
            studioHoursIncluded: studioHours,
            bandAttached: !!bandId,
            configurationLines,
            // Round 6: pass remainder + phone so the admin email shows
            // exactly what the team needs to plan the follow-up call.
            customerPhone: customerPhone,
            fullPriceTotal: totalSticker,
            depositPaid: totalDeposit,
            cartItemCount: cart.length,
          });
        } catch (e) {
          console.error('[webhook] media admin alert error:', e);
        }

        console.log(
          `[webhook] media_purchase processed: offering=${offeringSlug} buyer=${buyerName} (${buyerEmail}) band=${bandId || 'none'} hours=${studioHours} amount=${amountPaid}`,
        );
      } else if (meta.type === 'media_remainder' || meta.type === 'media_manual') {
        // ── Media Hub: remainder OR manual-link payment ──────────────────
        // Both types share the same completion semantics:
        //   • Stripe Payment Link finishes → checkout.session.completed
        //     fires → metadata.booking_id points us at the row.
        //   • We add session.amount_total to actual_deposit_paid; if the
        //     remainder hits 0, stamp final_paid_at + remainder_paid_at.
        //   • Audit log captures the completion verb (link_completed_*)
        //     so the admin history shows BOTH the link-sent + the eventual
        //     payment-arrived events.
        //
        // Why one combined branch for both types:
        //   • media_remainder = admin clicked "Charge remainder → Email link"
        //                       OR "Resend link"
        //   • media_manual    = admin created a manual booking with link
        //                       payment method
        //   The buyer's payment completion logic is identical — only the
        //   audit verb differs so admin history reads cleanly.
        //
        // Idempotency: webhook events can fire twice. We check whether
        // actual_deposit_paid already equals/exceeds the new total before
        // applying — a re-fired event won't double-credit the row.
        const bookingId = meta.booking_id;
        const amountPaid = session.amount_total || 0;
        const isResend = meta.resend === 'true';

        if (!bookingId || amountPaid <= 0) {
          console.error('[webhook] media_remainder/manual missing booking_id or amount', meta);
        } else {
          // Read the row so we can decide: full payment vs. partial.
          const { data: rowBefore } = await supabase
            .from('media_bookings')
            .select('final_price_cents, deposit_cents, actual_deposit_paid, final_paid_at, user_id, offering_id, customer_phone')
            .eq('id', bookingId)
            .maybeSingle();

          type MediaRow = {
            final_price_cents: number;
            deposit_cents: number | null;
            actual_deposit_paid: number | null;
            final_paid_at: string | null;
            user_id: string;
            offering_id: string;
            customer_phone: string | null;
          };
          const row = rowBefore as MediaRow | null;

          if (!row) {
            console.error('[webhook] media_remainder/manual: booking not found', bookingId);
          } else {
            const previousPaid = row.actual_deposit_paid ?? 0;
            const newPaid = Math.min(row.final_price_cents, previousPaid + amountPaid);
            const newRemainder = Math.max(0, row.final_price_cents - newPaid);

            const updates: Record<string, unknown> = {
              actual_deposit_paid: newPaid,
            };
            // First time fully paid → stamp the timestamps. Idempotent
            // because we only stamp when final_paid_at is currently null.
            if (newRemainder === 0 && !row.final_paid_at) {
              const nowIso = new Date().toISOString();
              updates.final_paid_at = nowIso;
              updates.remainder_paid_at = nowIso;
              // Manual bookings created at status='inquiry' move to
              // 'deposited' upon receipt of payment so they appear in
              // the admin's working queue.
              if (meta.type === 'media_manual') {
                updates.status = 'deposited';
                updates.deposit_paid_at = nowIso;
                updates.deposit_cents = newPaid;
                updates.stripe_session_id = session.id;
                if (typeof session.payment_intent === 'string') {
                  updates.stripe_payment_intent_id = session.payment_intent;
                }
              }
            }

            await supabase
              .from('media_bookings')
              .update(updates)
              .eq('id', bookingId);

            // Audit verb depends on type + resend flag so admin history
            // shows distinct events for each pathway.
            const action =
              meta.type === 'media_manual'
                ? 'manual_link_completed'
                : isResend
                ? 'remainder_link_resend_completed'
                : 'remainder_link_completed';

            await supabase.from('media_booking_audit_log').insert({
              booking_id: bookingId,
              action,
              performed_by: 'stripe_webhook',
              details: {
                amount_cents: amountPaid,
                previous_paid: previousPaid,
                new_paid: newPaid,
                new_remainder: newRemainder,
                stripe_session_id: session.id,
                resend: isResend,
              },
            });

            console.log(
              `[webhook] ${action} processed: booking=${bookingId} amount=${amountPaid} new_remainder=${newRemainder}`,
            );
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

      // Only process if we haven't already (check if booking exists).
      // Accepts both 'booking_deposit' (solo) and 'band_booking_deposit'
      // because Cash App / async payments use the same metadata shape.
      if (asyncMeta.type === 'booking_deposit' || asyncMeta.type === 'band_booking_deposit') {
        const { data: existing } = await supabase
          .from('bookings')
          .select('id')
          .eq('stripe_checkout_session_id', asyncSession.id)
          .single();

        if (!existing) {
          // Same logic as checkout.session.completed for booking_deposit
          const startDateTime = `${asyncMeta.session_date}T${asyncMeta.start_time}:00`;
          const endDateTime = `${asyncMeta.session_date}T${asyncMeta.end_time}:00`;
          const isAsyncBandBooking = asyncMeta.type === 'band_booking_deposit';
          // Bands always get a priority window even if asyncMeta.engineer is empty —
          // mirrors the sync branch's defense-in-depth so Iszac never gets bypassed.
          const priorityExpiry = (asyncMeta.engineer || isAsyncBandBooking)
            ? calculatePriorityExpiry(startDateTime)
            : null;
          const rescheduleDeadline = calculateRescheduleDeadline(startDateTime);

          const { data: newBooking, error: asyncInsErr } = await supabase.from('bookings').insert({
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
            band_id: asyncMeta.band_id || null,
            // Free setup hour padding (migration 041) — same shape as the
            // sync branch above. Async (Cash App / bank transfer) bookings
            // need to honor this too or the calendar would under-block.
            setup_minutes_before: parseInt(asyncMeta.setup_minutes_before || '0', 10) || 0,
          }).select().single();
          if (asyncInsErr || !newBooking) {
            console.error('[webhook] async-payment booking insert failed — rolling back claim:', asyncInsErr);
            await supabase.from('stripe_webhook_events').delete().eq('event_id', event.id);
            return NextResponse.json(
              { error: asyncInsErr?.message || 'Async booking insert failed' },
              { status: 500 },
            );
          }

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
          if (isAsyncBandBooking) {
            // Band sessions: always Iszac, never fan out — same routing as
            // the sync branch above. Iszac reschedules with the band directly
            // if he can't take it; no other engineer can claim a band session.
            const iszac = ENGINEERS.find((e) => e.displayName === 'Iszac');
            if (iszac && priorityExpiry) {
              const priorityLabel = getPriorityHoursLabel(priorityExpiry);
              await sendEngineerPriorityAlert(iszac.email, {
                id: newBooking?.id || '', customerName: asyncMeta.customer_name,
                date: dateStr, startTime: timeStr, duration, room: asyncMeta.room,
                priorityHours: priorityLabel,
              });
            }
          } else if (asyncMeta.engineer && priorityExpiry) {
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
      } else if (asyncMeta.type === 'media_remainder' || asyncMeta.type === 'media_manual') {
        // ── Media Hub: async-payment completion (Cash App / bank xfer) ──
        // Mirrors the synchronous handler in checkout.session.completed.
        // Same idempotency rules: only stamp final_paid_at if it wasn't
        // already set, and never apply more than (final_price_cents -
        // previously_paid).
        const bookingId = asyncMeta.booking_id;
        const amountPaid = asyncSession.amount_total || 0;
        const isResend = asyncMeta.resend === 'true';

        if (bookingId && amountPaid > 0) {
          const { data: rowBefore } = await supabase
            .from('media_bookings')
            .select('final_price_cents, deposit_cents, actual_deposit_paid, final_paid_at')
            .eq('id', bookingId)
            .maybeSingle();

          type MediaRow = {
            final_price_cents: number;
            deposit_cents: number | null;
            actual_deposit_paid: number | null;
            final_paid_at: string | null;
          };
          const row = rowBefore as MediaRow | null;

          if (row) {
            const previousPaid = row.actual_deposit_paid ?? 0;
            const newPaid = Math.min(row.final_price_cents, previousPaid + amountPaid);
            const newRemainder = Math.max(0, row.final_price_cents - newPaid);

            const updates: Record<string, unknown> = {
              actual_deposit_paid: newPaid,
            };
            if (newRemainder === 0 && !row.final_paid_at) {
              const nowIso = new Date().toISOString();
              updates.final_paid_at = nowIso;
              updates.remainder_paid_at = nowIso;
              if (asyncMeta.type === 'media_manual') {
                updates.status = 'deposited';
                updates.deposit_paid_at = nowIso;
                updates.deposit_cents = newPaid;
                updates.stripe_session_id = asyncSession.id;
                if (typeof asyncSession.payment_intent === 'string') {
                  updates.stripe_payment_intent_id = asyncSession.payment_intent;
                }
              }
            }

            await supabase
              .from('media_bookings')
              .update(updates)
              .eq('id', bookingId);

            const action =
              asyncMeta.type === 'media_manual'
                ? 'manual_link_completed_async'
                : isResend
                ? 'remainder_link_resend_completed_async'
                : 'remainder_link_completed_async';

            await supabase.from('media_booking_audit_log').insert({
              booking_id: bookingId,
              action,
              performed_by: 'stripe_webhook',
              details: {
                amount_cents: amountPaid,
                previous_paid: previousPaid,
                new_paid: newPaid,
                new_remainder: newRemainder,
                stripe_session_id: asyncSession.id,
                resend: isResend,
                async: true,
              },
            });
          }
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
