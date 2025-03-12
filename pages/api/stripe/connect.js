// pages/api/stripe/connect.js - Versione basata sui cookie
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndiqnzxplopcbcxzondp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXFuenhwbG9wY2JjeHpvbmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDkxODQsImV4cCI6MjA1NTEyNTE4NH0.jCnn7TFfGV1EpBHhO1ITa8PMytD7UJfADpuzrzZOgpw';
const stripeKey = process.env.STRIPE_SECRET_KEY;

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

    if (!token) {
      // Fallback to body/query parameters if provided
      console.log('No token in cookies, checking request body');
      if (req.body.accessToken) {
        console.log('Using token from request body');
      } else {
        console.log('No authentication token available');
        return res.status(401).json({ error: 'Not authenticated' });
      }
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Try to get user info from token if available
    let user;
    if (token) {
      try {
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
      // Try to use the user info from the request body as fallback
      const userJson = getCookie(cookies, 'supabase-user');
      if (userJson) {
        try {
          user = JSON.parse(userJson);
          console.log('Using user info from cookie');
        } catch (e) {
          console.error('Error parsing user cookie:', e);
        }
      }

      // Last resort: use userId from request body
      if (!user && req.body.userId) {
        // Try to get user info from database
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', req.body.userId)
          .single();

        if (error || !data) {
          console.error('Error getting user profile:', error);
          return res.status(401).json({ error: 'User not found' });
        }

        // Create minimal user object
        user = {
          id: req.body.userId,
          email: req.body.userEmail || data.email || 'unknown@example.com'
        };
        console.log('Using user info from request body');
      }
    }

    if (!user) {
      console.error('No user information available');
      return res.status(401).json({ error: 'Cannot identify user' });
    }

    console.log('User authenticated:', user.id);

    // Initialize Stripe
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Stripe not configured' });
    }
    const stripe = new Stripe(stripeKey);

    // Check if user already has a Stripe account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    let stripeAccountId = profile?.stripe_account_id;
    console.log('Existing Stripe account ID:', stripeAccountId);

    // Create Stripe account if needed
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
      });

      stripeAccountId = account.id;
      console.log('Created new Stripe account:', stripeAccountId);

      // Update profile with Stripe account ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }
    }

    // Create an account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (req.headers.origin || 'http://localhost:3000');
    console.log('Base URL for redirect:', baseUrl);
    
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/host/connect-stripe`,
      return_url: `${baseUrl}/host/dashboard`,
      type: 'account_onboarding',
    });

    console.log('Created Stripe onboarding link');
    return res.status(200).json({ url: accountLink.url });
    
  } catch (error) {
    console.error('Error in Stripe connect handler:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}