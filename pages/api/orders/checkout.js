// pages/api/orders/checkout.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cart, propertyId } = req.body;
  
  console.log('Received checkout request:', {
    propertyId,
    cartItems: cart
  });

  if (!propertyId || !cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // Calculate subtotal and service fee
    let subtotal = 0;
    for (const item of cart) {
      subtotal += item.price * item.quantity;
    }
    const serviceFee = subtotal * 0.12; // 12% service fee
    const finalPrice = subtotal + serviceFee;

    // Create new order using admin client
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        apartment_id: propertyId,
        total_price: finalPrice,
        order_date: new Date().toISOString(),
        payment_status: 'pending'  // Corretto da 'status' a 'payment_status'
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

    // Prima di processare il carrello, verifica che i dati siano corretti
    console.log('Cart items:', cart); // Aggiungi questo log per debug

    // Process each cart item
    for (const item of cart) {
      // Verifica che product_id sia presente e valido
      if (!item.productId) {
        console.error('Invalid product ID for item:', item);
        return res.status(400).json({ 
          error: 'Invalid product ID',
          item: item 
        });
      }

      // Verify inventory using admin client
      const { data: inventoryItem, error: inventoryFetchError } = await supabaseAdmin
        .from('inventory')
        .select('quantity')
        .eq('apartment_id', propertyId)
        .eq('product_id', item.productId)
        .single();

      if (inventoryFetchError || !inventoryItem) {
        console.error('Inventory fetch error:', inventoryFetchError);
        return res.status(400).json({ 
          error: 'Product not available',
          productId: item.productId 
        });
      }

      if (inventoryItem.quantity < item.quantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock',
          product: item.name,
          available: inventoryItem.quantity 
        });
      }

      // Insert order item using admin client
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

      // Update inventory using admin client
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