import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, amount, propertyId } = req.body;

    if (!orderId || !amount || !propertyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Crea il payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Converti in centesimi
      currency: 'eur',
      metadata: {
        orderId,
        propertyId
      }
    });

    // Aggiorna l'ordine con il payment intent ID
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return res.status(500).json({ error: 'Failed to update order' });
    }

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      error: 'Error creating payment intent',
      details: error.message
    });
  }
}