// pages/api/stripe/connect.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'your_test_key_here');

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndiqnzxplopcbcxzondp.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXFuenhwbG9wY2JjeHpvbmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDkxODQsImV4cCI6MjA1NTEyNTE4NH0.jCnn7TFfGV1EpBHhO1ITa8PMytD7UJfADpuzrzZOgpw'
  );

  // Get the token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split('Bearer ')[1] : null;
  
  if (!token) {
    console.error('No token provided in request');
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  try {
    // Set the session with the token
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User error:', userError);
      return res.status(401).json({ error: 'User not found with provided token' });
    }

    // Process request
    const { userId } = req.body;

    if (userId !== user.id) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }

    // Resto del codice rimane uguale
    // Check if user already has a Stripe account in Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error(profileError.message);
    }

    let stripeAccountId = profile?.stripe_account_id;

    // If no Stripe account exists, create one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
      });

      stripeAccountId = account.id;

      // Update the user's profile with the Stripe account ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', userId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/host/connect-stripe`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/host/dashboard`,
      type: 'account_onboarding',
    });

    // Return the URL to redirect to
    return res.status(200).json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error('Error in Stripe connect:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}