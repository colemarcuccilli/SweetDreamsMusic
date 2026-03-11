import { SITE_URL, BRAND, PRICING, ENGINEERS } from '@/lib/constants';
import { formatCents } from '@/lib/utils';

function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['RecordingStudio', 'LocalBusiness', 'MusicGroup'],
    '@id': `${SITE_URL}/#organization`,
    name: 'Sweet Dreams Music',
    alternateName: 'Sweet Dreams Music LLC',
    description: 'Professional recording studio in Fort Wayne, Indiana. Two studios, four engineers, open 24 hours. Recording, mixing, mastering, and music production services. Sessions starting at $50/hour.',
    url: SITE_URL,
    telephone: '',
    email: BRAND.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Fort Wayne',
      addressRegion: 'IN',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 41.0793,
      longitude: -85.1394,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    priceRange: `${formatCents(PRICING.studioB)} - ${formatCents(PRICING.studioASingleHour)}/hour`,
    currenciesAccepted: 'USD',
    paymentAccepted: 'Credit Card',
    areaServed: {
      '@type': 'City',
      name: 'Fort Wayne',
      containedIn: {
        '@type': 'State',
        name: 'Indiana',
      },
    },
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: ENGINEERS.length,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Recording Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Studio A Recording Session',
            description: 'Premium recording room with professional acoustics and equipment. Ideal for vocals, instruments, and full production.',
          },
          price: (PRICING.studioA / 100).toFixed(2),
          priceCurrency: 'USD',
          unitText: 'per hour',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Studio B Recording Session',
            description: 'Versatile recording studio for all session types. Professional equipment and acoustics.',
          },
          price: (PRICING.studioB / 100).toFixed(2),
          priceCurrency: 'USD',
          unitText: 'per hour',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Mixing & Mastering',
            description: 'Industry-standard mixing and mastering to make your tracks sound polished and radio-ready.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Music Production',
            description: 'Full music production from beat-making to arrangement and sound design.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Band Recording',
            description: 'Multi-instrument band recording in Studio A. 4-hour, 8-hour, and multi-day packages available.',
          },
          price: '400.00',
          priceCurrency: 'USD',
          unitText: 'starting at',
        },
      ],
    },
    sameAs: [],
    knowsAbout: [
      'Music Recording',
      'Audio Mixing',
      'Audio Mastering',
      'Music Production',
      'Beat Making',
      'Vocal Recording',
      'Band Recording',
      'Sound Design',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Sweet Dreams Music',
    url: SITE_URL,
    description: 'Professional recording studio in Fort Wayne, IN. Book sessions, browse beats, and connect with experienced engineers.',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/beats?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function FAQSchema() {
  const faqs = [
    {
      question: 'How much does a recording session cost at Sweet Dreams Music?',
      answer: `Studio A starts at $${(PRICING.studioA / 100)} per hour and Studio B starts at $${(PRICING.studioB / 100)} per hour (2+ hour sessions). Single hour sessions are $${(PRICING.studioASingleHour / 100)} for Studio A and $${(PRICING.studioBSingleHour / 100)} for Studio B. We also offer 4-hour Sweet Spot deals and band recording packages.`,
    },
    {
      question: 'What are your studio hours?',
      answer: 'Sweet Dreams Music is open 24 hours a day, 7 days a week. Regular hours are 9AM-10PM with no surcharge. Late night sessions (10PM-2AM) have a $10/hr surcharge, and after hours sessions (2AM-9AM) have a $30/hr surcharge.',
    },
    {
      question: 'How do I book a recording session?',
      answer: 'Visit our booking page at sweetdreamsmusic.com/book, select your date, time, studio, and session length. You pay a 50% deposit at booking, and the remainder is charged after your session.',
    },
    {
      question: 'Do you offer mixing and mastering services?',
      answer: 'Yes! All of our engineers offer recording, mixing, mastering, and full music production services. You can request a specific engineer when booking your session.',
    },
    {
      question: 'Where is Sweet Dreams Music located?',
      answer: 'Sweet Dreams Music is a professional recording studio located in Fort Wayne, Indiana.',
    },
    {
      question: 'Can I choose my engineer?',
      answer: `Yes, you can request a specific engineer when booking. We have ${ENGINEERS.length} engineers on staff, each with their own specialties. If your requested engineer is available, they'll claim your session.`,
    },
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function JsonLd() {
  return (
    <>
      <LocalBusinessSchema />
      <WebSiteSchema />
      <FAQSchema />
    </>
  );
}
