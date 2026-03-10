export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sweetdreamsmusic.com';

export const BRAND = {
  name: 'Sweet Dreams Music',
  legalName: 'Sweet Dreams LLC',
  tagline: 'Fort Wayne Recording Studio',
  phone: '',
  email: 'info@sweetdreamsmusic.com',
  address: {
    street: '',
    city: 'Fort Wayne',
    state: 'IN',
    zip: '',
    country: 'US',
  },
};

export const SEO = {
  defaultTitle: 'Sweet Dreams Music — Fort Wayne Recording Studio',
  titleTemplate: '%s | Sweet Dreams Music — Fort Wayne Recording Studio',
  defaultDescription: 'Professional recording studio in Fort Wayne, IN. Book sessions starting at $60/hour. Band recording available.',
  keywords: [
    'Fort Wayne recording studio',
    'recording studio near me',
    'music production Fort Wayne',
    'studio booking',
    'mixing and mastering',
    'professional recording',
    'studio rental Fort Wayne',
    'buy beats online',
    'beat store',
  ],
};

export const GEO = {
  region: 'US-IN',
  placeName: 'Fort Wayne',
};

export const PRICING = {
  studioA: 7000, // $70/hr in cents
  studioB: 6000, // $60/hr in cents
  studioASingleHour: 8000, // $80 for 1-hour session
  studioBSingleHour: 7000, // $70 for 1-hour session
  afterHoursSurcharge: 1000, // +$10/hr
  sameDaySurcharge: 1000, // +$10/hr
  depositPercent: 50, // 50% deposit
  minHours: 1,
  maxHours: 8,
  currency: 'usd' as const,
};

// Sweet Spot deals — flat rate for 4 hours
export const SWEET_SPOTS = {
  studio_a: { hours: 4, price: 26000, label: 'Studio A Sweet Spot', perHour: 6500 }, // $260
  studio_b: { hours: 4, price: 18000, label: 'Studio B Sweet Spot', perHour: 4500 }, // $180
} as const;

// Band Recording — Studio A only
export const BAND_PRICING = [
  { hours: 4, price: 40000, label: '4 Hours', perHour: 10000, note: 'Minimum booking' },
  { hours: 8, price: 68000, label: '8 Hours', perHour: 8500, note: '$85/hour' },
  { hours: 24, price: 180000, label: '3 Days (8hr each)', perHour: 7500, note: '$75/hour' },
] as const;

export const STUDIO_HOURS = {
  regular: { start: 9, end: 21 }, // 9 AM - 9 PM
  afterHours: { start: 21, end: 3 }, // 9 PM - 3 AM
};

export const ROOMS = ['studio_a', 'studio_b'] as const;
export type Room = (typeof ROOMS)[number];

export const ROOM_LABELS: Record<Room, string> = {
  studio_a: 'Studio A',
  studio_b: 'Studio B',
};

export const ROOM_RATES: Record<Room, number> = {
  studio_a: PRICING.studioA,
  studio_b: PRICING.studioB,
};

export const ROOM_RATES_SINGLE: Record<Room, number> = {
  studio_a: PRICING.studioASingleHour,
  studio_b: PRICING.studioBSingleHour,
};

export const ENGINEERS = [
  { name: 'PRVRB', displayName: 'PRVRB', specialties: ['Recording', 'Mixing & Mastering', 'Production'], studios: ['studio_a'] as Room[] },
  { name: 'Iszac Griner', displayName: 'Iszac', specialties: ['Recording', 'Mixing & Mastering', 'Production'], studios: ['studio_a', 'studio_b'] as Room[] },
  { name: 'Zion Tinsley', displayName: 'Zion', specialties: ['Recording', 'Mixing & Mastering', 'Production'], studios: ['studio_b'] as Room[] },
  { name: 'Jay', displayName: 'Jay', specialties: ['Recording', 'Mixing & Mastering', 'Production'], studios: ['studio_b'] as Room[] },
] as const;

// Super admins — full access to everything
export const SUPER_ADMINS = [
  'cole@sweetdreams.us',
  'jayvalleo@sweetdreams.us',
] as const;

// Beat store license types
export const BEAT_LICENSES = {
  mp3_lease: {
    name: 'MP3 Lease',
    description: 'MP3 download. Non-exclusive license for streaming and personal projects.',
    deliveryFormat: 'MP3 (320kbps)',
  },
  wav_lease: {
    name: 'WAV Lease',
    description: 'WAV + MP3 download. Non-exclusive license for distribution and streaming.',
    deliveryFormat: 'WAV + MP3',
  },
  unlimited: {
    name: 'Unlimited License',
    description: 'WAV + Stems. Unlimited streams, sales, and performances. Non-exclusive.',
    deliveryFormat: 'WAV + Stems + MP3',
  },
  exclusive: {
    name: 'Exclusive Rights',
    description: 'Full ownership. Beat removed from store. All rights transferred.',
    deliveryFormat: 'WAV + Stems + MP3 + Trackout',
  },
} as const;

export type BeatLicenseType = keyof typeof BEAT_LICENSES;

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/book', label: 'Book' },
  { href: '/beats', label: 'Beats' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/engineers', label: 'Engineers' },
  { href: '/media', label: 'Media' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export type UserRole = 'user' | 'engineer' | 'admin';
