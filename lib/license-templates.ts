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
BEAT LICENSE AGREEMENT
======================

License Type: ${license.name}
Purchase ID: ${purchaseId}
Date: ${purchaseDate}

PARTIES
-------
Licensor: Sweet Dreams Music (on behalf of producer "${producerName}")
Licensee: ${buyerName} (${buyerEmail})

BEAT INFORMATION
----------------
Title: "${beatTitle}"
Producer: ${producerName}
Amount Paid: ${amountFormatted}

DELIVERY FORMAT
---------------
${license.deliveryFormat}

LICENSE TERMS
-------------
${terms.exclusive ? 'This is an EXCLUSIVE license. The beat will be removed from the store and no further licenses will be issued.' : 'This is a NON-EXCLUSIVE license. The producer retains the right to license this beat to other parties.'}

Permitted Use:
- Streaming: ${terms.streamingLimit}
- Sales/Distribution: ${terms.salesLimit}
- Music Videos: ${terms.musicVideos}
- Live Performances: ${terms.performances}
- Radio: ${terms.radioStations}
- Transferable: ${terms.transferable ? 'Yes' : 'No — this license is non-transferable'}

RESTRICTIONS
------------
1. The Licensee may NOT claim ownership of the underlying composition or production.
2. The Licensee may NOT resell, sublicense, or redistribute the beat itself.
3. The Licensee MUST credit the producer ("Prod. by ${producerName}") in all published works.
4. ${terms.exclusive ? 'Upon exclusive purchase, all rights to the beat transfer to the Licensee, except the producer retains credit rights.' : 'If license limits are exceeded, the Licensee must upgrade their license.'}

DELIVERY
--------
Files are available for download immediately after purchase. Download links expire after 10 downloads.

This license agreement is legally binding upon purchase. By completing the transaction, the Licensee agrees to all terms above.

Sweet Dreams Music
sweetdreamsmusic.com
`.trim();
}
