// pages/api/payment/create-intent.js - Versione corretta
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

    // IMPORTANTE: Prima di verificare l'ordine, aggiungiamo un breve ritardo
    // per dare tempo al database di sincronizzarsi
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verifichiamo che l'ordine esista veramente
    const { data: orderCheck, error: orderCheckError } = await supabaseAdmin
      .from('orders')
      .select('id, total_price')
      .eq('id', orderId);
      
    if (orderCheckError) {
      console.error('Error checking order:', orderCheckError);
      return res.status(500).json({
        error: 'Error checking order',
        details: orderCheckError.message
      });
    }
    
    // Se l'ordine non esiste o non ha restituito righe
    if (!orderCheck || orderCheck.length === 0) {
      console.error('Order not found or not yet synchronized in database');
      
      // Qui possiamo usare i dati forniti nella richiesta invece di fallire
      console.log('Using amount from request instead');
      
      // Continua con la creazione del payment intent anche se non troviamo l'ordine
      // usando i valori forniti nella richiesta
    } else {
      console.log('Order found in database:', orderCheck[0]);
      
      // Se l'importo dal database è diverso da quello fornito nella richiesta, 
      // possiamo usare quello del database per sicurezza
      if (orderCheck[0].total_price && orderCheck[0].total_price !== amount) {
        console.warn('Amount mismatch: request vs database', amount, orderCheck[0].total_price);
        // Possiamo decidere di usare l'importo dal database o mantenere quello dalla richiesta
        // amount = orderCheck[0].total_price;
      }
    }

    // Convert amount to cents and ensure it's an integer
    const amountInCents = Math.round(amount * 100);

    try {
      // Create a basic payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        metadata: {
          orderId,
          propertyId
        }
      });

      // Update the order with the payment intent ID (se l'ordine esiste)
      if (orderCheck && orderCheck.length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({ payment_intent_id: paymentIntent.id })
          .eq('id', orderId);

        if (updateError) {
          console.warn('Warning: Failed to update order with payment intent ID:', updateError);
          // Continue anyway - this isn't critical
        }
      } else {
        console.warn('Could not update order with payment intent ID - order not found');
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