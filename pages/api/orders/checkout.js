// Fix for pages/api/orders/checkout.js

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

    // Validate all items before creating the order
    for (const item of cart) {
      // Check inventory availability first
      const { data: inventoryItem, error: inventoryFetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('apartment_id', propertyId)
        .eq('product_id', item.productId)
        .single();

      if (inventoryFetchError) {
        console.error('Inventory fetch error:', inventoryFetchError);
        return res.status(500).json({ error: 'Failed to verify inventory: ' + inventoryFetchError.message });
      }

      if (!inventoryItem) {
        return res.status(404).json({ error: `Product ID ${item.productId} not found in inventory` });
      }

      // Verify sufficient stock
      if (inventoryItem.quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for product "${item.name || 'Unknown'}". Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`
        });
      }
    }

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
      return res.status(500).json({ error: 'Failed to create order: ' + orderError.message });
    }

    const orderId = newOrder.id;

    // Process each cart item
    for (const item of cart) {
      try {
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
          throw new Error('Order item insertion error: ' + itemError.message);
        }

        // Get current inventory again to ensure it hasn't changed
        const { data: inventoryItem, error: inventoryFetchError } = await supabase
          .from('inventory')
          .select('*')
          .eq('apartment_id', propertyId)
          .eq('product_id', item.productId)
          .single();

        if (inventoryFetchError || !inventoryItem) {
          throw new Error('Inventory fetch error: ' + (inventoryFetchError?.message || 'Product not found'));
        }

        const newQuantity = inventoryItem.quantity - item.quantity;
        
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', inventoryItem.id);

        if (updateError) {
          throw new Error('Inventory update error: ' + updateError.message);
        }
      } catch (itemProcessError) {
        // If there's an error processing an item, we should roll back the order
        console.error('Error processing item:', itemProcessError);
        
        // Try to delete the order we just created
        await supabase
          .from('orders')
          .delete()
          .eq('id', orderId)
          .then(() => console.log('Order rolled back successfully'))
          .catch(e => console.error('Failed to roll back order:', e));
          
        return res.status(500).json({ 
          error: 'Failed to process order items: ' + itemProcessError.message 
        });
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
    return res.status(500).json({ error: 'An unexpected error occurred: ' + error.message });
  }
}