import { PRICING, ROOM_RATES, ROOM_RATES_SINGLE, SUPER_ADMINS, type Room, type UserRole } from './constants';

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
): { subtotal: number; afterHoursFee: number; sameDayFee: number; discount: number; total: number; deposit: number } {
  const baseRate = hours === 1 ? ROOM_RATES_SINGLE[room] : ROOM_RATES[room];
  const subtotal = baseRate * hours;

  const afterHoursFee = isAfterHours(startHour) ? PRICING.afterHoursSurcharge * hours : 0;
  const sameDayFee = isSameDayBooking ? PRICING.sameDaySurcharge * hours : 0;
  const discount = hours >= 3 ? PRICING.threeHourDiscount : 0;

  const total = subtotal + afterHoursFee + sameDayFee - discount;
  const deposit = Math.round(total * (PRICING.depositPercent / 100));

  return { subtotal, afterHoursFee, sameDayFee, discount, total, deposit };
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
