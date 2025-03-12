// components/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Attendiamo che l'auth sia caricata
    if (!loading) {
      if (!user) {
        // Se non c'è un utente, reindirizza alla pagina di login
        console.log('No user found, redirecting to login');
        router.push('/auth/signin');
      } else {
        // Utente verificato, non è più necessario verificare
        setIsVerifying(false);
      }
    }
  }, [user, loading, router]);

  // Mostra un'interfaccia di caricamento o nulla durante la verifica
  if (loading || isVerifying) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Se l'utente è autenticato, mostra il contenuto della pagina
  return <>{children}</>;
}