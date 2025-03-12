// pages/_app.js
import '../styles/global.css';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);

  // Questo effetto garantisce che l'idratazione sia completata
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        integrity="sha512-iecdLmaskl7CVpqr0aRwUbEi0FqVIMC1VLxoJrEzVjdPqp05tO4vc1+GjKVvGFBPFHG6+M1YVHVGB8zN1E2z5Q==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />
      
      {/* Rendiamo il contenuto solo quando siamo sul client per evitare problemi di idratazione */}
      {isClient && (
        <AuthProvider>
          <CartProvider>
            {getLayout(<Component {...pageProps} />)}
          </CartProvider>
        </AuthProvider>
      )}
    </>
  );
}

export default MyApp;