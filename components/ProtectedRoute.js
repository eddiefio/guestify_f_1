// components/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, authInitialized } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Only proceed if auth is initialized and not loading
    if (!loading && authInitialized) {
      if (!user && !redirectAttempted) {
        console.log('No authenticated user found, redirecting to signin');
        setRedirectAttempted(true);
        
        // Use router instead of window.location for more controlled navigation
        router.push('/auth/signin');
      } else if (user) {
        // User is authenticated, allow rendering the protected content
        setIsVerifying(false);
      }
    }
  }, [user, loading, authInitialized, router, redirectAttempted]);

  if (loading || isVerifying) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="ml-3 text-gray-600">Verifying authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}