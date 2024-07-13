import '../styles/globals.css';
import Navbar from '../components/Navigation.jsx';
import Navigation from '../components/Navigation.jsx';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navigation />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;