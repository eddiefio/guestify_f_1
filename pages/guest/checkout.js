// pages/guest/checkout.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import GuestLayout from '../../components/layout/GuestLayout';
import { useCart } from '../../contexts/CartContext';

export default function Checkout() {
  const [orderDetails, setOrderDetails] = useState({
    orderId: '',
    subtotal: 0,
    serviceFee: 0,
    finalPrice: 0
  });
  const { clearCart, propertyId } = useCart();
  const router = useRouter();

  useEffect(() => {
    // Get order details from URL parameters
    const { orderId, subtotal, serviceFee, finalPrice } = router.query;
    
    if (orderId) {
      setOrderDetails({
        orderId,
        subtotal: parseFloat(subtotal || 0),
        serviceFee: parseFloat(serviceFee || 0),
        finalPrice: parseFloat(finalPrice || 0)
      });
      
      // Clear the cart after successful checkout
      clearCart();
    } else if (!router.query.orderId && router.isReady) {
      // If no order ID and router is ready, redirect to cart
      router.push('/guest/cart');
    }
  }, [router.isReady, router.query, clearCart, router]);

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
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
      
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Order Complete</h2>
      
      <div className="space-y-4">
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-check-circle text-green-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Thanks for your order on Guestify
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-sm mb-1">Order number: <span className="font-medium">{orderDetails.orderId}</span></p>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Service Fee (15%):</span>
            <span>€{orderDetails.serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold mb-1">
            <span>Total:</span>
            <span>€{orderDetails.finalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8">
          {propertyId ? (
            <Link href={`/guest/menu/${propertyId}`}>
              <span className="bg-[#fad02f] text-black px-4 py-2 rounded-full text-sm hover:opacity-90 transition font-semibold cursor-pointer inline-block">
                Continue Shopping
              </span>
            </Link>
          ) : (
            <Link href="/">
              <span className="bg-[#fad02f] text-black px-4 py-2 rounded-full text-sm hover:opacity-90 transition font-semibold cursor-pointer inline-block">
                Return Home
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

Checkout.getLayout = function getLayout(page) {
  return <GuestLayout title="Order Complete - Guestify">{page}</GuestLayout>;
};