// components/ProtectedRoute.js - Versione corretta
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, authInitialized } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (!loading && authInitialized) {
      if (!user) {
        window.location.href = '/auth/signin';
      } else {
        setIsVerifying(false);
      }
    }
  }, [user, loading, authInitialized]);

  if (loading || isVerifying) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}