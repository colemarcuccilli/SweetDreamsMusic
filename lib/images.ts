const BASE = 'https://fweeyjnqwxywmpmnqpts.supabase.co/storage/v1/object/public/SweetDreamsMusicPictures';

export const STUDIO_IMAGES = {
  // Wide — hero backgrounds, full-width sections
  adamSpeakersWide: `${BASE}/adamaudiospeakerswide.jpg`,
  adamCloseupWide: `${BASE}/adamaudiowidecloseup.jpg`,
  akgMicWide: `${BASE}/AKGMicWide.jpg`,
  ayeGBoothWide: `${BASE}/ayegboothwide.jpg`,
  bockMicWide: `${BASE}/BocAudioMicWide.jpg`,
  iszacStudioAWide: `${BASE}/iszacstudioawide.jpg`,
  jayBoothWide: `${BASE}/Jayboothwide.jpg`,
  jayIszacPrvrbStudioAWide: `${BASE}/jayiszacprvrbstudioawide.jpg`,
  jayStudioBWritingWide: `${BASE}/JayStudioBwritingwide.jpg`,

  // Square — cards, thumbnails
  doloBoothSquare: `${BASE}/dolocloseupboothsquare.jpg`,
  doloWindowSquare: `${BASE}/DoloWindowsquare.jpg`,

  // Vertical — featured sections, side panels
  iszacVert: `${BASE}/IszacVert.jpg`,
  jayTopStudioBVert: `${BASE}/JayTopstudiobboothVert.jpg`,
  jebJayStudioAVert: `${BASE}/JebJaystudioavert.jpg`,

  // Graphics / Closeups — equipment showcase
  akgCloseup: `${BASE}/akgcloseup.jpg`,
  akgGraphic: `${BASE}/akggraphic.jpg`,
  bockMicCloseup: `${BASE}/bockMiccloseup.jpg`,
  manleyGraphic: `${BASE}/manleygraphic.jpg`,
  mojaveGraphic: `${BASE}/mojavegraphic.jpg`,
} as const;
