// pages/host/stripe-redirect.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function StripeRedirect() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Processing your Stripe connection...');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !router.isReady) return;

    const handleStripeRedirect = async () => {
      try {
        console.log('Processing Stripe redirect with user:', user.id);
        
        const { account_id, success, error: errorFlag } = router.query;
        
        if (errorFlag) {
          throw new Error('Error during Stripe onboarding process');
        }
        
        if (!account_id) {
          throw new Error('No Stripe account ID provided in redirect');
        }
        
        console.log('Received Stripe account ID:', account_id);

        const { data, error } = await supabase
          .from('profiles')
          .update({ stripe_account_id: account_id })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }

        console.log('Successfully updated profile with Stripe account ID');
        setStatus('success');
        setMessage('Your Stripe account has been successfully connected!');

        // Redirect to printqr page after a short delay
        setTimeout(() => {
          const propertyId = localStorage.getItem('property_id_for_qr');
          if (propertyId) {
            localStorage.removeItem('property_id_for_qr');
            router.push(`/host/printqr/${propertyId}`);
          } else {
            router.push('/host/dashboard');
          }
        }, 2000);
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