// pages/api/orders/checkout.js - Updated version
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cart, propertyId } = req.body;

    console.log('Processing checkout:', { propertyId, cart }); // Debug log

    // Validate required data
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty' });
    }

    // Verify that all cart items have a productId
    if (!cart.every(item => item.productId)) {
      return res.status(400).json({
        error: 'Invalid cart data: missing productId',
        cart: cart
      });
    }

    // Check inventory for each product
    for (const item of cart) {
      const { data: inventoryItem, error: inventoryError } = await supabaseAdmin
        .from('inventory')
        .select('quantity')
        .eq('apartment_id', propertyId)
        .eq('product_id', item.productId)
        .single();

      if (inventoryError || !inventoryItem) {
        console.error('Inventory check failed:', { item, error: inventoryError });
        return res.status(400).json({
          error: 'Product not available',
          productId: item.productId
        });
      }

      if (inventoryItem.quantity < item.quantity) {
        return res.status(400).json({
          error: 'Insufficient inventory',
          productId: item.productId,
          requested: item.quantity,
          available: inventoryItem.quantity
        });
      }
    }

    // Calculate subtotal and service fee
    let subtotal = 0;
    for (const item of cart) {
      subtotal += item.price * item.quantity;
    }
    const serviceFee = subtotal * 0.15; // 15% service fee
    const finalPrice = subtotal + serviceFee;

    // Create new order
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        apartment_id: propertyId,
        total_price: finalPrice,
        order_date: new Date().toISOString(),
        payment_status: 'pending'
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({ 
        error: 'Failed to create order',
        details: orderError.message 
      });
    }

    const orderId = newOrder.id;

    // Process each cart item
    for (const item of cart) {
      // Verify that product_id is present and valid
      if (!item.productId) {
        console.error('Invalid product ID for item:', item);
        return res.status(400).json({ 
          error: 'Invalid product ID',
          item: item 
        });
      }

      // Insert order item
      const { error: itemError } = await supabaseAdmin
        .from('order_items')
        .insert([{
          order_id: orderId,
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price
        }]);

      if (itemError) {
        console.error('Order item insertion error:', itemError);
        return res.status(500).json({ 
          error: 'Failed to create order items',
          details: itemError.message 
        });
      }

      // Update inventory
      const { error: updateError } = await supabaseAdmin
        .from('inventory')
        .update({ 
          quantity: inventoryItem.quantity - item.quantity 
        })
        .eq('apartment_id', propertyId)
        .eq('product_id', item.productId);

      if (updateError) {
        console.error('Inventory update error:', updateError);
        return res.status(500).json({ 
          error: 'Failed to update inventory',
          details: updateError.message 
        });
      }
    }

    // Return success with order details
    return res.status(200).json({
      success: true,
      orderId,
      subtotal,
      serviceFee,
      finalPrice
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred',
      details: error.message 
    });
  }
}