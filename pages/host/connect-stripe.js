// pages/host/connect-stripe.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ConnectStripe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { user, profile } = useAuth();

  // Check if user already has Stripe connected
  useEffect(() => {
    if (!user || isRedirecting) return;
    
    // If profile is loaded and has stripe_account_id
    if (profile && profile.stripe_account_id) {
      setIsRedirecting(true);
      console.log('User already has Stripe connected, redirecting...');
      
      // Check if there's a returnUrl in the query parameters
      const { returnUrl } = router.query;
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push('/host/dashboard');
      }
    }
  }, [profile, router, isRedirecting, user]);

  // Get session data when the page loads
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        setSessionData(data.session);
        console.log("Session loaded successfully");
      } else {
        console.error("Error loading session:", error);
      }
    };
    
    getSession();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Store the returnUrl in localStorage before making the API call
      if (router.query.returnUrl) {
        localStorage.setItem('stripe-connect-return-url', router.query.returnUrl);
      }
      
      // Prima prova con l'endpoint normale
      let response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id,
          userEmail: user?.email,
          accessToken: sessionData?.access_token,
          returnUrl: router.query.returnUrl // Pass the returnUrl to the API
        }),
        credentials: 'include'
      });

      // Se fallisce, prova con l'endpoint diretto
      if (!response.ok) {
        console.log("Regular endpoint failed, trying direct connect");
        response = await fetch('/api/stripe/direct-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user?.id,
            userEmail: user?.email,
            returnUrl: router.query.returnUrl
          })
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect with Stripe');
      }

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
    const { returnUrl } = router.query;
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.push('/host/dashboard');
    }
  };

  // Render loading or the connect form
  if (isRedirecting) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Redirecting...</p>
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