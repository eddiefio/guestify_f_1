// pages/auth/signup.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
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
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setMessage('');

    if (!terms) {
      setError('You must accept the Terms and Conditions');
      setLoading(false);
      return;
    }

    try {
      // First create the user in supabase auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, country }
        }
      });
      
      if (authError) {
        if (authError.message.toLowerCase().includes('duplicate') || 
            authError.message.toLowerCase().includes('already')) {
          throw new Error('User already exists');
        }
        throw authError;
      }
      
      // If email confirmation is required, show a message
      if (data?.user && !data?.session) {
        console.log('Email confirmation required');
        setSuccess(true);
        setMessage("Please check your email for a confirmation link before logging in.");
        setLoading(false);
        return;
      }
      
      // If we got a session (email confirmation not required), create profile
      if (data?.user) {
        console.log('User created successfully:', data.user.id);
        
        try {
          // Create profile manually
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              name: name,
              country: country
            }]);
            
          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Continue anyway - the user was created
          }
        } catch (profileErr) {
          console.error('Exception during profile creation:', profileErr);
          // Continue anyway
        }
        
        // Redirect to connect stripe page
        router.push('/host/connect-stripe');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.message || 'Failed to sign up');
      setLoading(false);
    }
  };

  // If showing success message, display a different UI
  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
        <div className="text-center">
          <i className="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
          <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link href="/auth/signin">
            <span className="bg-[#5e2bff] text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition cursor-pointer">
              Return to Sign In
            </span>
          </Link>
        </div>
      </div>
    );
  }

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