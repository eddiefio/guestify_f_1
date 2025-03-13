// pages/auth/signin.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const router = useRouter();
  const { signIn, user } = useAuth();

  // Check if the user just registered
  useEffect(() => {
    // Check if we have the newRegistration query parameter and the localStorage flag
    const hasNewRegistrationParam = router.query.newRegistration === 'true';
    const hasLocalStorageFlag = typeof window !== 'undefined' && 
                              localStorage.getItem('showConfirmEmailMessage') === 'true';
    
    if (hasNewRegistrationParam && hasLocalStorageFlag) {
      setSuccessMessage('Registration successful! Please check your email to confirm your account before signing in.');
      // Remove the flag after showing the message
      localStorage.removeItem('showConfirmEmailMessage');
    }
  }, [router.query]);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/host/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user, error } = await signIn(email, password);
      
      if (error) throw error;
      
      if (user) {
        // Attendiamo un momento prima di reindirizzare
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.href = '/host/dashboard';
      } else {
        throw new Error('No user returned from login');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
      <h2 className="text-2xl font-bold mb-2">Sign in</h2>
      <p className="text-sm text-gray-500 mb-4">
        Enter your email and password to login to your account
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example@mail.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              required
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Link href="/auth/forgot">
            <span className="text-sm text-blue-500 hover:underline cursor-pointer">Forgot password?</span>
          </Link>
        </div>
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition font-semibold"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        Don't have an account?
        <Link href="/auth/signup">
          <span className="text-blue-500 hover:underline ml-1 cursor-pointer">Sign up</span>
        </Link>
      </div>
    </div>
  );
}

SignIn.getLayout = function getLayout(page) {
  return <AuthLayout title="Sign In - Guestify">{page}</AuthLayout>;
};