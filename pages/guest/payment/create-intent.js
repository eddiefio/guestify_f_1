// pages/api/payment/create-intent.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  runtime: 'experimental-edge',
}

export default async function CreateIntent(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405 }
    );
  }

  const { orderId, amount, propertyId } = await req.json();

  if (!orderId || !amount || !propertyId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }), 
      { status: 400 }
    );
  }

  try {
    // Get property details
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('apartments')
      .select('host_id')
      .eq('id', propertyId)
      .single();

    if (propertyError) throw propertyError;

    // Get host's Stripe account ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', property.host_id)
      .single();

    if (profileError) throw profileError;
    if (!profile.stripe_account_id) {
      throw new Error('Host has not connected their Stripe account');
    }

    // Calculate application fee (15%)
    const feeAmount = Math.round(parseFloat(amount) * 100 * 0.15);
    
    // Create a payment intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: 'eur',
      application_fee_amount: feeAmount,
      transfer_data: {
        destination: profile.stripe_account_id,
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }), 
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}