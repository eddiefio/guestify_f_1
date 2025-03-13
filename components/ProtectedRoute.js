// components/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, authInitialized } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  
  useEffect(() => {
    // If auth is initialized
    if (authInitialized) {
      // If no user after initialization is complete
      if (!user && !loading) {
        console.log('No user found, redirecting to signin');
        // Use router.replace instead of window.location for smoother transition
        router.replace('/auth/signin');
      } else if (user) {
        // User is authenticated, stop verifying
        setIsVerifying(false);
      } 
      // If still loading, keep showing loading state
    }
    
    // Backup timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isVerifying) {
        console.log('Verification timed out, showing content anyway');
        setIsVerifying(false);
      }
    }, 8000);
    
    return () => clearTimeout(timeout);
  }, [user, loading, authInitialized, router, isVerifying]);

  if (loading || (isVerifying && !user)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="ml-3 text-gray-600">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}