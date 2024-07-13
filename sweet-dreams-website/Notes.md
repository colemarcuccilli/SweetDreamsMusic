Here is the combined Markdown file as you requested:

```markdown
# Sweet Dreams Website Repository

## https://github.com/colemarcuccilli/SweetDreamsMusic.git
## Folder: sweet-dreams-website

### Files and Folders in this Directory:
- build
- node_modules
- src
- next.config.js
- tailwind.config.js
- postcss.config.js
- package.json
- package-lock.json

---

## next.config.js
```javascript
module.exports = {
    webpack: (config) => {
      config.externals = [...config.externals, { canvas: 'canvas' }];
      return config;
    },
  };
```

## tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // You can add custom theme extensions here
    },
  },
  plugins: [],
};
```

## postcss.config.js
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## package.json
```json
{
  "name": "sweet-dreams-website",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@emotion/react": "^11.11.4",
    "@emotion/styled": "^11.11.5",
    "@heroicons/react": "^2.1.5",
    "@mui/material": "^5.16.0",
    "@react-three/drei": "^9.108.3",
    "@react-three/fiber": "^8.16.8",
    "clsx": "^2.1.1",
    "framer-motion": "^11.3.2",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-h5-audio-player": "^3.9.3",
    "react-icons": "^5.2.1",
    "react-intersection-observer": "^9.10.3",
    "react-spring": "^9.7.3",
    "styled-components": "^6.1.11",
    "tailwind-merge": "^2.4.0",
    "three": "^0.166.1",
    "three-globe": "^2.31.1",
    "wavesurfer.js": "^7.8.1"
  },
  "devDependencies": {
    "@types/three": "^0.166.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.2.4",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4"
  }
}
```

## package-lock.json
```json
{
  "name": "sweet-dreams-website",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "sweet-dreams-website",
      "version": "0.1.0",
      "dependencies": {
        "@emotion/react": "^11.11.4",
        "@emotion/styled": "^11.11.5",
        "@heroicons/react": "^2.1.5",
        "@mui/material": "^5.16.0",
        "@react-three/drei": "^9.108.3",
        "@react-three/fiber": "^8.16.8",
        "clsx": "^2.1.1",
        "framer-motion": "^11.3.2",
        "next": "^14.2.5",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "react-h5-audio-player": "^3.9.3",
        "react-icons": "^5.2.1",
        "react-intersection-observer": "^9.10.3",
        "react-spring": "^9.7.3",
        "styled-components": "^6.1.11",
        "tailwind-merge": "^2.4.0",
        "three": "^0.166.1",
        "three-globe": "^2.31.1",
        "wavesurfer.js": "^7.8.1"
      },
      "devDependencies": {
        "@types/three": "^0.166.0",
        "autoprefixer": "^10.4.19",
        "eslint": "^8.0.0",
        "eslint-config-next": "14.2.4",
        "postcss": "^8.4.38",
        "tailwindcss": "^3.4.4"
      }
    }
  }
}
```
```

This file includes a main title for the repository, a list of files and folders, and each file's content with a title.


Here is the combined Markdown file, now including the contents of the build/static folder:

```markdown
# Sweet Dreams Website Repository

## Folder: sweet-dreams-website

### Files and Folders in this Directory:
- build
  - static
- node_modules
- src
- next.config.js
- tailwind.config.js
- postcss.config.js
- package.json
- package-lock.json

---

## next.config.js
```javascript
module.exports = {
    webpack: (config) => {
      config.externals = [...config.externals, { canvas: 'canvas' }];
      return config;
    },
  };
```

## tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // You can add custom theme extensions here
    },
  },
  plugins: [],
};
```

## postcss.config.js
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## package.json
```json
{
  "name": "sweet-dreams-website",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@emotion/react": "^11.11.4",
    "@emotion/styled": "^11.11.5",
    "@heroicons/react": "^2.1.5",
    "@mui/material": "^5.16.0",
    "@react-three/drei": "^9.108.3",
    "@react-three/fiber": "^8.16.8",
    "clsx": "^2.1.1",
    "framer-motion": "^11.3.2",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-h5-audio-player": "^3.9.3",
    "react-icons": "^5.2.1",
    "react-intersection-observer": "^9.10.3",
    "react-spring": "^9.7.3",
    "styled-components": "^6.1.11",
    "tailwind-merge": "^2.4.0",
    "three": "^0.166.1",
    "three-globe": "^2.31.1",
    "wavesurfer.js": "^7.8.1"
  },
  "devDependencies": {
    "@types/three": "^0.166.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.2.4",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4"
  }
}
```

## package-lock.json
```json
{
  "name": "sweet-dreams-website",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "sweet-dreams-website",
      "version": "0.1.0",
      "dependencies": {
        "@emotion/react": "^11.11.4",
        "@emotion/styled": "^11.11.5",
        "@heroicons/react": "^2.1.5",
        "@mui/material": "^5.16.0",
        "@react-three/drei": "^9.108.3",
        "@react-three/fiber": "^8.16.8",
        "clsx": "^2.1.1",
        "framer-motion": "^11.3.2",
        "next": "^14.2.5",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "react-h5-audio-player": "^3.9.3",
        "react-icons": "^5.2.1",
        "react-intersection-observer": "^9.10.3",
        "react-spring": "^9.7.3",
        "styled-components": "^6.1.11",
        "tailwind-merge": "^2.4.0",
        "three": "^0.166.1",
        "three-globe": "^2.31.1",
        "wavesurfer.js": "^7.8.1"
      },
      "devDependencies": {
        "@types/three": "^0.166.0",
        "autoprefixer": "^10.4.19",
        "eslint": "^8.0.0",
        "eslint-config-next": "14.2.4",
        "postcss": "^8.4.38",
        "tailwindcss": "^3.4.4"
      }
    }
  }
}
```

---

## build/static

### asset-manifest.json
```json
{
  "files": {
    "main.css": "/static/css/main.f855e6bc.css",
    "main.js": "/static/js/main.0bb88659.js",
    "static/js/453.189aad3c.chunk.js": "/static/js/453.189aad3c.chunk.js",
    "static/media/logo.svg": "/static/media/logo.6ce24c58023cc2f8fd88fe9d219db6c6.svg",
    "index.html": "/index.html",
    "main.f855e6bc.css.map": "/static/css/main.f855e6bc.css.map",
    "main.0bb88659.js.map": "/static/js/main.0bb88659.js.map",
    "453.189aad3c.chunk.js.map": "/static/js/453.189aad3c.chunk.js.map"
  },
  "entrypoints": [
    "static/css/main.f855e6bc.css",
    "static/js/main.0bb88659.js"
  ]
}
```

### robots.txt
```text
# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:
```

### manifest.json
```json
{
  "short_name": "React App",
  "name": "Create React App Sample",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

### index.html
```html
<!doctype html><html lang="en"><head><meta charset="utf-8"/><link rel="icon" href="/favicon.ico"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#000000"/><meta name="description" content="Web site created using create-react-app"/><link rel="apple-touch-icon" href="/logo192.png"/><link rel="manifest" href="/manifest.json"/><title>React App</title><script defer="defer" src="/static/js/main.0bb88659.js"></script><link href="/static/css/main.f855e6bc.css" rel="stylesheet"></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>
```
```

This file includes a main title for the repository, a list of files and folders, and each file's content with a title.


# Sweet Dreams Website Repository

## Folder: sweet-dreams-website

### Files and Folders in this Directory:
- build
  - static
    - css
    - js
    - media
- node_modules
- src
- next.config.js
- tailwind.config.js
- postcss.config.js
- package.json
- package-lock.json

---


Here is the updated Markdown file containing only the contents of the `build/static/css` folder:

```markdown
# Sweet Dreams Website Repository

## Folder: sweet-dreams-website/build/static/css

### Files in this Directory:
- main.f855e6bc.css
- main.f855e6bc.css.map

---

## main.f855e6bc.css
```css
body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;margin:0}code{font-family:source-code-pro,Menlo,Monaco,Consolas,Courier New,monospace}.App{text-align:center}.App-logo{height:40vmin;pointer-events:none}@media (prefers-reduced-motion:no-preference){.App-logo{animation:App-logo-spin 20s linear infinite}}.App-header{align-items:center;background-color:#282c34;color:#fff;display:flex;flex-direction:column;font-size:calc(10px + 2vmin);justify-content:center;min-height:100vh}.App-link{color:#61dafb}@keyframes App-logo-spin{0%{transform:rotate(0deg)}to{transform:rotate(1turn)}}
/*# sourceMappingURL=main.f855e6bc.css.map*/
```
```

If there are more files to include, please upload them, and I will continue updating the Markdown file accordingly.

Here is the Markdown file for the contents of the `src` folder, including the `components`, `styles`, and `utils` folders:

```markdown
# Sweet Dreams Website Repository

## Folder: sweet-dreams-website/src

### Files and Folders in this Directory:
- components
- styles
- utils
- App.js
- App.test.js
- reportWebVitals.js
- setupTests.js
- index.css

---

## src

### App.js
```javascript
import '../styles/globals.css';
import { GlobalStyles } from '../styles/GlobalStyles';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <GlobalStyles />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
```

### App.test.js
```javascript
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

### reportWebVitals.js
```javascript
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
```

### setupTests.js
```javascript
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
```

### index.css
```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```
```

# Sweet Dreams Website Repository

## Folder: sweet-dreams-website/src

### Files and Folders in this Directory:
- components
- styles
- utils
  - cn.ts
- App.js
- App.test.js
- reportWebVitals.js
- setupTests.js
- index.css

---

## src/utils

### cn.ts
```typescript
// cn.ts content goes here


Here is the updated Markdown file including the contents of the `src/styles` folder:

```markdown
# Sweet Dreams Website Repository

## Folder: sweet-dreams-website/src

### Files and Folders in this Directory:
- components
- styles
  - globals.css
  - GlobalStyles.js
- utils
  - cn.ts
- App.js
- App.test.js
- reportWebVitals.js
- setupTests.js
- index.css

---

## src/styles

### globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your existing global styles here */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

:root {
  --color-background: #0a0a1f;
  --color-text: #ffffff;
  --color-primary: #00ffff;
  --color-secondary: #ff00ff;
  --color-accent: #ffff00;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Space Grotesk', sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.5;
  overflow-x: hidden;
}

/* You can keep the body::before pseudo-element if you want, or move it to a component */

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 1rem;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

button {
  font-family: 'Space Grotesk', sans-serif;
  cursor: pointer;
  border: none;
  background-color: var(--color-primary);
  color: var(--color-background);
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
```

### GlobalStyles.js
```javascript
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    --color-background: #0a0a1f;
    --color-text: #ffffff;
    --color-primary: #00ffff;
    --color-secondary: #ff00ff;
    --color-accent: #ffff00;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Space Grotesk', sans-serif;
    background-color: var(--color-background);
    color: var(--color-text);
    font-size: 16px;
    line-height: 1.5;
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: 
      radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),
      radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px),
      radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px);
    background-size: 550px 550px, 350px 350px, 250px 250px;
    background-position: 0 0, 40px 60px, 130px 270px;
    z-index: -1;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 1rem;
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: var(--color-secondary);
    }
  }

  button {
    font-family: 'Space Grotesk', sans-serif;
    cursor: pointer;
    border: none;
    background-color: var(--color-primary);
    color: var(--color-background);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: var(--color-secondary);
    }
  }
