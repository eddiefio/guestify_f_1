// pages/auth/signup.js - Simplified version
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthLayout from '../../components/layout/AuthLayout';
import { CountrySelect } from '../../components/layout/CountrySelect';
import { supabase } from '../../lib/supabase';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!terms) {
      setError('You must accept the Terms and Conditions');
      setLoading(false);
      return;
    }

    try {
      // Simple signup with minimal options
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      // Show success message
      setSuccess(true);
      
      // Auto-redirect after a delay if session exists
      if (data?.session) {
        setTimeout(() => {
          router.push('/host/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  // Success state UI
  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10 text-center">
        <i className="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
        <h2 className="text-2xl font-bold mb-4">Account Created!</h2>
        <p className="mb-6">
          Your account has been created successfully. You may need to verify your email before signing in.
        </p>
        <Link href="/auth/signin">
          <span className="bg-black text-white py-2 px-6 rounded hover:bg-gray-800 transition font-semibold cursor-pointer">
            Go to Sign In
          </span>
        </Link>
      </div>
    );
  }

  // Form UI - rest of your component code...
  // (Keep your existing UI code here)
}

SignUp.getLayout = function getLayout(page) {
  return <AuthLayout title="Sign Up - Guestify">{page}</AuthLayout>;
};
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
      <h2 className="text-2xl font-bold mb-2">Create an account</h2>
      <p className="text-sm text-gray-500 mb-4">
        Enter your details to create your account
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="m@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <CountrySelect
            id="country"
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="inline-flex items-center">
            <input 
              type="checkbox" 
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="form-checkbox text-blue-500" 
              required 
            />
            <span className="ml-2 text-sm text-gray-700">
              I have read and accept the <a href="https://youtu.be/Eye_gEqmL4s?si=w-6802B9-CxidUl7" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Terms and Conditions</a>.
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition font-semibold"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        Already have an account?
        <Link href="/auth/signin">
          <span className="text-blue-500 hover:underline ml-1 cursor-pointer">Sign in</span>
        </Link>
      </div>
    </div>
  );
}

SignUp.getLayout = function getLayout(page) {
  return <AuthLayout title="Sign Up - Guestify">{page}</AuthLayout>;
};