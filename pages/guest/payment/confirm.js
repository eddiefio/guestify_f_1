// pages/api/payment/confirm.js
import { supabase } from '../../../lib/supabase';

export const config = {
  runtime: 'edge',
}

export default function Confirm() {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, paymentIntentId } = req.body;

  if (!orderId || !paymentIntentId) {
    return res.status(400).json({ error: 'Missing required fields' });
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ error: error.message || 'Error confirming payment' });
  }
}