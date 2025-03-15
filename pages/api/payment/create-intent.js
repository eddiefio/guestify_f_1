// pages/api/payment/create-intent.js - Updated version
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe and Supabase
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

    console.log('Creating payment intent with:', { orderId, amount, propertyId });

    // Validate input
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Convert amount to cents and ensure it's an integer
    const amountInCents = Math.round(amount * 100);

    try {
      // Create a basic payment intent without Connect integration first
      // This is a fallback in case there are issues with the host's Stripe account
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        metadata: {
          orderId,
          propertyId
        }
      });

      // Update the order with the payment intent ID
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ payment_intent_id: paymentIntent.id })
        .eq('id', orderId);

      if (updateError) {
        console.warn('Warning: Failed to update order with payment intent ID:', updateError);
        // Continue anyway - this isn't critical
      }

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (stripeError) {
      console.error('Error creating Stripe payment intent:', stripeError);
      return res.status(500).json({
        error: 'Error creating payment intent',
        details: stripeError.message
      });
    }
  } catch (error) {
    console.error('Error in create-intent API:', error);
    return res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
}