`;
```
```

Here is the updated Markdown file including the contents of the `src/components` folder:

```markdown
# Sweet Dreams Website Repository

## Folder: sweet-dreams-website/src

### Files and Folders in this Directory:
- components
  - ui
- styles
  - globals.css
  - GlobalStyles.js
- utils
  - cn.ts
- App.js
- App.test.js
- reportWebVitals.js
- setupTests.js
- index.css

---

## src/components

### AudioPlayer.js
```javascript
import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import WaveSurfer from 'wavesurfer.js';
import { FaSpotify, FaApple, FaInstagram, FaStepBackward, FaStepForward, FaPlay, FaPause, FaChevronUp, FaChevronDown } from 'react-icons/fa';

const PlayerContainer = styled.div`
  position: fixed;
  bottom: ${props => props.isCollapsed ? '0' : '20px'};
  left: 50%;
  transform: translateX(-50%);
  width: ${props => props.isCollapsed ? '100px' : '90%'};
  height: ${props => props.isCollapsed ? '30px' : 'auto'};
  background: rgba(10, 10, 20, 0.8);
  border-radius: ${props => props.isCollapsed ? '10px 10px 0 0' : '10px'};
  padding: ${props => props.isCollapsed ? '5px' : '10px'};
  color: white;
  display: flex;
  flex-direction: ${props => props.isCollapsed ? 'row' : 'column'};
  transition: all 0.3s ease;
`;

const ExpandButton = styled.button`
  position: absolute;
  top: ${props => props.isCollapsed ? '5px' : '-25px'};
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
`;

const PlayerContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  ${props => props.isCollapsed && 'display: none;'}
`;

const Section = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VisualizerContainer = styled.div`
  height: ${props => props.isCollapsed ? '20px' : '50px'};
  width: ${props => props.isCollapsed ? '80px' : '100%'};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  margin: 0 10px;
  &:hover {
    color: var(--color-primary);
  }
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
`;

const SocialIcon = styled.a`
  color: white;
  font-size: 1.5rem;
  transition: color 0.3s ease;
  &:hover {
    color: #1DB954;
  }
`;

const CustomAudioPlayer = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef(null);
  const [wavesurfer, setWavesurfer] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(0);

  const playlist = [
    { 
      title: "Eminem - Tobey feat. Big Sean & Babytron", 
      url: "/audio/Eminem - Tobey feat. Big Sean & Babytron (Official Music Video).mp3",
      spotify: "https://open.spotify.com/track/...",
      apple: "https://music.apple.com/us/album/...",
      instagram: "https://www.instagram.com/eminem/"
    },
    // ... other tracks
  ];

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(255, 255, 255, 0.1)',
      progressColor: 'linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff)',
      height: isCollapsed ? 20 : 50,
      cursorWidth: 1,
      cursorColor: 'transparent',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      hideScrollbar: true,
    });

    setWavesurfer(wavesurfer);

    return () => wavesurfer.destroy();
  }, [isCollapsed]);

  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.load(playlist[currentTrack].url);
    }
  }, [currentTrack, wavesurfer]);

  const handlePlay = () => {
    wavesurfer && wavesurfer.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    wavesurfer && wavesurfer.pause();
    setIsPlaying(false);
  };

  const handlePrevTrack = () => {
    setCurrentTrack((prevTrack) => (prevTrack - 1 + playlist.length) % playlist.length);
  };

  const handleNextTrack = () => {
    setCurrentTrack((prevTrack) => (prevTrack + 1) % playlist.length);
  };

  return (
    <PlayerContainer isCollapsed={isCollapsed}>
      <ExpandButton isCollapsed={isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <FaChevronUp /> : <FaChevronDown />}
      </ExpandButton>
      {isCollapsed && <VisualizerContainer isCollapsed={isCollapsed} ref={waveformRef} />}
      <PlayerContent isCollapsed={isCollapsed}>
        <Section>
          <div>{playlist[currentTrack].title}</div>
          {!isCollapsed && <VisualizerContainer isCollapsed={isCollapsed} ref={waveformRef} />}
        </Section>
        <Section>
          <Controls>
            <ControlButton onClick={handlePrevTrack}><FaStepBackward /></ControlButton>
            <ControlButton onClick={isPlaying ? handlePause : handlePlay}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </ControlButton>
            <ControlButton onClick={handleNextTrack}><FaStepForward /></ControlButton>
          </Controls>
        </Section>
        <Section>
          <SocialLinks>
            <SocialIcon href={playlist[currentTrack].spotify} target="_blank" rel="noopener noreferrer">
              <FaSpotify />
            </SocialIcon>
            <SocialIcon href={playlist[currentTrack].apple} target="_blank" rel="noopener noreferrer">
              <FaApple />
            </SocialIcon>
            <SocialIcon href={playlist[currentTrack].instagram} target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </SocialIcon>
          </SocialLinks>
        </Section>
      </PlayerContent>
    </PlayerContainer>
  );
};

export default CustomAudioPlayer;
```

### Navigation.js
```javascript
import React from 'react';
import Link from 'next/link';
import { MoonIcon } from '@heroicons/react/24/solid';
import { FloatingNav } from './FloatingNav';  // Corrected import

const navItems = [
  {
    name: 'Home',
    link: '/',
  },
  {
    name: 'About',
    link: '/about',
  },
  {
    name: 'Services',
    link: '/services',
  },
  {
    name: 'Contact',
    link: '/contact',
  },
];

const Navigation = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] flex justify-between items-center p-4">
      <Link href="/" className="flex items-center space-x-2">
        <MoonIcon className="h-8 w-8 text-white" />
        <span className="text-white font-bold text-xl">SweetDreams</span>
      </Link>
      <div className="flex-grow flex justify-center">
        <FloatingNav
          navItems={navItems}
          className="bg-black bg-opacity-50 backdrop-blur-md"
        />
      </div>
    </div>
  );
};

export default Navigation;
```

### MeteorsBackground.js
```javascript
import React from "react";
import { Meteors } from "../../components/ui/aceternity";

export const MeteorsBackground = () => {
  return (
    <div className="relative h-full w-full">
      <Meteors number={20} />
    </div>
  );
};
```

### FloatingNav.js
```javascript
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const FloatingNav = ({ navItems, className = "" }) => {
  const path = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5

 }}
      className={`flex items-center space-x-4 bg-black bg-opacity-50 backdrop-blur-md px-4 py-2 rounded-full ${className}`}
    >
      {navItems.map((item, idx) => (
        <Link key={item.name} href={item.link}>
          <motion.div
            className={`px-4 py-2 rounded-full text-sm lg:text-base relative no-underline duration-300 ease-in ${
              path === item.link ? "text-zinc-100" : "text-zinc-400"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">{item.name}</span>
            {path === item.link && (
              <motion.div
                layoutId="active"
                className="absolute inset-0 bg-white bg-opacity-10 rounded-full"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              ></motion.div>
            )}
          </motion.div>
        </Link>
      ))}
    </motion.div>
  );
};
```

### Meteors.js
```javascript
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const meteorEffect = keyframes`
  0% {
    transform: rotate(215deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(215deg) translateX(-500px);
    opacity: 0;
  }
`;

const MeteorSpan = styled.span`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  width: 2px;
  height: 2px;
  background-color: ${props => props.color};
  border-radius: 9999px;
  box-shadow: 0 0 0 1px ${props => props.color}10, 0 0 0 2px ${props => props.color}10, 0 0 20px ${props => props.color}80;
  transform: rotate(215deg);
  animation: ${meteorEffect} ${props => props.duration}s linear infinite;
  animation-delay: ${props => props.delay}s;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 1px;
    background: linear-gradient(to right, ${props => props.color}, transparent);
  }
`;

const MeteorsContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
`;

const colors = ['#ff4500', '#ffa500', '#ff6347', '#ff7f50', '#ff8c00'];

export const Meteors = ({ number = 20 }) => {
  const [meteorProps, setMeteorProps] = useState([]);

  useEffect(() => {
    const newMeteorProps = new Array(number).fill(true).map(() => ({
      top: Math.floor(Math.random() * window.innerHeight),
      left: Math.floor(Math.random() * window.innerWidth),
      duration: Math.floor(Math.random() * 8) + 2,
      delay: Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setMeteorProps(newMeteorProps);
  }, [number]);

  return (
    <MeteorsContainer>
      {meteorProps.map((props, idx) => (
        <MeteorSpan
          key={`meteor-${idx}`}
          {...props}
        />
      ))}
    </MeteorsContainer>
  );
};
```

### SolarSystem.js
```javascript
import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

const THREE = typeof window !== 'undefined' ? require('three') : null;
const OrbitControls = typeof window !== 'undefined' ? require('three/examples/jsm/controls/OrbitControls').OrbitControls : null;

// Dynamically import the Meteors component
const Meteors = dynamic(() => import('./Meteors').then((mod) => mod.Meteors), {
  ssr: false
});

const CanvasContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
`;

const MeteorsWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
`;

const planets = [
  { name: 'Sun', value: 'Passion', size: 5, orbit: 0, color: 0xffff00 },
  { name: 'Mercury', value: 'Innovation', size: 1, orbit: 10, color: 0x8c7853 },
  { name: 'Venus', value: 'Experience', size: 1.5, orbit: 15, color: 0xffdab9 },
  { name: 'Earth', value: 'Collaboration', size: 2, orbit: 20, color: 0x6b93d6 },
  { name: 'Mars', value: 'Quality', size: 1.8, orbit: 25, color: 0xff4500 },
  { name: 'Jupiter', value: 'Dedication', size: 4, orbit: 35, color: 0xffa500 },
  { name: 'Saturn', value: 'Integrity', size: 3.5, orbit: 45, color: 0xffd700 },
  { name: 'Uranus', value: 'Growth', size: 3, orbit: 55, color: 0x40e0d0 },
  { name: 'Neptune', value: 'Community', size: 2.8, orbit: 65, color: 0x4169e1 },
];

const SolarSystem = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current || !THREE) return;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });

    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(rendererRef.current.domElement);

    const controls = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    cameraRef.current.position.set(0, 50, 100);
    controls.update();

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    sceneRef.current.add(ambientLight);

    // Stars (brighter)
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.3, transparent: true, opacity: 0.8 });

    const starVertices = [];
    for (let i = 0; i < 15000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    sceneRef.current.add(stars);

    // Create planets
    const planetMeshes = planets.map(planet => {
      const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: planet.color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = planet.orbit;
      sceneRef.current.add(mesh);
      return mesh;
    });

    // Animation
    const animate = () => {
      planetMeshes.forEach((mesh, index) => {
        const planet = planets[index];
        if (planet.orbit !== 0) {
          const angle = Date.now() * 0.0005 * (1 / planet.orbit);
          mesh.position.x = Math.cos(angle) * planet.orbit;
          mesh.position.z = Math.sin(angle) * planet.orbit;
        }
        mesh.rotation.y += 0.005;
      });

      controls.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEvent

Listener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      cancelAnimationFrame(animationFrameId.current);
      rendererRef.current.dispose();
    };
  }, []);

  return (
    <CanvasContainer ref={mountRef}>
      <MeteorsWrapper>
        <Meteors number={20} />
      </MeteorsWrapper>
    </CanvasContainer>
  );
};

