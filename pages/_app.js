// pages/_app.js
import '../styles/global.css';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { UserProvider } from '../contexts/UserContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);

  function MyApp({ Component, pageProps }) {
    return (
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    );
  }

  // Questo effetto garantisce che l'idratazione sia completata
  useEffect(() => {
    setIsClient(true);
    
    // Safety timeout to ensure isClient gets set to true
    const timeoutId = setTimeout(() => {
      if (!isClient) {
        console.warn('Client hydration timed out, forcing completion');
        setIsClient(true);
      }
    }, 2000); // 2 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, [isClient]);

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
      
      {/* Even if client-side hydration is not complete, 
          render a basic loading indicator rather than nothing */}
      {!isClient ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
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