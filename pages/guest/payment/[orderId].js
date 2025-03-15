// pages/guest/payment/[orderId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';
import GuestLayout from '../../../components/layout/GuestLayout';
import { supabase } from '../../../lib/supabase';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ clientSecret, orderDetails }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const router = useRouter();

  // Set up Apple Pay / Google Pay
  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'IT',
        currency: 'eur',
        total: {
          label: 'Guestify Order',
          amount: Math.round(orderDetails.finalPrice * 100), // Convert to cents
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Check if the Payment Request is available
      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
        }
      });

      // Handle payment request confirmation
      pr.on('paymentmethod', async (e) => {
        setProcessing(true);
        
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: e.paymentMethod.id,
        });

        if (error) {
          setPaymentError(error.message);
          e.complete('fail');
          setProcessing(false);
        } else {
          e.complete('success');
          handlePaymentSuccess(paymentIntent);
        }
      });
    }
  }, [stripe, clientSecret, orderDetails]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    // Complete payment when the submit button is clicked
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (error) {
      setPaymentError(error.message);
      setProcessing(false);
    } else {
      handlePaymentSuccess(paymentIntent);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    // Update order status in database
    await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderDetails.orderId,
        paymentIntentId: paymentIntent.id,
      }),
    });

    // Redirect to success page
    router.push(`/guest/checkout?orderId=${orderDetails.orderId}&subtotal=${orderDetails.subtotal}&serviceFee=${orderDetails.serviceFee}&finalPrice=${orderDetails.finalPrice}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>€{orderDetails.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Service Fee (15%):</span>
          <span>€{orderDetails.serviceFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total:</span>
          <span>€{orderDetails.finalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
        
        {/* Show Apple Pay / Google Pay if available */}
        {paymentRequest && (
          <div className="mb-4">
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    type: 'buy',
                    theme: 'dark'
                  }
                }
              }}
            />
            <div className="text-center text-sm text-gray-500 my-3">OR</div>
          </div>
        )}

        {/* Standard card input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>

        {paymentError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {paymentError}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          className="bg-[#fad02f] text-black px-4 py-2 rounded-full font-semibold hover:opacity-90 transition w-full"
        >
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </form>
  );
}

export default function PaymentPage() {
  const [orderDetails, setOrderDetails] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { orderId } = router.query;

  useEffect(() => {
    if (!orderId || !router.isReady) return;

    const fetchOrderAndCreateIntent = async () => {
      try {
        // 1. Fetch order details
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        // 2. Create payment intent
        const response = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount: order.total_price,
            propertyId: order.apartment_id,
          }),
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Failed to create payment intent');

        // Calculate subtotal and service fee
        const serviceFee = order.total_price * 0.15;
        const subtotal = order.total_price - serviceFee;

        // Set state
        setOrderDetails({
          orderId,
          finalPrice: order.total_price,
          subtotal,
          serviceFee,
        });
        setClientSecret(result.clientSecret);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndCreateIntent();
  }, [orderId, router.isReady]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
        <p className="mt-2">Preparing your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
        <p>{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Complete Payment</h2>
      
      {clientSecret && orderDetails && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} orderDetails={orderDetails} />
        </Elements>
      )}
    </div>
  );
}

PaymentPage.getLayout = function getLayout(page) {
  return <GuestLayout title="Complete Payment - Guestify">{page}</GuestLayout>;
};