export default SolarSystem;
```

Here is the updated Markdown file with the components marked as potentially unused:

```markdown
# Sweet Dreams Website Repository

## Folder: sweet-dreams-website/src

### Files and Folders in this Directory:
- components
  - ui
    - AudioPlayer.js
    - FloatingNav.js
    - Meteors.js
    - Navigation.js
    - SolarSystem.js
    - MeteorsBackground.js
- styles
  - globals.css
  - GlobalStyles.js
- utils
  - cn.ts
- App.js
- App.test.js
- reportWebVitals.js
- setupTests.js
- index.css

### Potentially Unused Components:
- SimplifiedNav.js
- GlobeComponent.js
- EnhancedServicesSection.js
- ServicesSection.js
- CombinedHeroNav.js
- MusicStaffNav.js
- LEDEffect.js

---

## src/components

### ui/AudioPlayer.js
```javascript
import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import WaveSurfer from 'wavesurfer.js';
import { FaSpotify, FaApple, FaInstagram, FaStepBackward, FaStepForward, FaPlay, FaPause, FaChevronUp, FaChevronDown } from 'react-icons/fa';

const PlayerContainer = styled.div`
  position: fixed;
  bottom: ${props => props.isCollapsed ? '0' : '20px'};
  left: 50%;
  transform: translateX(-50%);
  width: ${props => props.isCollapsed ? '100px' : '90%'};
  height: ${props => props.isCollapsed ? '30px' : 'auto'};
  background: rgba(10, 10, 20, 0.8);
  border-radius: ${props => props.isCollapsed ? '10px 10px 0 0' : '10px'};
  padding: ${props => props.isCollapsed ? '5px' : '10px'};
  color: white;
  display: flex;
  flex-direction: ${props => props.isCollapsed ? 'row' : 'column'};
  transition: all 0.3s ease;
`;

const ExpandButton = styled.button`
  position: absolute;
  top: ${props => props.isCollapsed ? '5px' : '-25px'};
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
`;

const PlayerContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  ${props => props.isCollapsed && 'display: none;'}
`;

const Section = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VisualizerContainer = styled.div`
  height: ${props => props.isCollapsed ? '20px' : '50px'};
  width: ${props => props.isCollapsed ? '80px' : '100%'};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  margin: 0 10px;
  &:hover {
    color: var(--color-primary);
  }
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
`;

const SocialIcon = styled.a`
  color: white;
  font-size: 1.5rem;
  transition: color 0.3s ease;
  &:hover {
    color: #1DB954;
  }
`;

const CustomAudioPlayer = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef(null);
  const [wavesurfer, setWavesurfer] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(0);

  const playlist = [
    { 
      title: "Eminem - Tobey feat. Big Sean & Babytron", 
      url: "/audio/Eminem - Tobey feat. Big Sean & Babytron (Official Music Video).mp3",
      spotify: "https://open.spotify.com/track/...",
      apple: "https://music.apple.com/us/album/...",
      instagram: "https://www.instagram.com/eminem/"
    },
    // ... other tracks
  ];

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(255, 255, 255, 0.1)',
      progressColor: 'linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff)',
      height: isCollapsed ? 20 : 50,
      cursorWidth: 1,
      cursorColor: 'transparent',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      hideScrollbar: true,
    });

    setWavesurfer(wavesurfer);

    return () => wavesurfer.destroy();
  }, [isCollapsed]);

  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.load(playlist[currentTrack].url);
    }
  }, [currentTrack, wavesurfer]);

  const handlePlay = () => {
    wavesurfer && wavesurfer.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    wavesurfer && wavesurfer.pause();
    setIsPlaying(false);
  };

  const handlePrevTrack = () => {
    setCurrentTrack((prevTrack) => (prevTrack - 1 + playlist.length) % playlist.length);
  };

  const handleNextTrack = () => {
    setCurrentTrack((prevTrack) => (prevTrack + 1) % playlist.length);
  };

  return (
    <PlayerContainer isCollapsed={isCollapsed}>
      <ExpandButton isCollapsed={isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <FaChevronUp /> : <FaChevronDown />}
      </ExpandButton>
      {isCollapsed && <VisualizerContainer isCollapsed={isCollapsed} ref={waveformRef} />}
      <PlayerContent isCollapsed={isCollapsed}>
        <Section>
          <div>{playlist[currentTrack].title}</div>
          {!isCollapsed && <VisualizerContainer isCollapsed={isCollapsed} ref={waveformRef} />}
        </Section>
        <Section>
          <Controls>
            <ControlButton onClick={handlePrevTrack}><FaStepBackward /></ControlButton>
            <ControlButton onClick={isPlaying ? handlePause : handlePlay}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </ControlButton>
            <ControlButton onClick={handleNextTrack}><FaStepForward /></ControlButton>
          </Controls>
        </Section>
        <Section>
          <SocialLinks>
            <SocialIcon href={playlist[currentTrack].spotify} target="_blank" rel="noopener noreferrer">
              <FaSpotify />
            </SocialIcon>
            <SocialIcon href={playlist[currentTrack].apple} target="_blank" rel="noopener noreferrer">
              <FaApple />
            </SocialIcon>
            <SocialIcon href={playlist[currentTrack].instagram} target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </SocialIcon>
          </SocialLinks>
        </Section>
      </PlayerContent>
    </PlayerContainer>
  );
};

export default CustomAudioPlayer;
```

### ui/Navigation.js
```javascript
import React from 'react';
import Link from 'next/link';
import { MoonIcon } from '@heroicons/react/24/solid';
import { FloatingNav } from './FloatingNav';  // Corrected import

const navItems = [
  {
    name: 'Home',
    link: '/',
  },
  {
    name: 'About',
    link: '/about',
  },
  {
    name: 'Services',
    link: '/services',
  },
  {
    name: 'Contact',
    link: '/contact',
  },
];

const Navigation = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] flex justify-between items-center p-4">
      <Link href="/" className="flex items-center space-x-2">
        <MoonIcon className="h-8 w-8 text-white" />
        <span className="text-white font-bold text-xl">SweetDreams</span>
      </Link>
      <div className="flex-grow flex justify-center">
        <FloatingNav
          navItems={navItems}
          className="bg-black bg-opacity-50 backdrop-blur-md"
        />
      </div>
    </div>
  );
};

export default Navigation;
```

### ui/MeteorsBackground.js
```javascript
import React from "react";
import { Meteors } from "../../components/ui/aceternity";

export const MeteorsBackground = () => {
  return (
    <div className="relative h-full w-full">
      <Meteors number={20} />
    </div>
  );
};
```

### ui/FloatingNav.js
```javascript
import React from "react";
import { motion } from "fr

amer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const FloatingNav = ({ navItems, className = "" }) => {
  const path = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center space-x-4 bg-black bg-opacity-50 backdrop-blur-md px-4 py-2 rounded-full ${className}`}
    >
      {navItems.map((item, idx) => (
        <Link key={item.name} href={item.link}>
          <motion.div
            className={`px-4 py-2 rounded-full text-sm lg:text-base relative no-underline duration-300 ease-in ${
              path === item.link ? "text-zinc-100" : "text-zinc-400"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">{item.name}</span>
            {path === item.link && (
              <motion.div
                layoutId="active"
                className="absolute inset-0 bg-white bg-opacity-10 rounded-full"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              ></motion.div>
            )}
          </motion.div>
        </Link>
      ))}
    </motion.div>
  );
};
```

### ui/Meteors.js
```javascript
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const meteorEffect = keyframes`
  0% {
    transform: rotate(215deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(215deg) translateX(-500px);
    opacity: 0;
  }
`;

const MeteorSpan = styled.span`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  width: 2px;
  height: 2px;
  background-color: ${props => props.color};
  border-radius: 9999px;
  box-shadow: 0 0 0 1px ${props => props.color}10, 0 0 0 2px ${props => props.color}10, 0 0 20px ${props => props.color}80;
  transform: rotate(215deg);
  animation: ${meteorEffect} ${props => props.duration}s linear infinite;
  animation-delay: ${props => props.delay}s;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 1px;
    background: linear-gradient(to right, ${props => props.color}, transparent);
  }
`;

const MeteorsContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
`;

const colors = ['#ff4500', '#ffa500', '#ff6347', '#ff7f50', '#ff8c00'];

export const Meteors = ({ number = 20 }) => {
  const [meteorProps, setMeteorProps] = useState([]);

  useEffect(() => {
    const newMeteorProps = new Array(number).fill(true).map(() => ({
      top: Math.floor(Math.random() * window.innerHeight),
      left: Math.floor(Math.random() * window.innerWidth),
      duration: Math.floor(Math.random() * 8) + 2,
      delay: Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setMeteorProps(newMeteorProps);
  }, [number]);

  return (
    <MeteorsContainer>
      {meteorProps.map((props, idx) => (
        <MeteorSpan
          key={`meteor-${idx}`}
          {...props}
        />
      ))}
    </MeteorsContainer>
  );
};
```

### ui/SolarSystem.js
```javascript
import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

const THREE = typeof window !== 'undefined' ? require('three') : null;
const OrbitControls = typeof window !== 'undefined' ? require('three/examples/jsm/controls/OrbitControls').OrbitControls : null;

// Dynamically import the Meteors component
const Meteors = dynamic(() => import('./Meteors').then((mod) => mod.Meteors), {
  ssr: false
});

const CanvasContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
`;

const MeteorsWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
`;

const planets = [
  { name: 'Sun', value: 'Passion', size: 5, orbit: 0, color: 0xffff00 },
  { name: 'Mercury', value: 'Innovation', size: 1, orbit: 10, color: 0x8c7853 },
  { name: 'Venus', value: 'Experience', size: 1.5, orbit: 15, color: 0xffdab9 },
  { name: 'Earth', value: 'Collaboration', size: 2, orbit: 20, color: 0x6b93d6 },
  { name: 'Mars', value: 'Quality', size: 1.8, orbit: 25, color: 0xff4500 },
  { name: 'Jupiter', value: 'Dedication', size: 4, orbit: 35, color: 0xffa500 },
  { name: 'Saturn', value: 'Integrity', size: 3.5, orbit: 45, color: 0xffd700 },
  { name: 'Uranus', value: 'Growth', size: 3, orbit: 55, color: 0x40e0d0 },
  { name: 'Neptune', value: 'Community', size: 2.8, orbit: 65, color: 0x4169e1 },
];

const SolarSystem = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current || !THREE) return;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });

    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(rendererRef.current.domElement);

    const controls = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    cameraRef.current.position.set(0, 50, 100);
    controls.update();

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    sceneRef.current.add(ambientLight);

    // Stars (brighter)
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.3, transparent: true, opacity: 0.8 });

    const starVertices = [];
    for (let i = 0; i < 15000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    sceneRef.current.add(stars);

    // Create planets
    const planetMeshes = planets.map(planet => {
      const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: planet.color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = planet.orbit;
      sceneRef.current.add(mesh);
      return mesh;
    });

    // Animation
    const animate = () => {
      planetMeshes.forEach((mesh, index) => {
        const planet = planets[index];
        if (planet.orbit !== 0) {
          const angle = Date.now() * 0.0005 * (1 / planet.orbit);
          mesh.position.x = Math.cos(angle) * planet.orbit;
          mesh.position.z = Math.sin(angle) * planet.orbit;
        }
        mesh.rotation.y += 0.005;
      });

      controls.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current

);

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      cancelAnimationFrame(animationFrameId.current);
      rendererRef.current.dispose();
    };
  }, []);

  return (
    <CanvasContainer ref={mountRef}>
      <MeteorsWrapper>
        <Meteors number={20} />
      </MeteorsWrapper>
    </CanvasContainer>
  );
};

export default SolarSystem;
```

---

## Potentially Unused Components

### SimplifiedNav.js
```javascript
import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 1000;
`;

const NavList = styled.ul`
  display: flex;
  justify-content: space-around;
  list-style-type: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin: 0 1rem;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s ease;

  &:hover {
    color: #ffa500;
  }
`;

const SimplifiedNav = () => {
  return (
    <NavContainer>
      <NavList>
        <NavItem>
          <NavLink href="/">Home</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/about">About</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/services">Services</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/contact">Contact</NavLink>
        </NavItem>
      </NavList>
    </NavContainer>
  );
};

export default SimplifiedNav;
```

### GlobeComponent.js
```javascript
import React from "react";
import dynamic from "next/dynamic";

const World = dynamic(() => import("./ui/globe").then((m) => m.World), {
  ssr: false,
});

export function GlobeComponent() {
  const globeConfig = {
    pointSize: 4,
    globeColor: "#062056",
    showAtmosphere: true,
    atmosphereColor: "#FFFFFF",
    atmosphereAltitude: 0.1,
    emissive: "#062056",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    polygonColor: "rgba(255,255,255,0.7)",
    ambientLight: "#38bdf8",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
  };

  const sampleArcs = [
    {
      order: 1,
      startLat: 40.7128,
      startLng: -74.006,
      endLat: 37.7749,
      endLng: -122.4194,
      arcAlt: 0.3,
      color: "#ff0000",
    },
    // Add more arcs as needed
  ];

  return (
    <div style={{ width: "100%", height: "100vh", position: "absolute", top: 0, left: 0 }}>
      <World data={sampleArcs} globeConfig={globeConfig} />
    </div>
  );
}
```

### EnhancedServicesSection.js
```javascript
import React from 'react';
import styled from 'styled-components';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const ServicesContainer = styled.section`
  background-color: #000000;
  padding: 4rem 2rem;
  position: relative;
  overflow: hidden;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

const ColumnLine = styled(motion.div)`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #ff00ff, #00ffff);
  left: ${props => props.left};
`;

const Circle = styled(motion.div)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 15px;
  height: 15px;
  background-color: #ffffff;
  border-radius: 50%;
`;

const ServiceCard = styled(motion.div)`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  backdrop-filter: blur(5px);
`;

const ServiceIcon = styled.div`
  width: 80px;
  height: 80px;
  background-color: #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 2rem;
`;

const ServiceTitle = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const ServiceDescription = styled.p`
  color: #b0b0b0;
  font-size: 0.9rem;
`;

const services = [
  { title: 'Recording', icon: '🎙️', description: 'State-of-the-art recording facilities' },
  { title: 'Music Production', icon: '🎚️', description: 'Professional music production services' },
  { title: 'Videography', icon: '🎥', description: 'High-quality video production' },
  { title: 'Web Design', icon: '💻', description: 'Custom website design for artists' },
  { title: 'Marketing', icon: '📈', description: 'Comprehensive marketing strategies' },
  { title: 'Artist Development', icon: '🌟', description: 'Nurturing emerging talent' },
];

const EnhancedServicesSection = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  React.useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <ServicesContainer ref={ref}>
      <ServicesGrid
        as={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        <ColumnLine left="33.33%" 
          animate={{ 
            background: ['linear-gradient(to bottom, #ff00ff, #00ffff)', 'linear-gradient(to bottom, #00ffff, #ff00ff)'] 
          }} 
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
        >
          <Circle top="25%" />
          <Circle top="75%" />
        </ColumnLine>
        <ColumnLine left="66.66%" 
          animate={{ 
            background: ['linear-gradient(to bottom, #00ffff, #ff00ff)', 'linear-gradient(to bottom, #ff00ff, #00ffff)'] 
          }} 
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
        >
          <Circle top="25%" />
          <Circle top="75%" />
        </ColumnLine>
        {services.map((service, index) => (
          <ServiceCard key={index} variants={itemVariants}>
            <ServiceIcon>{service.icon}</ServiceIcon>
            <ServiceTitle>{service.title}</ServiceTitle>
            <ServiceDescription>{service.description}</ServiceDescription>
          </ServiceCard>
        ))}
      </ServicesGrid>
    </ServicesContainer>
  );
};

export default EnhancedServicesSection;
```

### ServicesSection.js
```javascript
import React

 from 'react';
import styled from 'styled-components';

const ServicesContainer = styled.section`
  background-color: #000000;
  padding: 4rem 2rem;
  position: relative;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

const ColumnLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #333;
  left: ${props => props.left};

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 10px;
    height: 10px;
    background-color: #333;
    border-radius: 50%;
  }

  &::before {
    top: calc(25% - 5px);
  }

  &::after {
    top: calc(75% - 5px);
  }
`;

const ServiceCard = styled.div`
  background-color: #000000;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-10px);
  }
`;

const ServiceIcon = styled.div`
  width: 80px;
  height: 80px;
  background-color: #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const ServiceTitle = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const ServiceDescription = styled.p`
  color: #b0b0b0;
  font-size: 0.9rem;
`;

const services = [
  { title: 'Recording', icon: '🎙️', description: 'State-of-the-art recording facilities' },
  { title: 'Music Production', icon: '🎚️', description: 'Professional music production services' },
  { title: 'Videography', icon: '🎥', description: 'High-quality video production' },
  { title: 'Web Design', icon: '💻', description: 'Custom website design for artists' },
  { title: 'Marketing', icon: '📈', description: 'Comprehensive marketing strategies' },
  { title: 'Artist Development', icon: '🌟', description: 'Nurturing emerging talent' },
];

const ServicesSection = () => {
  return (
    <ServicesContainer>
      <ServicesGrid>
        <ColumnLine left="33.33%" />
        <ColumnLine left="66.66%" />
        {services.map((service, index) => (
          <ServiceCard key={index}>
            <ServiceIcon>{service.icon}</ServiceIcon>
            <ServiceTitle>{service.title}</ServiceTitle>
            <ServiceDescription>{service.description}</ServiceDescription>
          </ServiceCard>
        ))}
      </ServicesGrid>
    </ServicesContainer>
  );
};

export default ServicesSection;
```

### CombinedHeroNav.js
```javascript
import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const flicker = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
`;

const NavContainer = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #000;
  color: #fff;
  height: 80px;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const LEDText = styled.div`
  font-size: 2rem;
  font-weight: 300;
  font-family: 'Pacifico', cursive;
  color: #fff;
  white-space: nowrap;
  animation: ${flicker} 3s infinite;
  transition: color 0.3s ease;
`;

const CrescentMoon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  box-shadow: 7px 7px 0 0 #fff;
  transform: rotate(-20deg);
  margin-left: 10px;
  transition: box-shadow 0.3s ease;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const NavItem = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-size: 1rem;
  position: relative;
  padding-bottom: 5px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #fff;
    transition: background-color 0.3s ease;
  }

  &:hover::after {
    background-color: ${props => props.hoverColor || '#ff6b6b'};
  }
`;

const CombinedHeroNav = () => {
  const textRef = useRef(null);
  const moonRef = useRef(null);
  const navItemsRef = useRef([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      const gradient = `linear-gradient(135deg, 
        hsl(${x * 360}, 100%, 50%), 
        hsl(${y * 360}, 100%, 50%)
      )`;

      if (textRef.current) {
        textRef.current.style.webkitTextFillColor = 'transparent';
        textRef.current.style.webkitBackgroundClip = 'text';
        textRef.current.style.backgroundImage = gradient;
      }

      if (moonRef.current) {
        const color = `hsl(${(x + y) * 180}, 100%, 50%)`;
        moonRef.current.style.boxShadow = `7px 7px 0 0 ${color}`;
      }

      navItemsRef.current.forEach(item => {
        if (item) {
          item.style.setProperty('--hover-color', `hsl(${(x + y) * 180}, 100%, 50%)`);
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <NavContainer>
      <LogoSection>
        <LEDText ref={textRef}>Sweet Dreams</LEDText>
        <CrescentMoon ref={moonRef} />
      </LogoSection>
      <NavLinks>
        <NavItem to="/" ref={el => navItemsRef.current[0] = el}>Home</NavItem>
        <NavItem to="/work" ref={el => navItemsRef.current[1] = el}>Work</NavItem>
        <NavItem to="/book" ref={el => navItemsRef.current[2] = el}>Book</NavItem>
        <NavItem to="/contact" ref={el => navItemsRef.current[3] = el}>Contact</NavItem>
      </NavLinks>
    </NavContainer>
  );
};

export default CombinedHeroNav;
```

### MusicStaffNav.js
```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  right: 0;
  padding: 20px;
  z-index: 1000;
`;

const NavItem = styled(Link)`
  display: block;
  color: #fff;
  text-decoration: none;
  font-size: 1.2rem;
  margin-bottom: 15px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #fff;
    transition: background-color 0.3s ease;
  }

  &:hover::after {
    background-color: ${props => props.hoverColor || '#ff6b6b'};
  }
`;

const MusicStaffNav = () => {
  return (
    <NavContainer>
      <NavItem to="/">Home</NavItem>
      <NavItem to="/work">Work</NavItem>
      <NavItem to="/book">Book</NavItem>
      <NavItem to="/contact">Contact</NavItem>
    </NavContainer>
  );
};

export default MusicStaffNav;
```

### LEDEffect.js
```javascript
import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const LEDContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const LEDOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const withLEDEffect = (WrappedComponent)

 => {
  return (props) => {
    const containerRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
      const container = containerRef.current;
      const overlay = overlayRef.current;

      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const gradient = `radial-gradient(
          circle 50px at ${x}px ${y}px,
          rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8),
          transparent
        )`;

        overlay.style.background = gradient;
      };

      const handleMouseLeave = () => {
        overlay.style.background = 'none';
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }, []);

    return (
      <LEDContainer ref={containerRef}>
        <WrappedComponent {...props} />
        <LEDOverlay ref={overlayRef} />
      </LEDContainer>
    );
  };
};

