// components/layout/AuthLayout.js
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthLayout({ children, title = 'Guestify - Auth' }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Guestify - Authentication" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Header */}
      <header className="bg-[#5e2bff] p-4 shadow-md rounded-b-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/images/guestify_logo.png" 
              alt="Guestify" 
              width={32} 
              height={32} 
              quality={100}
              className="h-8 w-auto object-contain" 
              priority
            />
          </div>
          <nav className="flex items-center">
            {user && (
              <>
                <Link href="/host/dashboard">
                  <span className="mx-1 sm:mx-2 text-white font-semibold hover:opacity-80 transition-colors text-sm sm:text-base cursor-pointer">
                    Dashboard
                  </span>
                </Link>
                <Link href="/auth/logout">
                  <span className="mx-1 sm:mx-2 text-white hover:opacity-80 transition-colors text-sm sm:text-base cursor-pointer">
                    Logout
                  </span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto my-4 p-2 sm:p-4 rounded-xl flex-grow">
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