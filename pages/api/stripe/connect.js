// pages/api/stripe/connect.js
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndiqnzxplopcbcxzondp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXFuenhwbG9wY2JjeHpvbmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDkxODQsImV4cCI6MjA1NTEyNTE4NH0.jCnn7TFfGV1EpBHhO1ITa8PMytD7UJfADpuzrzZOgpw';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

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

    // Initialize Stripe with your secret key
    if (!STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe secret key not configured' });
    }
    
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    // Get user's email for Stripe
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user.id);
    
    if (userError) {
      console.error('Error fetching user details:', userError);
      return res.status(500).json({ error: 'Failed to fetch user details' });
    }

    const userEmail = userData?.user?.email || req.body.userEmail;
    if (!userEmail) {
      return res.status(400).json({ error: 'User email not found' });
    }

    // Create a Stripe account for the user
    const account = await stripe.accounts.create({
      type: 'express',
      email: userEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log('Created Stripe account:', account.id);
    
    // Store the Stripe account ID in the user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_account_id: account.id })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Error updating user profile with Stripe ID:', updateError);
      // Continue anyway as we'll update it in the redirect
    }

    // Create an account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (req.headers.origin || 'http://localhost:3000');
    
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/host/stripe-redirect?error=true&account_id=${account.id}`,
      return_url: `${baseUrl}/host/stripe-redirect?success=true&account_id=${account.id}`,
      type: 'account_onboarding',
    });
    
    console.log('Created Stripe account link');
    return res.status(200).json({ url: accountLink.url });
    
  } catch (error) {
    console.error('Error in Stripe connect handler:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}