export default withLEDEffect;
```
```

Here is the updated Markdown file including the components that are currently not used but saved for historical purposes:

```markdown
# Sweet Dreams Website Repository

## Folder: sweet-dreams-website/src

### Files and Folders in this Directory:
- components
  - ui
    - AudioPlayer.js
    - FloatingNav.js
    - Meteors.js
    - Navigation.js
    - SolarSystem.js
    - MeteorsBackground.js
- styles
  - globals.css
  - GlobalStyles.js
- utils
  - cn.ts
- App.js
- App.test.js
- reportWebVitals.js
- setupTests.js
- index.css

### Components Not Currently Used:
- SimplifiedNav.js
- GlobeComponent.js
- EnhancedServicesSection.js
- ServicesSection.js
- CombinedHeroNav.js
- MusicStaffNav.js
- LEDEffect.js
- WaveformContact.js
- BookingPoster.js
- PortfolioVisualizer.js
- VinylServices.js
- Footer.js
- Header.js

---

## src/components

### ui/AudioPlayer.js
```javascript
import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import WaveSurfer from 'wavesurfer.js';
import { FaSpotify, FaApple, FaInstagram, FaStepBackward, FaStepForward, FaPlay, FaPause, FaChevronUp, FaChevronDown } from 'react-icons/fa';

const PlayerContainer = styled.div`
  position: fixed;
  bottom: ${props => props.isCollapsed ? '0' : '20px'};
  left: 50%;
  transform: translateX(-50%);
  width: ${props => props.isCollapsed ? '100px' : '90%'};
  height: ${props => props.isCollapsed ? '30px' : 'auto'};
  background: rgba(10, 10, 20, 0.8);
  border-radius: ${props => props.isCollapsed ? '10px 10px 0 0' : '10px'};
  padding: ${props => props.isCollapsed ? '5px' : '10px'};
  color: white;
  display: flex;
  flex-direction: ${props => props.isCollapsed ? 'row' : 'column'};
  transition: all 0.3s ease;
`;

const ExpandButton = styled.button`
  position: absolute;
  top: ${props => props.isCollapsed ? '5px' : '-25px'};
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
`;

const PlayerContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  ${props => props.isCollapsed && 'display: none;'}
`;

const Section = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VisualizerContainer = styled.div`
  height: ${props => props.isCollapsed ? '20px' : '50px'};
  width: ${props => props.isCollapsed ? '80px' : '100%'};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  margin: 0 10px;
  &:hover {
    color: var(--color-primary);
  }
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
`;

const SocialIcon = styled.a`
  color: white;
  font-size: 1.5rem;
  transition: color 0.3s ease;
  &:hover {
    color: #1DB954;
  }
`;

const CustomAudioPlayer = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef(null);
  const [wavesurfer, setWavesurfer] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(0);

  const playlist = [
    { 
      title: "Eminem - Tobey feat. Big Sean & Babytron", 
      url: "/audio/Eminem - Tobey feat. Big Sean & Babytron (Official Music Video).mp3",
      spotify: "https://open.spotify.com/track/...",
      apple: "https://music.apple.com/us/album/...",
      instagram: "https://www.instagram.com/eminem/"
    },
    // ... other tracks
  ];

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(255, 255, 255, 0.1)',
      progressColor: 'linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff)',
      height: isCollapsed ? 20 : 50,
      cursorWidth: 1,
      cursorColor: 'transparent',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      hideScrollbar: true,
    });

    setWavesurfer(wavesurfer);

    return () => wavesurfer.destroy();
  }, [isCollapsed]);

  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.load(playlist[currentTrack].url);
    }
  }, [currentTrack, wavesurfer]);

  const handlePlay = () => {
    wavesurfer && wavesurfer.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    wavesurfer && wavesurfer.pause();
    setIsPlaying(false);
  };

  const handlePrevTrack = () => {
    setCurrentTrack((prevTrack) => (prevTrack - 1 + playlist.length) % playlist.length);
  };

  const handleNextTrack = () => {
    setCurrentTrack((prevTrack) => (prevTrack + 1) % playlist.length);
  };

  return (
    <PlayerContainer isCollapsed={isCollapsed}>
      <ExpandButton isCollapsed={isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <FaChevronUp /> : <FaChevronDown />}
      </ExpandButton>
      {isCollapsed && <VisualizerContainer isCollapsed={isCollapsed} ref={waveformRef} />}
      <PlayerContent isCollapsed={isCollapsed}>
        <Section>
          <div>{playlist[currentTrack].title}</div>
          {!isCollapsed && <VisualizerContainer isCollapsed={isCollapsed} ref={waveformRef} />}
        </Section>
        <Section>
          <Controls>
            <ControlButton onClick={handlePrevTrack}><FaStepBackward /></ControlButton>
            <ControlButton onClick={isPlaying ? handlePause : handlePlay}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </ControlButton>
            <ControlButton onClick={handleNextTrack}><FaStepForward /></ControlButton>
          </Controls>
        </Section>
        <Section>
          <SocialLinks>
            <SocialIcon href={playlist[currentTrack].spotify} target="_blank" rel="noopener noreferrer">
              <FaSpotify />
            </SocialIcon>
            <SocialIcon href={playlist[currentTrack].apple} target="_blank" rel="noopener noreferrer">
              <FaApple />
            </SocialIcon>
            <SocialIcon href={playlist[currentTrack].instagram} target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </SocialIcon>
          </SocialLinks>
        </Section>
      </PlayerContent>
    </PlayerContainer>
  );
};

export default CustomAudioPlayer;
```

### ui/Navigation.js
```javascript
import React from 'react';
import Link from 'next/link';
import { MoonIcon } from '@heroicons/react/24/solid';
import { FloatingNav } from './FloatingNav';  // Corrected import

const navItems = [
  {
    name: 'Home',
    link: '/',
  },
  {
    name: 'About',
    link: '/about',
  },
  {
    name: 'Services',
    link: '/services',
  },
  {
    name: 'Contact',
    link: '/contact',
  },
];

const Navigation = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] flex justify-between items-center p-4">
      <Link href="/" className="flex items-center space-x-2">
        <MoonIcon className="h-8 w-8 text-white" />
        <span className="text-white font-bold text-xl">SweetDreams</span>
      </Link>
      <div className="flex-grow flex justify-center">
        <FloatingNav
          navItems={navItems}
          className="bg-black bg-opacity-50 backdrop-blur-md"
        />
      </div>
    </div>
  );
};

export default Navigation;
```

### ui/MeteorsBackground.js
```javascript
import React from "react";
import { Meteors } from "../../components/ui/aceternity";

export const MeteorsBackground = () => {
  return (
    <div className="relative h-full w-full">
      <Meteors number={20

} />
    </div>
  );
};
```

### ui/FloatingNav.js
```javascript
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const FloatingNav = ({ navItems, className = "" }) => {
  const path = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center space-x-4 bg-black bg-opacity-50 backdrop-blur-md px-4 py-2 rounded-full ${className}`}
    >
      {navItems.map((item, idx) => (
        <Link key={item.name} href={item.link}>
          <motion.div
            className={`px-4 py-2 rounded-full text-sm lg:text-base relative no-underline duration-300 ease-in ${
              path === item.link ? "text-zinc-100" : "text-zinc-400"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">{item.name}</span>
            {path === item.link && (
              <motion.div
                layoutId="active"
                className="absolute inset-0 bg-white bg-opacity-10 rounded-full"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              ></motion.div>
            )}
          </motion.div>
        </Link>
      ))}
    </motion.div>
  );
};
```

### ui/Meteors.js
```javascript
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const meteorEffect = keyframes`
  0% {
    transform: rotate(215deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(215deg) translateX(-500px);
    opacity: 0;
  }
`;

const MeteorSpan = styled.span`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  width: 2px;
  height: 2px;
  background-color: ${props => props.color};
  border-radius: 9999px;
  box-shadow: 0 0 0 1px ${props => props.color}10, 0 0 0 2px ${props => props.color}10, 0 0 20px ${props => props.color}80;
  transform: rotate(215deg);
  animation: ${meteorEffect} ${props => props.duration}s linear infinite;
  animation-delay: ${props => props.delay}s;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 1px;
    background: linear-gradient(to right, ${props => props.color}, transparent);
  }
`;

const MeteorsContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
`;

const colors = ['#ff4500', '#ffa500', '#ff6347', '#ff7f50', '#ff8c00'];

export const Meteors = ({ number = 20 }) => {
  const [meteorProps, setMeteorProps] = useState([]);

  useEffect(() => {
    const newMeteorProps = new Array(number).fill(true).map(() => ({
      top: Math.floor(Math.random() * window.innerHeight),
      left: Math.floor(Math.random() * window.innerWidth),
      duration: Math.floor(Math.random() * 8) + 2,
      delay: Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setMeteorProps(newMeteorProps);
  }, [number]);

  return (
    <MeteorsContainer>
      {meteorProps.map((props, idx) => (
        <MeteorSpan
          key={`meteor-${idx}`}
          {...props}
        />
      ))}
    </MeteorsContainer>
  );
};
```

### ui/SolarSystem.js
```javascript
import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

const THREE = typeof window !== 'undefined' ? require('three') : null;
const OrbitControls = typeof window !== 'undefined' ? require('three/examples/jsm/controls/OrbitControls').OrbitControls : null;

// Dynamically import the Meteors component
const Meteors = dynamic(() => import('./Meteors').then((mod) => mod.Meteors), {
  ssr: false
});

const CanvasContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
`;

const MeteorsWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
`;

const planets = [
  { name: 'Sun', value: 'Passion', size: 5, orbit: 0, color: 0xffff00 },
  { name: 'Mercury', value: 'Innovation', size: 1, orbit: 10, color: 0x8c7853 },
  { name: 'Venus', value: 'Experience', size: 1.5, orbit: 15, color: 0xffdab9 },
  { name: 'Earth', value: 'Collaboration', size: 2, orbit: 20, color: 0x6b93d6 },
  { name: 'Mars', value: 'Quality', size: 1.8, orbit: 25, color: 0xff4500 },
  { name: 'Jupiter', value: 'Dedication', size: 4, orbit: 35, color: 0xffa500 },
  { name: 'Saturn', value: 'Integrity', size: 3.5, orbit: 45, color: 0xffd700 },
  { name: 'Uranus', value: 'Growth', size: 3, orbit: 55, color: 0x40e0d0 },
  { name: 'Neptune', value: 'Community', size: 2.8, orbit: 65, color: 0x4169e1 },
];

const SolarSystem = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current || !THREE) return;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });

    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(rendererRef.current.domElement);

    const controls = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    cameraRef.current.position.set(0, 50, 100);
    controls.update();

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    sceneRef.current.add(ambientLight);

    // Stars (brighter)
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.3, transparent: true, opacity: 0.8 });

    const starVertices = [];
    for (let i = 0; i < 15000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    sceneRef.current.add(stars);

    // Create planets
    const planetMeshes = planets.map(planet => {
      const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: planet.color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = planet.orbit;
      sceneRef.current.add(mesh);
      return mesh;
    });

    // Animation
    const animate = () => {
      planetMeshes.forEach((mesh, index) => {
        const planet = planets[index];
        if (planet.orbit !== 0) {
          const angle = Date.now() * 0.0005 * (1 / planet.orbit);
          mesh.position.x = Math.cos(angle) * planet.orbit;
          mesh.position.z = Math.sin(angle) *

 planet.orbit;
        }
        mesh.rotation.y += 0.005;
      });

      controls.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      cancelAnimationFrame(animationFrameId.current);
      rendererRef.current.dispose();
    };
  }, []);

  return (
    <CanvasContainer ref={mountRef}>
      <MeteorsWrapper>
        <Meteors number={20} />
      </MeteorsWrapper>
    </CanvasContainer>
  );
};

