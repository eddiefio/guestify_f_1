// components/layout/GuestLayout.js
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';

export default function GuestLayout({ children, title = 'Guestify - Guest' }) {
  const { getCartCount, propertyId } = useCart();
  const cartCount = getCartCount();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Guestify - Food service for Airbnb guests" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Header */}
      <header className="bg-[#5e2bff] p-4 shadow-md rounded-b-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            {propertyId ? (
              <Link href={`/guest/menu/${propertyId}`}>
                <span className="cursor-pointer">
                  <Image 
                    src="/images/guestify_logo.png" 
                    alt="Guestify Logo" 
                    width={40} 
                    height={40}
                    quality={100}
                    priority
                    className="w-10 h-10"
                    style={{ objectFit: 'contain' }}
                  />
                </span>
              </Link>
            ) : (
              <Image 
                src="/images/guestify_logo.png" 
                alt="Guestify Logo" 
                width={40} 
                height={40}
                quality={100}
                priority
                className="w-10 h-10"
                style={{ objectFit: 'contain' }}
              />
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Link href="/guest/cart">
                <span className="text-white hover:opacity-80 relative cursor-pointer">
                  <i className="fas fa-shopping-cart text-2xl"></i>
                  {cartCount > 0 && (
                    <span className="absolute top-[-8px] right-[-8px] bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-6xl mx-auto my-4 p-2 sm:p-4 w-full flex-grow">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-[#5e2bff] p-4">
        <div className="max-w-6xl mx-auto text-center text-white text-sm">
          <p>&copy; {new Date().getFullYear()} Guestify</p>
        </div>
      </footer>
    </div>
  );
}