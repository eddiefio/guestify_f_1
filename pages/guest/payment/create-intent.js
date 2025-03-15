// pages/api/payment/create-intent.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  runtime: 'edge',
}

export default function CreateIntent() {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, amount, propertyId } = req.body;

  if (!orderId || !amount || !propertyId) {
    return res.status(400).json({ error: 'Missing required fields' });
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
      throw new Error('Host does not have a connected Stripe account');
    }

    // Calculate the application fee amount (15%)
    const feeAmount = Math.round(parseFloat(amount) * 100 * 0.15);
    
    // Create a payment intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: 'eur',
      application_fee_amount: feeAmount,
      transfer_data: {
        destination: profile.stripe_account_id,
      },
      metadata: {
        orderId,
        propertyId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return the client secret
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({ error: error.message || 'Error creating payment intent' });
  }
}