export default SolarSystem;
```

---

## Components Not Currently Used

### SimplifiedNav.js
```javascript
import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 1000;
`;

const NavList = styled.ul`
  display: flex;
  justify-content: space-around;
  list-style-type: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin: 0 1rem;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s ease;

  &:hover {
    color: #ffa500;
  }
`;

const SimplifiedNav = () => {
  return (
    <NavContainer>
      <NavList>
        <NavItem>
          <NavLink href="/">Home</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/about">About</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/services">Services</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/contact">Contact</NavLink>
        </NavItem>
      </NavList>
    </NavContainer>
  );
};

export default SimplifiedNav;
```

### GlobeComponent.js
```javascript
import React from "react";
import dynamic from "next/dynamic";

const World = dynamic(() => import("./ui/globe").then((m) => m.World), {
  ssr: false,
});

export function GlobeComponent() {
  const globeConfig = {
    pointSize: 4,
    globeColor: "#062056",
    showAtmosphere: true,
    atmosphereColor: "#FFFFFF",
    atmosphereAltitude: 0.1,
    emissive: "#062056",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    polygonColor: "rgba(255,255,255,0.7)",
    ambientLight: "#38bdf8",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
  };

  const sampleArcs = [
    {
      order: 1,
      startLat: 40.7128,
      startLng: -74.006,
      endLat: 37.7749,
      endLng: -122.4194,
      arcAlt: 0.3,
      color: "#ff0000",
    },
    // Add more arcs as needed
  ];

  return (
    <div style={{ width: "100%", height: "100vh", position: "absolute", top: 0, left: 0 }}>
      <World data={sampleArcs} globeConfig={globeConfig} />
    </div>
  );
}
```

### EnhancedServicesSection.js
```javascript
import React from 'react';
import styled from 'styled-components';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const ServicesContainer = styled.section`
  background-color: #000000;
  padding: 4rem 2rem;
  position: relative;
  overflow: hidden;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

const ColumnLine = styled(motion.div)`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #ff00ff, #00ffff);
  left: ${props => props.left};
`;

const Circle = styled(motion.div)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 15px;
  height: 15px;
  background-color: #ffffff;
  border-radius: 50%;
`;

const ServiceCard = styled(motion.div)`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  backdrop-filter: blur(5px);
`;

const ServiceIcon = styled.div`
  width: 80px;
  height: 80px;
  background-color: #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 2rem;
`;

const ServiceTitle = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const ServiceDescription = styled.p`
  color: #b0b0b0;
  font-size: 0.9rem;
`;

const services = [
  { title: 'Recording', icon: '🎙️', description: 'State-of-the-art recording facilities' },
  { title: 'Music Production', icon: '🎚️', description: 'Professional music production services' },
  { title: 'Videography', icon: '🎥', description: 'High-quality video production' },
  { title: 'Web Design', icon: '💻', description: 'Custom website design for artists' },
  { title: 'Marketing', icon: '📈', description: 'Comprehensive marketing strategies' },
  { title: 'Artist Development', icon: '🌟', description: 'Nurturing emerging talent' },
];

const EnhancedServicesSection = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  React.useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <ServicesContainer ref={ref}>
      <ServicesGrid
        as={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        <ColumnLine left="33.33%" 
          animate={{ 
            background: ['linear-gradient(to bottom, #ff00ff, #00ffff)', 'linear-gradient(to bottom, #00ffff, #ff00ff)'] 
          }} 
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
        >
          <Circle top="25%" />
          <Circle top="75%" />
        </ColumnLine>
        <ColumnLine left="66.66%" 
          animate={{ 
            background: ['linear-gradient(to bottom, #00ffff, #ff00ff)', 'linear-gradient(to bottom, #ff00ff, #00ffff)'] 
          }} 
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
        >
          <Circle top="25%" />
          <Circle top="75%" />
        </ColumnLine>
        {services.map((service, index) => (
          <ServiceCard key={index} variants={itemVariants}>
            <ServiceIcon>{service.icon}</ServiceIcon>
            <ServiceTitle>{service.title}</ServiceTitle>
            <ServiceDescription>{service.description}</ServiceDescription>
          </ServiceCard>


        ))}
      </ServicesGrid>
    </ServicesContainer>
  );
};

export default EnhancedServicesSection;
```

### ServicesSection.js
```javascript
import React from 'react';
import styled from 'styled-components';

const ServicesContainer = styled.section`
  background-color: #000000;
  padding: 4rem 2rem;
  position: relative;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

const ColumnLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #333;
  left: ${props => props.left};

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 10px;
    height: 10px;
    background-color: #333;
    border-radius: 50%;
  }

  &::before {
    top: calc(25% - 5px);
  }

  &::after {
    top: calc(75% - 5px);
  }
`;

const ServiceCard = styled.div`
  background-color: #000000;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-10px);
  }
`;

const ServiceIcon = styled.div`
  width: 80px;
  height: 80px;
  background-color: #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const ServiceTitle = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const ServiceDescription = styled.p`
  color: #b0b0b0;
  font-size: 0.9rem;
`;

const services = [
  { title: 'Recording', icon: '🎙️', description: 'State-of-the-art recording facilities' },
  { title: 'Music Production', icon: '🎚️', description: 'Professional music production services' },
  { title: 'Videography', icon: '🎥', description: 'High-quality video production' },
  { title: 'Web Design', icon: '💻', description: 'Custom website design for artists' },
  { title: 'Marketing', icon: '📈', description: 'Comprehensive marketing strategies' },
  { title: 'Artist Development', icon: '🌟', description: 'Nurturing emerging talent' },
];

const ServicesSection = () => {
  return (
    <ServicesContainer>
      <ServicesGrid>
        <ColumnLine left="33.33%" />
        <ColumnLine left="66.66%" />
        {services.map((service, index) => (
          <ServiceCard key={index}>
            <ServiceIcon>{service.icon}</ServiceIcon>
            <ServiceTitle>{service.title}</ServiceTitle>
            <ServiceDescription>{service.description}</ServiceDescription>
          </ServiceCard>
        ))}
      </ServicesGrid>
    </ServicesContainer>
  );
};

export default ServicesSection;
```

### CombinedHeroNav.js
```javascript
import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const flicker = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
`;

const NavContainer = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #000;
  color: #fff;
  height: 80px;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const LEDText = styled.div`
  font-size: 2rem;
  font-weight: 300;
  font-family: 'Pacifico', cursive;
  color: #fff;
  white-space: nowrap;
  animation: ${flicker} 3s infinite;
  transition: color 0.3s ease;
`;

const CrescentMoon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  box-shadow: 7px 7px 0 0 #fff;
  transform: rotate(-20deg);
  margin-left: 10px;
  transition: box-shadow 0.3s ease;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const NavItem = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-size: 1rem;
  position: relative;
  padding-bottom: 5px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #fff;
    transition: background-color 0.3s ease;
  }

  &:hover::after {
    background-color: ${props => props.hoverColor || '#ff6b6b'};
  }
`;

const CombinedHeroNav = () => {
  const textRef = useRef(null);
  const moonRef = useRef(null);
  const navItemsRef = useRef([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      const gradient = `linear-gradient(135deg, 
        hsl(${x * 360}, 100%, 50%), 
        hsl(${y * 360}, 100%, 50%)
      )`;

      if (textRef.current) {
        textRef.current.style.webkitTextFillColor = 'transparent';
        textRef.current.style.webkitBackgroundClip = 'text';
        textRef.current.style.backgroundImage = gradient;
      }

      if (moonRef.current) {
        const color = `hsl(${(x + y) * 180}, 100%, 50%)`;
        moonRef.current.style.boxShadow = `7px 7px 0 0 ${color}`;
      }

      navItemsRef.current.forEach(item => {
        if (item) {
          item.style.setProperty('--hover-color', `hsl(${(x + y) * 180}, 100%, 50%)`);
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <NavContainer>
      <LogoSection>
        <LEDText ref={textRef}>Sweet Dreams</LEDText>
        <CrescentMoon ref={moonRef} />
      </LogoSection>
      <NavLinks>
        <NavItem to="/" ref={el => navItemsRef.current[0] = el}>Home</NavItem>
        <NavItem to="/work" ref={el => navItemsRef.current[1] = el}>Work</NavItem>
        <NavItem to="/book" ref={el => navItemsRef.current[2] = el}>Book</NavItem>
        <NavItem to="/contact" ref={el => navItemsRef.current[3] = el}>Contact</NavItem>
      </NavLinks>
    </NavContainer>
  );
};

export default CombinedHeroNav;
```

### MusicStaffNav.js
```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  right: 0;
  padding: 20px;
  z-index: 1000;
`;

const NavItem = styled(Link)`
  display: block;
  color: #fff;
  text-decoration: none;
  font-size: 1.2rem;
  margin-bottom: 15px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #fff;
    transition: background-color 0.3s ease;
  }

  &:hover::after {
    background-color: ${props => props.hoverColor || '#ff6b6b'};
  }
`;

const MusicStaffNav = () => {
  return (
    <NavContainer>
      <NavItem to="/">Home</NavItem>
      <NavItem to="/work">Work</NavItem>
      <NavItem to="/book">Book</NavItem>
      <NavItem to="/contact">Contact</NavItem>
    </NavContainer>
  );
};

export default MusicStaffNav;
```

### LEDEffect.js
```javascript
import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const LEDContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const LEDOverlay = styled.div`
  position: absolute;
  top: 0;
  left

: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const withLEDEffect = (WrappedComponent) => {
  return (props) => {
    const containerRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
      const container = containerRef.current;
      const overlay = overlayRef.current;

      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const gradient = `radial-gradient(
          circle 50px at ${x}px ${y}px,
          rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8),
          transparent
        )`;

        overlay.style.background = gradient;
      };

      const handleMouseLeave = () => {
        overlay.style.background = 'none';
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }, []);

    return (
      <LEDContainer ref={containerRef}>
        <WrappedComponent {...props} />
        <LEDOverlay ref={overlayRef} />
      </LEDContainer>
    );
  };
};

export default withLEDEffect;
```

### WaveformContact.js
```javascript
import React, { useState } from 'react';
import styled from 'styled-components';

const ContactContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const WaveformInput = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  background: #2a2a2a;
  border: none;
  color: white;
  border-radius: 5px;
`;

