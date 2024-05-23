import "@/styles/globals.css";
import "@/lib/fontAwesome";
import '@fortawesome/fontawesome-free/css/all.min.css'; // Ensure this imports Font Awesome CSS

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
