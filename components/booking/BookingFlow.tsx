'use client';

import { useState, useMemo } from 'react';
import { Calendar, Clock, Home, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { PRICING, ROOMS, ROOM_LABELS, ROOM_RATES, ENGINEERS, STUDIO_HOURS, type Room } from '@/lib/constants';
import { formatCents, cn, isAfterHours, isSameDay, calculateSessionTotal, formatTime } from '@/lib/utils';

type Step = 'date' | 'time' | 'details' | 'review';

const STEPS: { key: Step; label: string; icon: typeof Calendar }[] = [
  { key: 'date', label: 'Date', icon: Calendar },
  { key: 'time', label: 'Time & Duration', icon: Clock },
  { key: 'details', label: 'Studio & Engineer', icon: Home },
  { key: 'review', label: 'Review & Pay', icon: User },
];

function generateTimeSlots() {
  const slots: string[] = [];
  for (let h = STUDIO_HOURS.regular.start; h < STUDIO_HOURS.regular.end; h++) {
    slots.push(`${h}:00`);
  }
  for (let h = STUDIO_HOURS.afterHours.start; h <= 23; h++) {
    slots.push(`${h}:00`);
  }
  for (let h = 0; h < STUDIO_HOURS.afterHours.end; h++) {
    slots.push(`${h}:00`);
  }
  return slots;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookingFlow() {
  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(2);
  const [room, setRoom] = useState<Room>('studio_a');
  const [engineer, setEngineer] = useState<string>('any');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const startHour = selectedTime ? parseInt(selectedTime.split(':')[0]) : 0;
  const isSameDayBooking = selectedDate ? isSameDay(selectedDate) : false;

  const pricing = useMemo(() => {
    return calculateSessionTotal(room, duration, startHour, isSameDayBooking);
  }, [room, duration, startHour, isSameDayBooking]);

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  function canProceed(): boolean {
    switch (step) {
      case 'date': return selectedDate !== null;
      case 'time': return selectedTime !== null;
      case 'details': return true;
      case 'review': return customerName.trim() !== '' && customerEmail.trim() !== '';
      default: return false;
    }
  }

  function nextStep() {
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  }

  function prevStep() {
    const idx = currentStepIndex;
    if (idx > 0) setStep(STEPS[idx - 1].key);
  }

  async function handleCheckout() {
    if (!selectedDate || !selectedTime) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString().split('T')[0],
          startTime: selectedTime,
          duration,
          room,
          engineer: engineer === 'any' ? null : engineer,
          customerName,
          customerEmail,
          customerPhone,
          notes,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setIsSubmitting(false);
    }
  }

  function isPastDate(day: number): boolean {
    const date = new Date(calYear, calMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  }

  function isSelectedDate(day: number): boolean {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === calYear &&
      selectedDate.getMonth() === calMonth &&
      selectedDate.getDate() === day
    );
  }

  return (
    <div>
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => i <= currentStepIndex && setStep(s.key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors',
                i === currentStepIndex ? 'text-black' :
                i < currentStepIndex ? 'text-accent cursor-pointer' :
                'text-black/30 cursor-default'
              )}
            >
              <s.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('w-8 h-px', i < currentStepIndex ? 'bg-accent' : 'bg-black/10')} />
            )}
          </div>
        ))}
      </div>

      {/* Step: Date */}
      {step === 'date' && (
        <div>
          <h2 className="text-heading-lg mb-6">SELECT A DATE</h2>

          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                else setCalMonth(calMonth - 1);
              }}
              className="p-2 hover:bg-black/5 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-heading-sm">{MONTH_NAMES[calMonth]} {calYear}</h3>
            <button
              onClick={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                else setCalMonth(calMonth + 1);
              }}
              className="p-2 hover:bg-black/5 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-8">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center font-mono text-xs text-black/40 uppercase py-2">{d}</div>
            ))}
            {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
              const day = i + 1;
              const past = isPastDate(day);
              const selected = isSelectedDate(day);
              return (
                <button
                  key={day}
                  disabled={past}
                  onClick={() => setSelectedDate(new Date(calYear, calMonth, day))}
                  className={cn(
                    'aspect-square flex items-center justify-center font-mono text-sm transition-colors',
                    past && 'text-black/20 cursor-not-allowed',
                    !past && !selected && 'hover:bg-black/5 cursor-pointer',
                    selected && 'bg-black text-white'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <p className="font-mono text-sm text-black/60 mb-4">
              Selected: <strong className="text-black">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </strong>
              {isSameDay(selectedDate) && (
                <span className="text-accent ml-2">(Same-day: +$10/hr)</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Step: Time & Duration */}
      {step === 'time' && (
        <div>
          <h2 className="text-heading-lg mb-6">CHOOSE YOUR TIME</h2>

          <div className="mb-8">
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">Start Time</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {timeSlots.map((slot) => {
                const hour = parseInt(slot.split(':')[0]);
                const afterHours = isAfterHours(hour);
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={cn(
                      'px-3 py-3 font-mono text-sm border transition-colors text-center',
                      selectedTime === slot ? 'bg-black text-white border-black' : 'border-black/20 hover:border-black',
                      afterHours && selectedTime !== slot && 'border-accent/30 text-black/70'
                    )}
                  >
                    {formatTime(slot)}
                    {afterHours && <span className="block text-[10px] text-accent">+$10/hr</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
              Duration: {duration} hour{duration > 1 ? 's' : ''}
              {duration >= 3 && <span className="text-accent ml-2">($10 off!)</span>}
            </h3>
            <div className="flex gap-2">
              {Array.from({ length: PRICING.maxHours }, (_, i) => i + 1).map((h) => (
                <button
                  key={h}
                  onClick={() => setDuration(h)}
                  className={cn(
                    'w-14 h-14 font-mono text-lg font-bold border transition-colors',
                    duration === h ? 'bg-black text-white border-black' : 'border-black/20 hover:border-black'
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: Studio & Engineer */}
      {step === 'details' && (
        <div>
          <h2 className="text-heading-lg mb-6">STUDIO & ENGINEER</h2>

          <div className="mb-8">
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">Select Studio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROOMS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoom(r)}
                  className={cn(
                    'p-6 border-2 font-mono text-left transition-colors',
                    room === r ? 'border-black bg-black text-white' : 'border-black/20 hover:border-black'
                  )}
                >
                  <Home className={cn('w-6 h-6 mb-3', room === r ? 'text-accent' : 'text-black/40')} />
                  <p className="font-bold text-sm uppercase tracking-wider">{ROOM_LABELS[r]}</p>
                  <p className={cn('text-xs mt-1', room === r ? 'text-white/60' : 'text-black/40')}>
                    {formatCents(ROOM_RATES[r])}/hour
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
              Request an Engineer <span className="font-normal text-black/40">(not guaranteed)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setEngineer('any')}
                className={cn(
                  'p-4 border-2 font-mono text-sm text-left transition-colors',
                  engineer === 'any' ? 'border-black bg-black text-white' : 'border-black/20 hover:border-black'
                )}
              >
                <p className="font-bold uppercase tracking-wider">Any Available</p>
                <p className={cn('text-xs mt-1', engineer === 'any' ? 'text-white/60' : 'text-black/40')}>
                  We&apos;ll match you
                </p>
              </button>
              {ENGINEERS.map((eng) => (
                <button
                  key={eng.name}
                  onClick={() => setEngineer(eng.name)}
                  className={cn(
                    'p-4 border-2 font-mono text-sm text-left transition-colors',
                    engineer === eng.name ? 'border-black bg-black text-white' : 'border-black/20 hover:border-black'
                  )}
                >
                  <p className="font-bold uppercase tracking-wider">{eng.displayName}</p>
                  <p className={cn('text-xs mt-1', engineer === eng.name ? 'text-white/60' : 'text-black/40')}>
                    {eng.specialties.join(', ')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: Review & Pay Deposit */}
      {step === 'review' && (
        <div>
          <h2 className="text-heading-lg mb-6">REVIEW & PAY DEPOSIT</h2>

          <div className="border-2 border-black p-6 sm:p-8 mb-8">
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">Session Summary</h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-black/60">Date</span>
                <span className="font-semibold">
                  {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">Time</span>
                <span className="font-semibold">{selectedTime && formatTime(selectedTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">Duration</span>
                <span className="font-semibold">{duration} hour{duration > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">Studio</span>
                <span className="font-semibold">{ROOM_LABELS[room]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">Engineer Request</span>
                <span className="font-semibold">{engineer === 'any' ? 'Any Available' : engineer}</span>
              </div>

              <hr className="border-black/10 my-4" />

              <div className="flex justify-between">
                <span className="text-black/60">
                  {ROOM_LABELS[room]} ({duration}hr x {formatCents(ROOM_RATES[room])})
                </span>
                <span>{formatCents(pricing.subtotal)}</span>
              </div>
              {pricing.afterHoursFee > 0 && (
                <div className="flex justify-between text-black/70">
                  <span>After-hours surcharge ({duration}hr x {formatCents(PRICING.afterHoursSurcharge)})</span>
                  <span>+{formatCents(pricing.afterHoursFee)}</span>
                </div>
              )}
              {pricing.sameDayFee > 0 && (
                <div className="flex justify-between text-black/70">
                  <span>Same-day booking ({duration}hr x {formatCents(PRICING.sameDaySurcharge)})</span>
                  <span>+{formatCents(pricing.sameDayFee)}</span>
                </div>
              )}
              {pricing.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>3+ hour discount</span>
                  <span>-{formatCents(pricing.discount)}</span>
                </div>
              )}

              <hr className="border-black/10 my-4" />

              <div className="flex justify-between">
                <span className="text-black/60">Session Total</span>
                <span>{formatCents(pricing.total)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Deposit Due Now (50%)</span>
                <span className="text-accent">{formatCents(pricing.deposit)}</span>
              </div>
              <p className="text-xs text-black/40 mt-2">
                Remainder ({formatCents(pricing.total - pricing.deposit)}) charged after your session. Your payment method will be saved on file.
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 mb-8">
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">Your Info</h3>
            <div>
              <label htmlFor="customerName" className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Name *</label>
              <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required
                className="w-full border-2 border-black px-4 py-3 font-mono text-sm bg-transparent focus:border-accent focus:outline-none" placeholder="Your name" />
            </div>
            <div>
              <label htmlFor="customerEmail" className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Email *</label>
              <input type="email" id="customerEmail" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required
                className="w-full border-2 border-black px-4 py-3 font-mono text-sm bg-transparent focus:border-accent focus:outline-none" placeholder="your@email.com" />
            </div>
            <div>
              <label htmlFor="customerPhone" className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Phone</label>
              <input type="tel" id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border-2 border-black px-4 py-3 font-mono text-sm bg-transparent focus:border-accent focus:outline-none" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label htmlFor="notes" className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Notes</label>
              <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="w-full border-2 border-black px-4 py-3 font-mono text-sm bg-transparent focus:border-accent focus:outline-none resize-vertical" placeholder="Anything we should know..." />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-8 border-t border-black/10">
        {currentStepIndex > 0 ? (
          <button onClick={prevStep}
            className="font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors inline-flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}

        {step === 'review' ? (
          <button onClick={handleCheckout} disabled={!canProceed() || isSubmitting}
            className="bg-accent text-black font-mono text-base font-bold uppercase tracking-wider px-8 py-4 hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
            {isSubmitting ? 'PROCESSING...' : `PAY DEPOSIT ${formatCents(pricing.deposit)}`}
          </button>
        ) : (
          <button onClick={nextStep} disabled={!canProceed()}
            className="bg-black text-white font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
