// pages/host/stripe-callback.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';

export default function StripeCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user, profile } = useAuth();

  useEffect(() => {
    const handleReturn = async () => {
      try {
        if (!user) {
          // If no user, wait a bit and retry
          setTimeout(() => {
            handleReturn();
          }, 500);
          return;
        }

        // Get the returnUrl from the query parameter or localStorage
        const { returnUrl } = router.query;
        const storedReturnUrl = localStorage.getItem('stripe-connect-return-url');
        const targetUrl = returnUrl || storedReturnUrl || '/host/dashboard';
        
        // Clean up localStorage
        if (storedReturnUrl) {
          localStorage.removeItem('stripe-connect-return-url');
        }

        // Check if the user has a stripe_account_id (which should be the case after successful onboarding)
        if (profile && profile.stripe_account_id) {
          console.log('Stripe account connected successfully, redirecting to:', targetUrl);
          router.push(targetUrl);
        } else {
          // If the profile doesn't have a stripe_account_id yet, it could be that the profile data
          // hasn't been updated yet. Let's redirect to the dashboard anyway, which will redirect
          // to the connect-stripe page if needed.
          console.log('No Stripe account ID found in profile, redirecting to dashboard');
          router.push('/host/dashboard');
        }
      } catch (error) {
        console.error('Error handling Stripe callback:', error);
        setError('An error occurred processing your Stripe account. Please try again.');
        setLoading(false);
      }
    };

    if (router.isReady) {
      handleReturn();
    }
  }, [router, user, profile]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10 text-center">
        <h2 className="text-xl font-bold mb-4">Processing Stripe Connection</h2>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Please wait while we complete your Stripe setup...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10 text-center">
        <h2 className="text-xl font-bold mb-4">Error Connecting to Stripe</h2>
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/host/dashboard')}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition font-semibold"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // This should generally not be visible as we'll redirect
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10 text-center">
      <h2 className="text-xl font-bold mb-4">Stripe Connection Successful</h2>
      <p className="text-gray-600 mb-4">You have successfully connected your Stripe account.</p>
      <button
        onClick={() => router.push('/host/dashboard')}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition font-semibold"
      >
        Continue to Dashboard
      </button>
    </div>
  );
}

StripeCallback.getLayout = function getLayout(page) {
  return <Layout title="Stripe Connection - Guestify">{page}</Layout>;
};