import Stripe from 'stripe';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Crea un client server-side di Supabase
    const supabase = createServerSupabaseClient({ req, res });
    
    // Verifica la sessione (questo legge dai cookie)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = session.user;
    const { userId } = req.body;

    if (userId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Controlla se l'utente ha già un account Stripe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error(profileError.message);
    }

    let stripeAccountId = profile?.stripe_account_id;

    // Se non esiste un account Stripe, creane uno nuovo
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
      });

      stripeAccountId = account.id;

      // Aggiorna il profilo con l'ID dell'account Stripe
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', userId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    // Crea un link di onboarding
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/host/connect-stripe`,
      return_url: `${baseUrl}/host/dashboard`,
      type: 'account_onboarding',
    });

    // Restituisci l'URL per il redirect
    return res.status(200).json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error('Error in Stripe connect:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}