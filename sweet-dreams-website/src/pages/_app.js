import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import { GlobalStyles } from '../styles/GlobalStyles';
import CustomAudioPlayer from '../components/AudioPlayer';
import Navigation from '../components/Navigation';

function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <GlobalStyles />
      {isClient && (
        <>
          <Navigation />
          <Component {...pageProps} />
          <CustomAudioPlayer />
        </>
      )}
    </>
  );
}

export default MyApp;