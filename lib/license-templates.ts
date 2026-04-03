import { BEAT_LICENSES, type BeatLicenseType } from './constants';

interface LicenseParams {
  buyerName: string;
  buyerEmail: string;
  beatTitle: string;
  producerName: string;
  licenseType: BeatLicenseType;
  amountPaid: number; // cents
  purchaseDate: string;
  purchaseId: string;
}

const LICENSE_TERMS: Record<BeatLicenseType, {
  streamingLimit: string;
  salesLimit: string;
  musicVideos: string;
  performances: string;
  radioStations: string;
  exclusive: boolean;
  transferable: boolean;
}> = {
  mp3_lease: {
    streamingLimit: 'Up to 500,000 streams across all platforms',
    salesLimit: 'Up to 5,000 paid downloads or physical copies',
    musicVideos: '1 music video (non-monetized)',
    performances: 'Unlimited non-commercial live performances',
    radioStations: 'Up to 2 radio stations',
    exclusive: false,
    transferable: false,
  },
  trackout_lease: {
    streamingLimit: 'Up to 1,000,000 streams across all platforms',
    salesLimit: 'Up to 10,000 paid downloads or physical copies',
    musicVideos: '1 music video (may be monetized)',
    performances: 'Unlimited live performances',
    radioStations: 'Unlimited radio stations',
    exclusive: false,
    transferable: false,
  },
  exclusive: {
    streamingLimit: 'Unlimited streams',
    salesLimit: 'Unlimited sales and distribution',
    musicVideos: 'Unlimited music videos',
    performances: 'Unlimited performances',
    radioStations: 'Unlimited',
    exclusive: true,
    transferable: true,
  },
};

export function generateLicenseText(params: LicenseParams): string {
  const { buyerName, buyerEmail, beatTitle, producerName, licenseType, amountPaid, purchaseDate, purchaseId } = params;
  const license = BEAT_LICENSES[licenseType];
  const terms = LICENSE_TERMS[licenseType];
  const amountFormatted = `$${(amountPaid / 100).toFixed(2)}`;

  return `
════════════════════════════════════════════════════════
           SWEET DREAMS MUSIC — BEAT LICENSE AGREEMENT
════════════════════════════════════════════════════════

License Type: ${license.name}
Purchase ID: ${purchaseId}
Date of Agreement: ${purchaseDate}

────────────────────────────────────────────────────────
PARTIES
────────────────────────────────────────────────────────
Licensor: Sweet Dreams Music LLC, Fort Wayne, IN
          (on behalf of producer "${producerName}")
Licensee: ${buyerName}
          Email: ${buyerEmail}

────────────────────────────────────────────────────────
BEAT INFORMATION
────────────────────────────────────────────────────────
Title: "${beatTitle}"
Producer: ${producerName}
Amount Paid: ${amountFormatted}
Delivery Format: ${license.deliveryFormat}

────────────────────────────────────────────────────────
LICENSE GRANT
────────────────────────────────────────────────────────
${terms.exclusive ? 'This is an EXCLUSIVE license. The beat will be removed from the store and no further licenses will be issued. All rights to the beat transfer to the Licensee, except the producer retains credit rights.' : 'This is a NON-EXCLUSIVE license. The producer retains the right to license this beat to other parties.'}

Permitted Use:
  • Streaming: ${terms.streamingLimit}
  • Sales/Distribution: ${terms.salesLimit}
  • Music Videos: ${terms.musicVideos}
  • Live Performances: ${terms.performances}
  • Radio: ${terms.radioStations}
  • Transferable: ${terms.transferable ? 'Yes' : 'No — this license is non-transferable'}

────────────────────────────────────────────────────────
RESTRICTIONS
────────────────────────────────────────────────────────
1. The Licensee may NOT claim ownership of the underlying
   composition or production.
2. The Licensee may NOT resell, sublicense, or redistribute
   the beat itself (only derivative works using the beat).
3. The Licensee MUST credit the producer as
   "Prod. by ${producerName}" in all published works.
4. ${terms.exclusive ? 'The producer retains the right to be credited on all works created using this beat.' : 'If license limits are exceeded, the Licensee must purchase an upgraded license before continued use.'}

────────────────────────────────────────────────────────
DELIVERY & ACCESS
────────────────────────────────────────────────────────
Files are available for download immediately after purchase
through the Sweet Dreams Music platform. Downloads are
limited to 10 per purchase. Files can also be accessed
from the "My Purchases" section of your dashboard at
sweetdreamsmusic.com/dashboard/purchases.

────────────────────────────────────────────────────────
AGREEMENT
────────────────────────────────────────────────────────
This license agreement is legally binding upon completion
of purchase. By completing the transaction, the Licensee
acknowledges that they have read, understood, and agree
to all terms stated in this agreement.

This agreement is governed by the laws of the State of
Indiana, United States.

════════════════════════════════════════════════════════
Sweet Dreams Music LLC — Fort Wayne, IN
sweetdreamsmusic.com
════════════════════════════════════════════════════════
`.trim();
}
