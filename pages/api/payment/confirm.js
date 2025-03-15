// pages/api/payment/confirm.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, paymentIntentId } = req.body;

  if (!orderId || !paymentIntentId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Update order with payment information
    const { error } = await supabaseAdmin
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
    console.error('Error updating order payment status:', error);
    return res.status(500).json({ error: error.message });
  }
}