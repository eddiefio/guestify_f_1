import { useState } from 'react';
import Link from 'next/link';

export default function DebugSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Test User');
  const [country, setCountry] = useState('USA');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/debug-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, country })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error occurred');
      }
      
      setResult(data);
    } catch (error) {
      console.error('Debug test error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow-md mt-10">
      <h1 className="text-xl font-bold mb-4">Supabase Debug Tester</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          <p><strong>Success:</strong> {result.message}</p>
          <pre className="mt-2 text-xs bg-black text-white p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <form onSubmit={handleTest} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Test Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="test@example.com"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Test Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="password"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded font-medium"
        >
          {loading ? 'Testing...' : 'Run Basic Auth Test'}
        </button>
      </form>
      
      <div className="mt-6 border-t pt-4">
        <h2 className="font-medium mb-2">Next steps if this fails:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Check Supabase Database Settings</li>
          <li>Verify your env variables are correct</li>
          <li>Consider creating a new Supabase project</li>
        </ol>
      </div>
    </div>
  );
}