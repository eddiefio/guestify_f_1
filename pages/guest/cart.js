// pages/guest/cart.js - Versione aggiornata per passare parametri aggiuntivi
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import GuestLayout from '../../components/layout/GuestLayout';
import { useCart } from '../../contexts/CartContext';

export default function Cart() {
  const { cart, propertyId, updateCartItem, removeFromCart, getCartTotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [editingInputs, setEditingInputs] = useState({});
  const [tempInputValues, setTempInputValues] = useState({});

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }
    
    if (!propertyId) {
      setError('Missing property ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const cartItems = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name
      }));

      console.log('Sending cart to checkout:', { propertyId, cart: cartItems });

      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          cart: cartItems
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Checkout failed');
      }
      
      const data = await response.json();
      console.log('Checkout response:', data);
      
      if (!data.orderId) {
        throw new Error('Invalid checkout response: missing orderId');
      }
      
      // Calculate subtotal, service fee, and total
      const subtotal = getCartTotal();
      const serviceFee = subtotal * 0.15;
      const finalPrice = subtotal + serviceFee;
      
      // Redirect to payment page with additional parameters
      router.push(`/guest/payment/${data.orderId}?amount=${finalPrice}&propertyId=${propertyId}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to process checkout. Please try again.');
      setLoading(false);
    }
  };

  // Calculate subtotal, service fee, and total
  const subtotal = getCartTotal();
  const serviceFee = subtotal * 0.15;
  const total = subtotal + serviceFee;

  return (
    <div>
      {/* Back to menu button */}
      {propertyId && (
        <div className="bg-white p-2 rounded-xl mb-4 inline-block">
          <Link href={`/guest/menu/${propertyId}`}>
            <span className="text-sm text-[#5e2bff] font-semibold underline cursor-pointer">
              Back to Menu
            </span>
          </Link>
        </div>
      )}
      
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Your Cart</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto w-full">
        {cart && cart.length > 0 ? (
          <>
            <table className="table-auto w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Product</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Price</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Quantity</th>
                  <th className="px-2 py-2 w-10"></th>
                  <th className="px-2 py-2 text-left font-medium text-gray-700">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cart.map((item) => {
                  const itemSubtotal = item.price * item.quantity;
                  const itemKey = `${item.propertyId}-${item.productId}`;
                  
                  return (
                    <tr key={itemKey}>
                      <td className="px-2 py-2">{item.name}</td>
                      <td className="px-2 py-2">€{item.price.toFixed(2)}</td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          className="w-16 border rounded px-2 py-1 text-sm"
                          value={
                            editingInputs[itemKey]
                              ? tempInputValues[itemKey]
                              : item.quantity
                          }
                          onFocus={(e) => {
                            setEditingInputs(prev => ({
                              ...prev,
                              [itemKey]: true
                            }));
                            setTempInputValues(prev => ({
                              ...prev,
                              [itemKey]: e.target.value
                            }));
                          }}
                          onChange={(e) => {
                            setTempInputValues(prev => ({
                              ...prev,
                              [itemKey]: e.target.value
                            }));
                          }}
                          onBlur={(e) => {
                            let newQty = parseInt(e.target.value, 10);
                            
                            if (isNaN(newQty) || newQty < 1) {
                              newQty = 1;
                            }
                            
                            const maxQty = item.maxQuantity || 99;
                            newQty = Math.min(newQty, maxQty);
                            
                            if (newQty > maxQty) {
                              setError(`Only ${maxQty} units of "${item.name}" available.`);
                              setTimeout(() => setError(null), 3000);
                            }
                            
                            updateCartItem(item.productId, item.propertyId, newQty);
                            
                            setEditingInputs(prev => ({
                              ...prev,
                              [itemKey]: false
                            }));
                          }}
                          min="1"
                          max={item.maxQuantity || 99}
                        />
                        {item.maxQuantity && (
                          <div className="text-xs text-gray-500 mt-1">
                            Max: {item.maxQuantity}
                          </div>
                        )}
                      </td>
                      {/* Trash column */}
                      <td className="px-2 py-2 text-center w-10">
                        <button 
                          onClick={() => removeFromCart(item.productId, item.propertyId)} 
                          className="text-red-500 hover:text-red-700" 
                          title="Remove"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                      {/* Subtotal column */}
                      <td className="px-2 py-2 text-right">€{itemSubtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-white">
                {/* Subtotal row */}
                <tr>
                  <td colSpan="4"></td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    Subtotal: €{subtotal.toFixed(2)}
                  </td>
                </tr>
                {/* Service Fee row */}
                <tr>
                  <td colSpan="4"></td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    Service Fee: €{serviceFee.toFixed(2)}
                  </td>
                </tr>
                {/* Total row */}
                <tr>
                  <td colSpan="4"></td>
                  <td className="px-2 py-2 text-right font-bold text-gray-700">
                    Total: €{total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                className={`${
                  loading || cart.length === 0 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-[#fad02f] hover:bg-[#fad02f]/90'
                } text-black px-3 py-1 rounded-full text-sm transition font-semibold`}
              >
                {loading ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </>
        ) : (
          <div>
            <p className="text-gray-500 mb-4">Your cart is empty.</p>
            {propertyId && (
              <div className="bg-white p-2 rounded-xl inline-block">
                <Link href={`/guest/menu/${propertyId}`}>
                  <span className="text-sm text-[#5e2bff] font-semibold underline cursor-pointer">
                    Back to Menu
                  </span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

Cart.getLayout = function getLayout(page) {
  return <GuestLayout title="Your Cart - Guestify">{page}</GuestLayout>;
};