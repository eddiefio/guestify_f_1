// pages/_app.js - Modified to remove unnecessary loading spinner
import '../styles/global.css';
import Head from 'next/head';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

function MyApp({ Component, pageProps }) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />
      
      <AuthProvider>
        <CartProvider>
          {getLayout(<Component {...pageProps} />)}
        </CartProvider>
      </AuthProvider>
    </>
  );
}

export default MyApp;