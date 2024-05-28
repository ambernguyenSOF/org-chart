import "@/styles/globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import "@/lib/fontAwesome";
import '@fortawesome/fontawesome-free/css/all.min.css'; // Ensure this imports Font Awesome CSS
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {

  useEffect(() => {
    require("bootstrap/dist/js/bootstrap");
  }, []);
  
  return <Component {...pageProps} />;

}
