// pages/guest/payment/[orderId].js - Updated version
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Elements, CardElement, useStripe, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import GuestLayout from '../../../components/layout/GuestLayout';
import { supabase } from '../../../lib/supabase';

// Initialize Stripe outside of component to avoid re-initialization
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Separate Payment Form component to use hooks properly
function CheckoutForm({ clientSecret, orderDetails }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const router = useRouter();

  // Set up Apple Pay / Google Pay
  useEffect(() => {
    if (stripe && orderDetails && orderDetails.total_price) {
      const pr = stripe.paymentRequest({
        country: 'IT',
        currency: 'eur',
        total: {
          label: 'Guestify Order',
          amount: Math.round(orderDetails.total_price * 100), // Convert to cents
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
        
        try {
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
        } catch (err) {
          console.error('Payment error:', err);
          e.complete('fail');
          setProcessing(false);
          setPaymentError('Payment processing failed. Please try again.');
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

    try {
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
    } catch (err) {
      console.error('Payment submission error:', err);
      setPaymentError('Payment processing failed. Please try again.');
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Update order status in database
      await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderDetails.id,
          paymentIntentId: paymentIntent.id,
        }),
      });

      // Redirect to success page
      router.push(`/guest/checkout?orderId=${orderDetails.id}&subtotal=${orderDetails.subtotal || 0}&serviceFee=${orderDetails.serviceFee || 0}&finalPrice=${orderDetails.total_price || 0}`);
    } catch (err) {
      console.error('Error confirming payment:', err);
      setPaymentError('Payment was processed but we had trouble updating your order. Please contact support.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>€{orderDetails?.subtotal?.toFixed(2) || (orderDetails?.total_price * 0.85).toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Service Fee (15%):</span>
          <span>€{orderDetails?.serviceFee?.toFixed(2) || (orderDetails?.total_price * 0.15).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total:</span>
          <span>€{orderDetails?.total_price?.toFixed(2) || '0.00'}</span>
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
  const router = useRouter();
  const { orderId } = router.query;
  const [clientSecret, setClientSecret] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        if (!order) {
          throw new Error('Order not found');
        }

        console.log('Fetched order details:', order);
        
        // Verify that total_price is defined and is a number
        if (typeof order.total_price !== 'number') {
          throw new Error('Invalid order total price');
        }

        setOrderDetails(order);

        // 2. Create payment intent
        const response = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
            amount: order.total_price,
            propertyId: order.apartment_id
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        if (!data.clientSecret) {
          throw new Error('No client secret returned from payment intent');
        }
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error fetching order or creating payment intent:', err);
        setError(err.message || 'An error occurred while preparing payment');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndCreateIntent();
  }, [orderId, router.isReady]);

  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
      },
    },
  } : {};

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-center mt-4">Loading payment details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-blue-500 text-white px-3 py-1 rounded"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Unable to initialize payment. Please try again.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-blue-500 text-white px-3 py-1 rounded"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {orderDetails && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
          <p className="text-gray-600">Order ID: {orderDetails.id}</p>
          <p className="text-gray-600">Total Amount: €{orderDetails.total_price.toFixed(2)}</p>
        </div>
      )}
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm clientSecret={clientSecret} orderDetails={orderDetails} />
        </Elements>
      )}
    </div>
  );
}

PaymentPage.getLayout = function getLayout(page) {
  return <GuestLayout title="Complete Payment - Guestify">{page}</GuestLayout>;
};