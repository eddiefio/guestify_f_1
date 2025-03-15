// pages/api/payment/confirm.js
import { supabase } from '../../../lib/supabase';

export const config = {
  runtime: 'experimental-edge',
}

export default async function Confirm(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405 }
    );
  }

  const { orderId, paymentIntentId } = await req.json();

  if (!orderId || !paymentIntentId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }), 
      { status: 400 }
    );
  }

  try {
    // Update order with payment information
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        payment_intent_id: paymentIntentId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }), 
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}