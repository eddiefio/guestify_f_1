import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async function handler(req, res) {
  // Solo richieste POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Crea un client Supabase che utilizzerà i cookie per l'autenticazione
    const supabase = createServerSupabaseClient({ req, res });
    
    // Ottieni la sessione attuale
    const { data: { session } } = await supabase.auth.getSession();
    
    // Verifica che l'utente sia autenticato
    if (!session) {
      console.error('No session found');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = session.user;
    console.log('Authenticated user:', user.id, user.email);

    // Verifica che l'ID utente nella richiesta corrisponda all'utente autenticato
    const { userId } = req.body;
    if (userId && userId !== user.id) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }

    // Controlla se l'utente ha già un account Stripe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      throw new Error(profileError.message);
    }

    let stripeAccountId = profile?.stripe_account_id;
    console.log('Existing Stripe account ID:', stripeAccountId);

    // Se non esiste, crea un nuovo account Stripe
    if (!stripeAccountId) {
      console.log('Creating new Stripe account for:', user.email);
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
      });

      stripeAccountId = account.id;
      console.log('Created Stripe account:', stripeAccountId);

      // Aggiorna il profilo con l'ID dell'account Stripe
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error(updateError.message);
      }
    }

    // Crea un link per l'onboarding
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('Creating account link with base URL:', baseUrl);
    
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/host/connect-stripe`,
      return_url: `${baseUrl}/host/dashboard`,
      type: 'account_onboarding',
    });

    console.log('Created account link, returning URL');
    // Restituisci l'URL per il redirect
    return res.status(200).json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error('Error in Stripe connect:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}