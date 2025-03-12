import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ConnectStripe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true); // Per gestire il caricamento iniziale
  const router = useRouter();
  const { user, profile } = useAuth();

  // Controlla se l'utente ha già un account Stripe
  useEffect(() => {
    const checkStripeAccount = async () => {
      try {
        setPageLoading(true);
        
        // Se abbiamo già le informazioni sul profilo dall'Auth Context
        if (profile && profile.stripe_account_id) {
          console.log('User already has Stripe account, redirecting to dashboard');
          
          // Se c'è un returnUrl nei parametri, usa quello
          const returnUrl = router.query.returnUrl;
          if (returnUrl) {
            router.push(returnUrl);
          } else {
            router.push('/host/dashboard');
          }
          return;
        }
        
        // Se non abbiamo il profilo nel context, fai un controllo diretto
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('stripe_account_id')
            .eq('id', user.id)
            .single();
            
          if (!error && data && data.stripe_account_id) {
            console.log('User already has Stripe account, redirecting to dashboard');
            
            // Se c'è un returnUrl nei parametri, usa quello
            const returnUrl = router.query.returnUrl;
            if (returnUrl) {
              router.push(returnUrl);
            } else {
              router.push('/host/dashboard');
            }
            return;
          }
        }
        
        // Altrimenti, mostra la pagina
        setPageLoading(false);
      } catch (err) {
        console.error('Error checking Stripe account:', err);
        setPageLoading(false);
      }
    };
    
    // Ottieni i dati della sessione
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        setSessionData(data.session);
      }
    };
    
    checkStripeAccount();
    getSession();
  }, [user, profile, router]);

  const handleConnect = async () => {
    // Il resto della funzione rimane uguale...
    // [Mantieni il codice esistente per handleConnect]
  };

  const handleSkip = () => {
    // Se c'è un returnUrl nei parametri, usa quello
    const returnUrl = router.query.returnUrl;
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.push('/host/dashboard');
    }
  };

  // Mostra un indicatore di caricamento mentre controlliamo lo stato dell'account Stripe
  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10 text-center">
      <h2 className="text-2xl font-bold mb-4">Connect Your Stripe Account</h2>
      <p className="text-sm text-gray-500 mb-6">
        To receive payments, please connect or create your Stripe account.
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition font-semibold"
      >
        {loading ? 'Connecting...' : 'Connect Stripe'}
      </button>

      <div className="mt-4">
        <p className="text-xs text-gray-400">
          You can skip this step and connect later from your dashboard.
        </p>
        <button
          onClick={handleSkip}
          className="text-gray-500 underline mt-2 text-sm"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

ConnectStripe.getLayout = function getLayout(page) {
  return <Layout title="Connect Stripe - Guestify">{page}</Layout>;
};