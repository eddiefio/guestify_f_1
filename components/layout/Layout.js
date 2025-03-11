// components/layout/Layout.js
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout({ children, title = 'Guestify' }) {
  const { user, signOut } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Guestify - Food service for Airbnb hosts" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Header */}
      <header className="bg-[#5e2bff] p-4 shadow-md rounded-b-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            {user ? (
              <Link href="/host/dashboard">
                <span className="cursor-pointer">
                  <Image 
                    src="/images/guestify_logo.png" 
                    alt="Guestify" 
                    width={40} 
                    height={40} 
                    className="h-10 w-auto" 
                  />
                </span>
              </Link>
            ) : (
              <span>
                <Image 
                  src="/images/guestify_logo.png" 
                  alt="Guestify" 
                  width={40} 
                  height={40} 
                  className="h-10 w-auto" 
                />
              </span>
            )}
          </div>
          <nav className="flex items-center">
            {user ? (
              <>
                <Link href="/host/dashboard">
                  <span className="mx-1 sm:mx-2 text-white font-semibold hover:opacity-80 transition-colors text-sm sm:text-base cursor-pointer">
                    Dashboard
                  </span>
                </Link>
                <button 
                  onClick={signOut}
                  className="mx-1 sm:mx-2 text-white hover:opacity-80 transition-colors text-sm sm:text-base bg-transparent border-none cursor-pointer"
                >
                  Logout
                </button>
                <Link href="/host/profile">
                  <span className="ml-2 cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-white text-[#5e2bff] flex items-center justify-center">
                      <i className="fas fa-smile"></i>
                    </div>
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <span className="mx-1 sm:mx-2 text-white hover:opacity-80 transition-colors text-sm sm:text-base cursor-pointer">
                    Login
                  </span>
                </Link>
                <Link href="/auth/signup">
                  <span className="mx-1 sm:mx-2 text-white hover:opacity-80 transition-colors text-sm sm:text-base cursor-pointer">
                    Signup
                  </span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-6xl mx-auto my-4 p-2 sm:p-4 rounded-xl flex-grow w-full">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-[#5e2bff] p-4 rounded-t-xl">
        <div className="max-w-6xl mx-auto text-center text-white text-sm">
          <p>&copy; {new Date().getFullYear()} Guestify</p>
        </div>
      </footer>
    </div>
  );
}