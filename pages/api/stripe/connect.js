// pages/api/stripe/connect.js
import Stripe from 'stripe';
import { createServerClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create Supabase server client
  const cookieStore = cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
    },
  }
);

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { userId } = req.body;

    if (userId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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
        email: session.user.email,
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