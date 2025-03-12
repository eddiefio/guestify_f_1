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
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const { user, profile } = useAuth();

  console.log("ConnectStripe - User profile:", profile);

  // Check if user already has a Stripe account connected
  useEffect(() => {
    if (!user || !profile) return;
    
    // If the profile has a stripe_account_id, redirect to the return URL or dashboard
    if (profile.stripe_account_id) {
      console.log('User already has Stripe connected:', profile.stripe_account_id);
      setRedirecting(true);
      
      // Get returnUrl from query parameters
      const { returnUrl } = router.query;
      
      // Redirect after a short delay
      setTimeout(() => {
        if (returnUrl) {
          console.log('Redirecting to:', returnUrl);
          router.push(returnUrl);
        } else {
          console.log('Redirecting to dashboard');
          router.push('/host/dashboard');
        }
      }, 500);
    }
  }, [user, profile, router]);

  // Get the session data when the page loads
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
      // Store return URL in localStorage
      if (router.query.returnUrl) {
        localStorage.setItem('stripe_return_url', router.query.returnUrl);
      }
      
      // Call Stripe connect API
      let response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id,
          userEmail: user?.email,
          accessToken: sessionData?.access_token,
          returnUrl: router.query.returnUrl 
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect with Stripe');
      }

      // Redirect to Stripe onboarding
      if (data.url) {
        console.log('Redirecting to Stripe onboarding:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No redirect URL returned');
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      setError(error.message || 'An error occurred connecting to Stripe');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Get the returnUrl from query parameters
    const { returnUrl } = router.query;
    
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.push('/host/dashboard');
    }
  };

  // If redirecting, show a loading message
  if (redirecting) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Stripe account already connected. Redirecting...</p>
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