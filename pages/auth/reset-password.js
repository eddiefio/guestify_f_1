// pages/auth/reset-password.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { updatePassword } = useAuth();

  // Extract the token from URL or query params
  useEffect(() => {
    // Next.js way to access URL parameters
    const { access_token } = router.query;
    
    if (access_token) {
      setAccessToken(access_token);
      
      // Store in a cookie for later use if needed
      // This could be enhanced with a better secure storage mechanism
      document.cookie = `access_token=${access_token}; path=/; max-age=3600; SameSite=Lax`;
    } else {
      // Try to get token from cookie
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
      
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1];
        setAccessToken(token);
      }
    }
  }, [router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Set auth if we have a token
      if (accessToken) {
        supabase.auth.setSession(accessToken);
      }

      const { error } = await updatePassword(newPassword);
      
      if (error) throw error;
      
      setSuccess(true);
      
      // Clear the token cookie
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
      <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
      <p className="text-sm text-gray-500 mb-4">
        Please enter your new password below.
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          Password updated successfully! Redirecting to sign in...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="access_token" value={accessToken} />

        <div>
          <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            id="new_password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="********"
            required
          />
        </div>
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            id="confirm_password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="********"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition font-semibold"
          disabled={loading || !accessToken}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <Link href="/auth/signin">
          <span className="text-blue-500 hover:underline cursor-pointer">Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}

ResetPassword.getLayout = function getLayout(page) {
  return <AuthLayout title="Reset Password - Guestify">{page}</AuthLayout>;
};