// pages/api/stripe/direct-connect.js
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Usa l'ID utente direttamente dal corpo della richiesta
    const { userId, userEmail } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    console.log('Processing direct connect for user:', userId);

    // Verifica se l'utente esiste
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    let stripeAccountId = profile?.stripe_account_id;

    // Se non esiste ancora un account Stripe, creane uno nuovo
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: userEmail,
      });

      stripeAccountId = account.id;

      // Aggiorna il profilo con l'ID dell'account Stripe
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }
    }

    // Crea un link per l'onboarding
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (req.headers.origin || 'http://localhost:3000');
    
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/host/connect-stripe`,
      return_url: `${baseUrl}/host/dashboard`,
      type: 'account_onboarding',
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error('Error in direct Stripe connect:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}