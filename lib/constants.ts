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
    'recording studio Fort Wayne Indiana',
    'music production Fort Wayne',
    'studio booking online',
    'mixing and mastering Fort Wayne',
    'professional recording studio',
    'studio rental Fort Wayne',
    'vocal recording Fort Wayne',
    'band recording Indiana',
    'buy beats online',
    'beat store',
    'music studio 24 hours',
    'affordable recording studio',
    'recording session booking',
    'Sweet Dreams Music',
  ],
};

export const GEO = {
  region: 'US-IN',
  placeName: 'Fort Wayne',
};

export const PRICING = {
  studioA: 7000, // $70/hr in cents
  studioB: 5000, // $50/hr in cents (2+ hours)
  studioASingleHour: 8000, // $80 for 1-hour session
  studioBSingleHour: 6000, // $60 for 1-hour session
  lateNightSurcharge: 1000, // +$10/hr (10PM–2AM)
  deepNightSurcharge: 3000, // +$30/hr (2AM–9AM)
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
  // Open 24 hours
  regular: { start: 9, end: 22 }, // 9 AM - 10 PM (no surcharge)
  lateNight: { start: 22, end: 2 }, // 10 PM - 2 AM (+$10/hr)
  deepNight: { start: 2, end: 9 }, // 2 AM - 9 AM (+$30/hr)
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
  { name: 'PRVRB', displayName: 'PRVRB', email: 'prvrbsounds@gmail.com', specialties: ['Recording', 'Mixing & Mastering', 'Production'], studios: ['studio_a'] as Room[] },
  { name: 'Iszac Griner', displayName: 'Iszac', email: 'iisszzaacc@gmail.com', specialties: ['Recording', 'Mixing & Mastering', 'Production'], studios: ['studio_a', 'studio_b'] as Room[] },
  { name: 'Zion Tinsley', displayName: 'Zion', email: 'zionomari@artsaturated.com', specialties: ['Recording', 'Mixing & Mastering', 'Production'], studios: ['studio_b'] as Room[] },
  { name: 'Jay Val Leo', displayName: 'Jay Val Leo', email: 'jayvalleo@sweetdreamsmusic.com', specialties: ['Recording', 'Mixing & Mastering', 'Production'], studios: ['studio_b'] as Room[] },
] as const;

// Super admins — full access to everything
export const SUPER_ADMINS = [
  'cole@sweetdreams.us',
  'jayvalleo@sweetdreams.us',
  'jayvalleo@sweetdreamsmusic.com',
] as const;

export const TIMEZONE = 'America/Indiana/Indianapolis';

// Studio A is only available 6:30 PM+ on weekdays (Mon-Fri), all day on weekends
export const STUDIO_A_WEEKDAY_START = 18.5; // 6:30 PM

// Beat store license types
export const BEAT_LICENSES = {
  mp3_lease: {
    name: 'MP3 Lease',
    description: 'MP3 download. Non-exclusive license for streaming and personal projects.',
    deliveryFormat: 'MP3 (320kbps)',
    defaultPrice: 2999, // $29.99
  },
  trackout_lease: {
    name: 'Trackout Lease',
    description: 'Stems/trackouts + MP3. Non-exclusive license for mixing, distribution, and streaming.',
    deliveryFormat: 'Stems + MP3',
    defaultPrice: 7499, // $74.99
  },
  exclusive: {
    name: 'Exclusive Rights',
    description: 'Full ownership. Beat removed from store. All rights transferred.',
    deliveryFormat: 'WAV + Stems + Trackout + MP3',
    defaultPrice: 40000, // $400.00
  },
} as const;

export type BeatLicenseType = keyof typeof BEAT_LICENSES;

// Beat store commission rates
export const PRODUCER_COMMISSION = 0.60; // 60% to producer
export const PLATFORM_COMMISSION = 0.40; // 40% to platform
export const EXCLUSIVE_PRICE_FLOOR = 40000; // $400 minimum exclusive price in cents

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
