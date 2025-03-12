import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ConnectStripe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user } = useAuth();

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Usa direttamente la funzione built-in di supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!sessionData.session) {
        throw new Error('No active session found. Please login again.');
      }
      
      // Debug per verificare info di sessione
      console.log('Session data:', JSON.stringify({
        hasSession: !!sessionData.session,
        hasToken: !!sessionData.session?.access_token,
        userId: user?.id
      }));

      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Usa il token dalla sessione corrente
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ 
          userId: user?.id,
          // Invia anche l'email per debug
          userEmail: user?.email 
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect with Stripe');
      }

      const data = await response.json();

      // Redirect to Stripe onboarding
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No redirect URL returned');
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      setError(error.message || 'An error occurred connecting to Stripe');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/host/dashboard');
  };

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