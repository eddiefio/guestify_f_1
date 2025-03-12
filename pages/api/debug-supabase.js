import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, country } = req.body;
  
  // Create standard Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // Step 1: Try to directly check if profiles table exists and has expected schema
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (tableError) {
      return res.status(500).json({ 
        phase: 'table_check', 
        error: tableError.message,
        details: tableError
      });
    }
    
    // Step 2: Try to create user without any profile data
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (authError) {
      return res.status(500).json({ 
        phase: 'auth_signup', 
        error: authError.message,
        details: authError
      });
    }
    
    // If we get here, the user was created successfully
    return res.status(200).json({
      success: true,
      user: authData.user,
      message: 'Basic user created successfully. Try logging in now.'
    });
  } catch (error) {
    console.error('Unhandled error in debug endpoint:', error);
    return res.status(500).json({ 
      phase: 'unhandled_exception',
      error: error.message,
      stack: error.stack
    });
  }
}