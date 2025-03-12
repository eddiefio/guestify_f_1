// pages/api/stripe/get-account.js
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    console.log('Getting Stripe account for user:', userId);

    // Initialize Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: 'Stripe secret key not configured' });
    }
    
    const stripe = new Stripe(stripeKey);

    // First check if user already has a stripe_account_id in their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // If user already has a Stripe account ID, return it
    if (profile && profile.stripe_account_id) {
      console.log('User already has Stripe account ID:', profile.stripe_account_id);
      return res.status(200).json({ stripeAccountId: profile.stripe_account_id });
    }

    // Check if there's an account in the temporary storage
    // In a real app, you might store this mapping in a database table
    const tempStripeAccount = global.tempStripeAccounts?.[userId];
    if (tempStripeAccount) {
      console.log('Found temporary Stripe account ID:', tempStripeAccount);
      return res.status(200).json({ stripeAccountId: tempStripeAccount });
    }

    // If we don't have an account ID yet, create a new Stripe account
    // First get the user's email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({ error: 'Failed to fetch user details' });
    }

    const userEmail = userData?.user?.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'User email not found' });
    }

    // Create a new Stripe account
    const account = await stripe.accounts.create({
      type: 'express',
      email: userEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log('Created new Stripe account:', account.id);

    // Store the Stripe account ID in a temporary global variable (this would be better in a database)
    global.tempStripeAccounts = global.tempStripeAccounts || {};
    global.tempStripeAccounts[userId] = account.id;

    // Return the Stripe account ID
    return res.status(200).json({ stripeAccountId: account.id });
  } catch (error) {
    console.error('Error in get-account handler:', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve Stripe account' });
  }
}