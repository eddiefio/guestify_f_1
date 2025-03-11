// pages/auth/check-session.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function CheckSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    }
    
    checkSession();
  }, []);
  
  if (loading) return <div>Checking session...</div>;
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Session Check</h1>
      {session ? (
        <div>
          <p style={{ color: 'green' }}>✓ Logged in</p>
          <p>User ID: {session.user.id}</p>
          <p>Email: {session.user.email}</p>
        </div>
      ) : (
        <p style={{ color: 'red' }}>✗ Not logged in</p>
      )}
    </div>
  );
}