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