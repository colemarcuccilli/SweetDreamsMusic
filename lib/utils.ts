import { PRICING, ROOM_RATES, ROOM_RATES_SINGLE, SWEET_SPOTS, SUPER_ADMINS, type Room, type UserRole } from './constants';

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Returns the surcharge tier for a given hour (0-23, can be decimal like 18.5) */
export function getHourSurcharge(hour: number): { tier: 'regular' | 'lateNight' | 'deepNight'; amount: number } {
  const h = Math.floor(hour) % 24;
  // 2AM-8AM: deep night (+$30/hr)
  if (h >= 2 && h < 9) return { tier: 'deepNight', amount: PRICING.deepNightSurcharge };
  // 10PM-1AM: late night (+$10/hr)
  if (h >= 22 || h < 2) return { tier: 'lateNight', amount: PRICING.lateNightSurcharge };
  // 9AM-10PM: regular (no surcharge)
  return { tier: 'regular', amount: 0 };
}

export function isSameDay(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export type HourBreakdown = {
  hour: number;
  baseRate: number;
  nightFee: number;
  sameDayFee: number;
  hourTotal: number;
  tier: 'regular' | 'lateNight' | 'deepNight';
};

export type SessionPricing = {
  subtotal: number;
  hourBreakdown: HourBreakdown[];
  nightFees: number;
  sameDayFee: number;
  sweetSpot: boolean;
  total: number;
  deposit: number;
};

export function calculateSessionTotal(
  room: Room,
  hours: number,
  startHour: number,
  isSameDayBooking: boolean
): SessionPricing {
  // Check for Sweet Spot deal (4 hours flat rate)
  const spot = SWEET_SPOTS[room];
  const isSweetSpot = hours === spot.hours;

  // Calculate base rate per hour
  let basePerHour: number;
  if (isSweetSpot) {
    basePerHour = spot.perHour;
  } else if (hours === 1) {
    basePerHour = ROOM_RATES_SINGLE[room];
  } else {
    basePerHour = ROOM_RATES[room];
  }

  // Build per-hour breakdown (startHour can be decimal, e.g. 18.5 for 6:30 PM)
  const hourBreakdown: HourBreakdown[] = [];
  let nightFees = 0;
  let sameDayFee = 0;

  for (let i = 0; i < hours; i++) {
    const h = (startHour + i) % 24;
    const surcharge = getHourSurcharge(Math.floor(h));
    const sdFee = isSameDayBooking ? PRICING.sameDaySurcharge : 0;

    const entry: HourBreakdown = {
      hour: h,
      baseRate: basePerHour,
      nightFee: surcharge.amount,
      sameDayFee: sdFee,
      hourTotal: basePerHour + surcharge.amount + sdFee,
      tier: surcharge.tier,
    };

    hourBreakdown.push(entry);
    nightFees += surcharge.amount;
    sameDayFee += sdFee;
  }

  const subtotal = isSweetSpot ? spot.price : basePerHour * hours;
  const total = subtotal + nightFees + sameDayFee;
  const deposit = Math.round(total * (PRICING.depositPercent / 100));

  return { subtotal, hourBreakdown, nightFees, sameDayFee, sweetSpot: isSweetSpot, total, deposit };
}

export function getUserRole(email: string | undefined, profileRole?: string): UserRole {
  if (!email) return 'user';
  if (SUPER_ADMINS.includes(email.toLowerCase() as typeof SUPER_ADMINS[number])) return 'admin';
  if (profileRole === 'engineer') return 'engineer';
  return 'user';
}

export function formatTime(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  const min = (m || 0) >= 30 ? ':30' : ':00';
  if (h === 0) return `12${min} AM`;
  if (h < 12) return `${h}${min} AM`;
  if (h === 12) return `12${min} PM`;
  return `${h - 12}${min} PM`;
}

/** Parse "18:30" → 18.5 */
export function parseTimeSlot(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + (m || 0) / 60;
}

/** Convert decimal hour 18.5 → "18:30" */
export function decimalToTimeStr(dec: number): string {
  const h = Math.floor(dec) % 24;
  const m = dec % 1 >= 0.5 ? '30' : '00';
  return `${h}:${m}`;
}