const WaveformTextarea = styled.textarea`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  background: #2a2a2a;
  border: none;
  color: white;
  border-radius: 5px;
  height: 150px;
`;

const SubmitButton = styled.button`
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 5px;
  transition: background 0.3s ease;

  &:hover {
    background: #ff8787;
  }
`;

const WaveformContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Here you could add logic to animate a waveform based on input
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <ContactContainer>
      <form onSubmit={handleSubmit}>
        <WaveformInput 
          type="text" 
          name="name" 
          placeholder="Your Name" 
          value={formData.name} 
          onChange={handleChange} 
        />
        <WaveformInput 
          type="email" 
          name="email" 
          placeholder="Your Email" 
          value={formData.email} 
          onChange={handleChange} 
        />
        <WaveformTextarea 
          name="message" 
          placeholder="Your Message" 
          value={formData.message} 
          onChange={handleChange} 
        />
        <SubmitButton type="submit">Send Message</SubmitButton>
      </form>
    </ContactContainer>
  );
};

export default WaveformContact;
```

### BookingPoster.js
```javascript
import React, { useState } from 'react';
import styled from 'styled-components';

const PosterContainer = styled.div`
  background: #1a1a1a;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const PosterTitle = styled.h2`
  color: #ff6b6b;
  text-align: center;
  font-size: 2rem;
`;

const DateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
`;

const DateButton = styled.button`
  background: ${props => props.isAvailable ? '#4ecdc4' : '#45b7d1'};
  color: white;
  border: none;
  padding: 10px;
  cursor: ${props => props.isAvailable ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.isAvailable ? 1 : 0.5};
`;

const BookingPoster = () => {
  const [selectedDate, setSelectedDate] = useState(null);

  // Simulated available dates
  const availableDates = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

  const handleDateClick = (date) => {
    if (availableDates.includes(date)) {
      setSelectedDate(date);
      // Here you would handle the booking logic
      console.log(`Selected date: ${date}`);
    }
  };

  return (
    <PosterContainer>
      <PosterTitle>Book Your Session</PosterTitle>
      <DateGrid>
        {[...Array(31)].map((_, i) => (
          <DateButton 
            key={i} 
            isAvailable={availableDates.includes(i + 1)}
            onClick={() => handleDateClick(i + 1)}
          >
            {i + 1}
          </DateButton>
        ))}
      </DateGrid>
    </PosterContainer>
  );
};

export default BookingPoster;
```

### PortfolioVisualizer.js
```javascript
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const VisualizerContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px;
`;

const Project = styled.div`
  width: 200px;
  height: 200px;
  background: ${props => props.color};
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const PortfolioVisualizer = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Simulating fetching projects from an API
    setProjects([
      { id: 1, name: 'Project 1', color: '#ff6b6b' },
      { id: 2, name: 'Project 2', color: '#4ecdc4' },
      { id: 3, name: 'Project 3', color: '#45b7d1' },
      { id: 4, name: 'Project 4', color: '#f7b731' },
    ]);
  }, []);

  const handleProjectClick = (project) => {
    // Here you would handle playing a sample or showing more details
    console.log(`Clicked on ${project.name}`);
  };

  return (
    <VisualizerContainer>
      {projects.map(project => (
        <Project 
          key={project.id} 
          color={project.color}
          onClick={() => handleProjectClick(project)}
        >
          {project.name}
        </Project>
      ))}
    </VisualizerContainer>
  );
};

export default PortfolioVisualizer;
```

### VinylServices.js
```javascript
import React, { useState } from 'react';
import styled from 'styled-components';

const VinylContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
`;

const Vinyl = styled.div`
  width: 300px;
  height: 300px;
  background: #333;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.5s ease;
  cursor: pointer;

  &:hover {
    transform: rotate(30deg);
  }
`;

const ServiceList = styled.ul`
  list-style-type: none;
  padding: 0;
  text-align: center;
`;

const Service = styled.li`
  margin: 10px 0;
  color: white;
`;

const VinylServices = () => {
  const [currentService, setCurrentService] = useState(0);
  const services = ['Recording', 'Mixing', 'Mastering', 'Production'];

  const rotateServices = () => {
    setCurrentService((prev) => (prev + 1) % services.length);
  };

  return (
    <VinylContainer>
      <Vinyl onClick={rotateServices}>
        <ServiceList>
          {services.map((service, index) => (
            <Service key={index} style={{ opacity: index === currentService ? 1 : 0.5 }}>
              {service}
            </Service>
          ))}
        </ServiceList>
      </Vinyl>
    </Vin

ylContainer>
  );
};

export default VinylServices;
```

### Footer.js
```javascript
import React, { useState } from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: #1a1a1a;
  padding: 1rem;
  text-align: center;
`;

const AudioControl = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const TrackButton = styled.button`
  background: ${props => props.active ? '#ff6b6b' : '#333'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #ff6b6b;
  }
`;

const Footer = () => {
  const [activeTracks, setActiveTracks] = useState({
    drums: true,
    bass: true,
    guitar: true,
    vocals: true,
  });

  const toggleTrack = (track) => {
    setActiveTracks(prev => ({ ...prev, [track]: !prev[track] }));
    // Here you would also handle the actual audio mixing
  };

  return (
    <FooterContainer>
      <AudioControl>
        <TrackButton active={activeTracks.drums} onClick={() => toggleTrack('drums')}>Drums</TrackButton>
        <TrackButton active={activeTracks.bass} onClick={() => toggleTrack('bass')}>Bass</TrackButton>
        <TrackButton active={activeTracks.guitar} onClick={() => toggleTrack('guitar')}>Guitar</TrackButton>
        <TrackButton active={activeTracks.vocals} onClick={() => toggleTrack('vocals')}>Vocals</TrackButton>
      </AudioControl>
    </FooterContainer>
  );
};

