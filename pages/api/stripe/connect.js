// pages/api/stripe/connect.js - Simplified version
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndiqnzxplopcbcxzondp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXFuenhwbG9wY2JjeHpvbmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDkxODQsImV4cCI6MjA1NTEyNTE4NH0.jCnn7TFfGV1EpBHhO1ITa8PMytD7UJfADpuzrzZOgpw';

// Helper function to get a cookie value
const getCookie = (cookies, name) => {
  if (!cookies) return null;
  const match = cookies.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Processing Stripe connect request');

  try {
    // Get cookies from the request
    const cookies = req.headers.cookie;
    console.log('Request cookies:', cookies ? 'Present' : 'None');

    // Get the token from cookies
    const token = getCookie(cookies, 'supabase-access-token');
    console.log('Token from cookie:', token ? 'Present' : 'None');

    let user;
    if (token) {
      try {
        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        const { data, error } = await supabase.auth.getUser(token);
        if (error) {
          console.error('Error getting user from token:', error);
          return res.status(401).json({ error: 'Invalid token' });
        }
        user = data.user;
      } catch (error) {
        console.error('Exception getting user from token:', error);
        return res.status(401).json({ error: 'Authentication error' });
      }
    } else {
      // Use userId from request body
      if (req.body.userId) {
        user = { id: req.body.userId };
        console.log('Using user ID from request body:', user.id);
      } else {
        console.error('No user information available');
        return res.status(401).json({ error: 'User ID is required' });
      }
    }

    // For this simplified version, we're skipping actual Stripe API calls
    // In a real implementation, you would create a Stripe account here
    
    // Create the account link with the appropriate return URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (req.headers.origin || 'http://localhost:3000');
                   
    // In a real implementation, this would redirect to Stripe
    // For now, we'll redirect directly to our own stripe-redirect page
    const redirectUrl = `${baseUrl}/host/stripe-redirect`;
    
    console.log('Created Stripe redirect URL:', redirectUrl);
    return res.status(200).json({ url: redirectUrl });
    
  } catch (error) {
    console.error('Error in Stripe connect handler:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}