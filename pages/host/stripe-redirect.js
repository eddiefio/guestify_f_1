// pages/host/stripe-redirect.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Stripe from 'stripe';

export default function StripeRedirect() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Processing your Stripe account...');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !router.isReady) return;

    const handleStripeRedirect = async () => {
      try {
        // Get the source and state from the URL (Stripe adds these params)
        const { source, state } = router.query;
        
        console.log('Processing Stripe redirect with user:', user.id);
        console.log('URL params:', router.query);
        
        // Initialize Stripe
        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY || 
                          'sk_test_your_stripe_key'; // You might want to use a proper key here
        const stripe = new Stripe(stripeKey);
        
        // Get Stripe account information - this should confirm the account is created
        // We need to call your backend API since we can't use the Stripe secret key in the browser
        const response = await fetch('/api/stripe/get-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: user.id,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to retrieve Stripe account');
        }
        
        const stripeAccountId = data.stripeAccountId;
        
        if (!stripeAccountId) {
          throw new Error('No Stripe account ID returned from server');
        }
        
        console.log('Retrieved Stripe account ID:', stripeAccountId);
        
        // Update the user's profile with the Stripe account ID
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_account_id: stripeAccountId })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating profile with Stripe account ID:', updateError);
          throw updateError;
        }
        
        console.log('Successfully updated profile with Stripe account ID');
        setStatus('success');
        setMessage('Your Stripe account has been successfully connected!');
        
        // Get the returnUrl from localStorage
        const returnUrl = localStorage.getItem('stripe_return_url');
        if (returnUrl) {
          localStorage.removeItem('stripe_return_url');
          
          // Redirect after a short delay so the user sees the success message
          setTimeout(() => {
            router.push(returnUrl);
          }, 2000);
        } else {
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/host/dashboard');
          }, 2000);
        }
      } catch (error) {
        console.error('Error handling Stripe redirect:', error);
        setStatus('error');
        setMessage(`Error: ${error.message || 'Failed to connect Stripe account'}`);
      }
    };

    handleStripeRedirect();
  }, [user, router]);

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {status === 'loading' ? 'Processing Stripe Connection' : 
         status === 'success' ? 'Stripe Connected!' : 
         'Connection Error'}
      </h2>
      
      <div className="mb-4 text-center">
        {status === 'loading' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-green-500 text-5xl mb-4">
            <i className="fas fa-check-circle"></i>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-red-500 text-5xl mb-4">
            <i className="fas fa-exclamation-circle"></i>
          </div>
        )}
        
        <p className={`mt-4 ${
          status === 'loading' ? 'text-gray-600' : 
          status === 'success' ? 'text-green-700' : 
          'text-red-700'
        }`}>
          {message}
        </p>
      </div>
      
      {status === 'error' && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => router.push('/host/connect-stripe')}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

StripeRedirect.getLayout = function getLayout(page) {
  return <Layout title="Stripe Connection - Guestify">{page}</Layout>;
};