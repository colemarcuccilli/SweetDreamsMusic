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

export function isAfterHours(hour: number): boolean {
  return hour >= 21 || hour < 3;
}

export function isSameDay(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function calculateSessionTotal(
  room: Room,
  hours: number,
  startHour: number,
  isSameDayBooking: boolean
): { subtotal: number; afterHoursFee: number; sameDayFee: number; sweetSpot: boolean; total: number; deposit: number } {
  // Check for Sweet Spot deal (4 hours flat rate)
  const spot = SWEET_SPOTS[room];
  const isSweetSpot = hours === spot.hours;

  let subtotal: number;
  if (isSweetSpot) {
    subtotal = spot.price;
  } else if (hours === 1) {
    subtotal = ROOM_RATES_SINGLE[room];
  } else {
    subtotal = ROOM_RATES[room] * hours;
  }

  const afterHoursFee = isAfterHours(startHour) ? PRICING.afterHoursSurcharge * hours : 0;
  const sameDayFee = isSameDayBooking ? PRICING.sameDaySurcharge * hours : 0;

  const total = subtotal + afterHoursFee + sameDayFee;
  const deposit = Math.round(total * (PRICING.depositPercent / 100));

  return { subtotal, afterHoursFee, sameDayFee, sweetSpot: isSweetSpot, total, deposit };
}

export function getUserRole(email: string | undefined, profileRole?: string): UserRole {
  if (!email) return 'user';
  if (SUPER_ADMINS.includes(email as typeof SUPER_ADMINS[number])) return 'admin';
  if (profileRole === 'engineer') return 'engineer';
  return 'user';
}

export function formatTime(slot: string): string {
  const hour = parseInt(slot.split(':')[0]);
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}
