import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '../../components/layout/AuthLayout';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const [message, setMessage] = useState('Processing your confirmation...');
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Get the hash parameters from the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    const handleConfirmation = async () => {
      try {
        if (type === 'recovery') {
          // Handle password reset
          router.push('/auth/reset-password');
          return;
        }

        if (!accessToken) {
          throw new Error('No access token found');
        }

        // Set the session and finalize the confirmation
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;

        setMessage('Email confirmed successfully! Redirecting to login...');
        
        // Redirect to signin after a brief delay
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } catch (err) {
        console.error('Error processing confirmation:', err);
        setError(err.message || 'Failed to confirm email');
      }
    };

    handleConfirmation();
  }, [router]);

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10 text-center">
      <h2 className="text-xl font-bold mb-4">Email Confirmation</h2>
      
      {error ? (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}

AuthCallback.getLayout = function getLayout(page) {
  return <AuthLayout title="Email Confirmation - Guestify">{page}</AuthLayout>;
};