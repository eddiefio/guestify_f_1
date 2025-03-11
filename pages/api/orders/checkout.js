// pages/api/orders/checkout.js
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { propertyId, cart } = req.body;

  if (!propertyId || !cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // Calculate subtotal and service fee
    let subtotal = 0;
    for (const item of cart) {
      subtotal += item.price * item.quantity;
    }
    const serviceFee = subtotal * 0.15;
    const finalPrice = subtotal + serviceFee;

    // Create new order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{ 
        apartment_id: propertyId, 
        total_price: finalPrice,
        order_date: new Date().toISOString() 
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    const orderId = newOrder.id;

    // Process each cart item
    for (const item of cart) {
      // Insert order items
      const { error: itemError } = await supabase
        .from('order_items')
        .insert([{
          order_id: orderId,
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price
        }]);

      if (itemError) {
        console.error('Order item insertion error:', itemError);
        return res.status(500).json({ error: 'Failed to create order items' });
      }

      // Update inventory quantity
      const { data: inventoryItem, error: inventoryFetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('apartment_id', propertyId)
        .eq('product_id', item.productId)
        .single();

      if (inventoryFetchError) {
        console.error('Inventory fetch error:', inventoryFetchError);
        return res.status(500).json({ error: 'Failed to update inventory' });
      }

      if (!inventoryItem) {
        return res.status(404).json({ error: `Product not found in inventory` });
      }

      const newQuantity = inventoryItem.quantity - item.quantity;
      
      if (newQuantity < 0) {
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
      }

      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', inventoryItem.id);

      if (updateError) {
        console.error('Inventory update error:', updateError);
        return res.status(500).json({ error: 'Failed to update inventory' });
      }
    }

    // Return success with order ID
    return res.status(200).json({
      success: true,
      orderId,
      subtotal,
      serviceFee,
      finalPrice
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}