export default Footer;
```

### Header.js
```javascript
import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: linear-gradient(to right, #ff8a00, #da1b60);
  padding: 1rem;
  text-align: center;
`;

const Title = styled.h1`
  color: white;
  font-size: 2.5rem;
  margin: 0;
`;

const Header = () => {
  return (
    <HeaderContainer>
      <Title>Sweet Dreams Music</Title>
    </HeaderContainer>
  );
};

export default Header;
```
```

If there are any more files to include or further adjustments needed, please let me know!
Here is the updated Markdown file including only the new files you listed from the `src/components/ui` folder:

```markdown
# Sweet Dreams Website Repository

## Folder: sweet-dreams-website/src

### Files and Folders in this Directory:
- components
  - ui
    - globe.js
    - Meteors.tsx
    - navbar-menu.tsx
- styles
  - globals.css
  - GlobalStyles.js
- utils
  - cn.ts
- App.js
- App.test.js
- reportWebVitals.js
- setupTests.js
- index.css

### Components Not Currently Used:
- SimplifiedNav.js
- GlobeComponent.js
- EnhancedServicesSection.js
- ServicesSection.js
- CombinedHeroNav.js
- MusicStaffNav.js
- LEDEffect.js
- WaveformContact.js
- BookingPoster.js
- PortfolioVisualizer.js
- VinylServices.js
- Footer.js
- Header.js

---

## src/components/ui

### globe.js
```javascript
import React, { useRef, useEffect } from "react";
import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function World({ data, globeConfig }) {
  const containerRef = useRef();

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let scene, camera, renderer, globe, controls;

    const init = () => {
      // Scene setup
      scene = new Scene();
      
      // Camera setup
      camera = new PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
      camera.position.z = 300;

      // Renderer setup
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.appendChild(renderer.domElement);

      // Globe setup
      globe = new ThreeGlobe()
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .arcColor(() => globeConfig.arcColor || "white")
        .arcDashLength(globeConfig.arcLength)
        .arcDashGap(2)
        .arcDashAnimateTime(globeConfig.arcTime)
        .arcsData(data)
        .arcStroke(0.5);

      scene.add(globe);

      // Lights
      const ambientLight = new AmbientLight(0xbbbbbb, 0.3);
      scene.add(ambientLight);
      const directionalLight = new DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // Controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = true;

      // Animation
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    };

    init();

    // Cleanup
    return () => {
      if (renderer && renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (renderer) {
        renderer.dispose();
      }
      if (controls) {
        controls.dispose();
      }
    };
  }, [data, globeConfig]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
```

### Meteors.tsx
```typescript
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const meteorEffect = keyframes`
  0% {
    transform: rotate(215deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(215deg) translateX(-500px);
    opacity: 0;
  }
`;

const MeteorSpan = styled.span<{ top: number; left: number; color: string; duration: number; delay: number }>`
  position: absolute;
  top: ${({ top }) => top}px;
  left: ${({ left }) => left}px;
  width: 2px;
  height: 2px;
  background-color: ${({ color }) => color};
  border-radius: 9999px;
  box-shadow: 0 0 0 1px ${({ color }) => color}10, 0 0 0 2px ${({ color }) => color}10, 0 0 20px ${({ color }) => color}80;
  transform: rotate(215deg);
  animation: ${meteorEffect} ${({ duration }) => duration}s linear infinite;
  animation-delay: ${({ delay }) => delay}s;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 1px;
    background: linear-gradient(to right, ${({ color }) => color}, transparent);
  }
`;

const MeteorsContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
`;

const colors = ['#ff4500', '#ffa500', '#ff6347', '#ff7f50', '#ff8c00'];

export const Meteors: React.FC<{ number?: number }> = ({ number = 20 }) => {
  const [meteorProps, setMeteorProps] = useState<
    Array<{ top: number; left: number; duration: number; delay: number; color: string }>
  >([]);

  useEffect(() => {
    const newMeteorProps = new Array(number).fill(true).map(() => ({
      top: Math.floor(Math.random() * window.innerHeight),
      left: Math.floor(Math.random() * window.innerWidth),
      duration: Math.floor(Math.random() * 8) + 2,
      delay: Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setMeteorProps(newMeteorProps);
  }, [number]);

  return (
    <MeteorsContainer>
      {meteorProps.map((props, idx) => (
        <MeteorSpan key={`meteor-${idx}`} {...props} />
      ))}
    </MeteorsContainer>
  );
};
```

### navbar-menu.tsx
```typescript
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface NavItem {
  name: string;
  link: string;
}

const navItems: NavItem[] = [
  { name: 'Home', link: '/' },
  { name: 'About', link: '/about' },
  { name: 'Services', link: '/services' },
  { name: 'Contact', link: '/contact' },
];

export const NavbarMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-75 backdrop-blur-lg">
        <div className="text-white font-bold text-xl">
          <Link href="/">SweetDreams</Link>
        </div>
        <div className="text-white cursor-pointer lg:hidden" onClick={() => setIsOpen(!isOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'} />
          </svg>
        </div>
        <div className="hidden lg:flex space-x-4">
          {navItems.map((item) => (
            <Link key={item.name} href={item.link} className="text-white hover:text-gray-400">
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      <motion.div
        className={`lg:hidden ${isOpen ? 'block' : 'hidden'} bg-black bg-opacity-75 backdrop-blur-lg`}
        initial={{ height: 0 }}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center space-y-4 py-4">
          {navItems.map((item) => (
            <Link key={item.name} href={item.link} className="text-white hover:text-gray-400">
              {item.name}
            </Link>
          ))}
        </div>
      </motion.div>
    </nav>
  );
};
```
```

If there are any more files to include or further adjustments needed, please let me know!

# Node Modules Directory

@adobe, @alloc, @ampproject, @babel, @bcoe, @csstools, @emotion, @eslint, @eslint-community, @floating-ui, @hapi, @heroicons, @humanwhocodes, @iconify, @isaacs, @istanbuljs, @jest, @jridgewell, @leichtgewicht, @mediapipe, @monogrid, @mui, @next, @nicolo-ribaudo, @nodelib, @pkgjs, @pmmmwh, @popperjs, @react-native, @react-native-community, @react-spring, @react-three, @remix-run, @rnx-kit, @rollup, @rushstack, @sideway, @sinclair, @sinonjs, @surma, @svgr, @swc, @testing-library, @tootallnate, @trysound, @turf, @tweenjs, @types, @typescript-eslint, @ungap, @use-gesture, @webassemblyjs, @xtuc, @zeit, abort-controller, accepts, accessor-fn, acorn, acorn-jsx, ajv, anser, ansi-fragments, ansi-regex, ansi-styles, any-promise, anymatch, appdirsjs, arg, argparse, aria-query, array-buffer-byte-length, array-includes, array-union, array.prototype.findlast, array.prototype.findlastindex, array.prototype.flat, array.prototype.flatmap, array.prototype.toreversed, array.prototype.tosorted, arraybuffer.prototype.slice, asap, ast-types, ast-types-flow, astral-regex, async-limiter, autoprefixer, available-typed-arrays, axe-core, axobject-query, babel-core, babel-plugin-macros, babel-plugin-polyfill-corejs2, babel-plugin-polyfill-corejs3, babel-plugin-polyfill-regenerator, babel-plugin-transform-flow-enums, balanced-match, base64-js, bidi-js, binary-extensions, bl, brace-expansion, braces, browserslist, bser, buffer, buffer-from, busboy, bytes, call-bind, caller-callsite, caller-path, callsites, camelcase, camelcase-css, camelize, camera-controls, caniuse-lite, chalk, chokidar, chrome-launcher, ci-info, cli-cursor, cli-spinners, client-only, cliui, clone, clone-deep, clsx, color-convert, color-name, colorette, command-exists, commander, commondir, compressible, compression, concat-map, connect, convert-source-map, core-js-compat, core-util-is, cosmiconfig, cross-env, cross-spawn, css-color-keywords, css-to-react-native, cssesc, csstype, d3-array, d3-color, d3-delaunay, d3-format, d3-geo, d3-geo-voronoi, d3-interpolate, d3-scale, d3-scale-chromatic, d3-time, d3-time-format, d3-tricontour, damerau-levenshtein, data-joint, data-view-buffer, data-view-byte-length, data-view-byte-offset, dayjs, debounce, debug, decamelize, deep-equal, deep-is, deepmerge, defaults, define-data-property, define-properties, delaunator, denodeify, depd, destroy, detect-gpu, didyoumean, dir-glob, dlv, doctrine, dom-helpers, draco3d, earcut, eastasianwidth, ee-first, electron-to-chromium, emoji-regex, encodeurl, enhanced-resolve, envinfo, error-ex, error-stack-parser, errorhandler, es-abstract, es-define-property, es-errors, es-get-iterator, es-iterator-helpers, es-object-atoms, es-set-tostringtag, es-shim-unscopables, es-to-primitive, escalade, escape-html, escape-string-regexp, eslint, eslint-config-next, eslint-import-resolver-node, eslint-import-resolver-typescript, eslint-module-utils, eslint-plugin-import, eslint-plugin-jsx-a11y, eslint-plugin-react, eslint-plugin-react-hooks, eslint-scope, eslint-visitor-keys, espree, esprima, esquery, esrecurse, estraverse, esutils, etag, event-target-shim, execa, fast-deep-equal, fast-glob, fast-json-stable-stringify, fast-levenshtein, fast-xml-parser, fastq, fb-watchman, fflate, file-entry-cache, fill-range, finalhandler, find-cache-dir, find-root, find-up, flat-cache, flatted, flow-enums-runtime, flow-parser, for-each, foreground-child, fraction.js, frame-ticker, framer-motion, fresh, fs-extra, fs.realpath, fsevents, function-bind, function.prototype.name, functions-have-names, gensync, get-caller-file, get-intrinsic, get-stream, get-symbol-description, get-tsconfig, glob, glob-parent, globals, globalthis, globby, glsl-noise, gopd, graceful-fs, graphemer, h3-js, has-bigints, has-flag, has-property-descriptors, has-proto, has-symbols, has-tostringtag, hasown, hermes-estree, hermes-parser, hermes-profile-transformer, hls.js, hoist-non-react-statics, http-errors, human-signals, ieee754, ignore, image-size, immediate, import-fresh, imurmurhash, index-array-by, inflight, inherits, internal-slot, internmap, invariant, is-arguments, is-array-buffer, is-arrayish, is-async-function, is-bigint, is-binary-path, is-boolean-object, is-callable, is-core-module, is-data-view, is-date-object, is-directory, is-docker, is-extglob, is-finalizationregistry, is-fullwidth-code-point, is-generator-function, is-glob, is-interactive, is-map, is-negative-zero, is-number, is-number-object, is-path-inside, is-plain-object, is-promise, is-regex, is-set, is-shared-array-buffer, is-stream, is-string, is-symbol, is-typed-array, is-unicode-supported, is-weakmap, is-weakref, is-weakset, is-wsl, isarray, isexe, isobject, iterator.prototype, its-fine, jackspeak, jest-environment-node, jest-get-type, jest-message-util, jest-mock, jest-util, jest-validate, jest-worker, jiti, joi, js-tokens, js-yaml, jsc-android, jsc-safe-url, jscodeshift, jsesc, json-buffer, json-parse-better-errors, json-parse-even-better-errors, json-schema-traverse, json-stable-stringify-without-jsonify, json5, jsonfile, jsx-ast-utils, kapsule, keyv, kind-of, kleur, konva, language-subtag-registry, language-tags, leven, levn, lie, lighthouse-logger, lilconfig, lines-and-columns, locate-path, lodash-es, lodash.debounce, lodash.merge, lodash.throttle, log-symbols, logkitty, loose-envify, lru-cache, maath, make-dir, makeerror, marky, memoize-one, merge-stream, merge2, meshline, meshoptimizer, metro, metro-babel-transformer, metro-cache, metro-cache-key, metro-config, metro-core, metro-file-map, metro-minify-terser, metro-resolver, metro-runtime, metro-source-map, metro-symbolicate, metro-transform-plugins, metro-transform-worker, micromatch, mime, mime-db, mime-types, mimic-fn, minimatch, minimist, minipass, mkdirp, ms, mz, nanoid, natural-compare, negotiator, neo-async, next, nocache, node-abort-controller, node-dir, node-fetch, node-forge, node-int64, node-releases, node-stream-zip, normalize-path, normalize-range, npm-run-path, nullthrows, ob1, object-assign, object-hash, object-inspect, object-is, object-keys, object.assign, object.entries, object.fromentries, object.groupby, object.hasown, object.values, on-finished, on-headers, once, onetime, open, optionator, ora, p-limit, p-locate, p-try, parent-module, parse-json, parseurl, path-exists, path-is-absolute, path-key, path-parse, path-scurry, path-type, picocolors, picomatch, pify, pirates, pkg-dir, possible-typed-array-names, postcss, postcss-import, postcss-js, postcss-load-config, postcss-nested, postcss-selector-parser, postcss-value-parser, potpack, prelude-ls, pretty-format, process-nextick-args, promise, promise-worker-transferable, prompts, prop-types, punycode, querystring, queue, queue-microtask, rafor, range-parser, react, react-composer, react-devtools-core, react-dom, react-h5-audio-player, react-icons, react-intersection-observer, react-is, react-konva, react-reconciler, react-refresh, react-shallow-renderer, react-spring, react-transition-group, react-use-measure, react-zdog, read-cache, readable-stream, readdirp, readline, recast, reflect.getprototypeof, regenerate, regenerate-unicode-properties, regenerator-runtime, regenerator-transform, regexp.prototype.flags, regexpu-core, regjsparser, require-directory, require-from-string, require-main-filename, resize-observer-polyfill, resolve, resolve-from, resolve-pkg-maps, restore-cursor, reusify, rimraf, robust-predicates, run-parallel, safe-array-concat, safe-buffer, safe-regex-test, scheduler, selfsigned, semver, send, serialize-error, serve-static, set-blocking, set-function-length, set-function-name, setprototypeof, shallow-clone, shallowequal, shebang-command, shebang-regex, shell-quote, side-channel, signal-exit, simplesignal, sisteransi, slash, slice-ansi, source-map, source-map-js, source-map-support, sprintf-js, stack-utils, stackframe, stacktrace-parser, stats-gl, stats.js, statuses, stop-iteration-iterator, streamsearch, string-width, string-width-cjs, string.prototype.includes, string.prototype.matchall, string.prototype.trim, string.prototype.trimend, string.prototype.trimstart, string_decoder, strip-ansi, strip-ansi-cjs, strip-bom, strip-final-newline, strip-json-comments, strnum, styled-components, styled-jsx, stylis, sucrase, sudo-prompt, supports-color, supports-preserve-symlinks-flag, suspend-react, tailwind-merge, tailwindcss, tapable, temp, temp-dir, terser, text-table, thenify, thenify-all, three, three-conic-polygon-geometry, three-fatline, three-geojson-geometry, three-globe, three-mesh-bvh, three-stdlib, throat, through2, tinycolor2, tmpl, to-fast-properties, to-regex-range, toidentifier, tr46, troika-three-text, troika-three-utils, troika-worker-utils, ts-api-utils, ts-interface-checker, tsconfig-paths, tslib, tunnel-rat, type-check, type-detect, type-fest, typed-array-buffer, typed-array-byte-length, typed-array-byte-offset, typed-array-length, typescript, unbox-primitive, undici-types, unicode-canonical-property-names-ecmascript, unicode-match-property-ecmascript, unicode-match-property-value-ecmascript, unicode-property-aliases-ecmascript, universalify, unpipe, update-browserslist-db, uri-js, use-sync-external-store, util-deprecate, utility-types, utils-merge, uuid, vary, vlq, walker, wavesurfer.js, wcwidth, webgl-constants, webgl-sdf-generator, webidl-conversions, whatwg-fetch, whatwg-url, which, which-boxed-primitive, which-builtin-type, which-collection, which-module, which-typed-array, word-wrap, wrap-ansi, wrap-ansi-cjs, wrappy, write-file-atomic, ws, xtend, y18n, yallist, yaml, yaot, yargs, yargs-parser, yocto-queue, zdog, zustand
