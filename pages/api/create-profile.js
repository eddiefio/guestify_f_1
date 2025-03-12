// This requires the SUPABASE_SERVICE_ROLE_KEY environmental variable to be set
// in your deployment environment (Vercel, etc.)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, name, country, email } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Create Supabase client with service role key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // This key has admin privileges
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  try {
    // Insert profile directly with admin privileges
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert([
        {
          id,
          name,
          country,
          email
        }
      ], { onConflict: 'id' });
      
    if (error) throw error;
    
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error creating profile:', error);
    return res.status(500).json({ error: error.message });
  }
}