// pages/guest/product/[propertyId]/[productId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import GuestLayout from '../../../../components/layout/GuestLayout';
import { useCart } from '../../../../contexts/CartContext';
import { supabase } from '../../../../lib/supabase';

export default function ProductDetail() {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productLocation, setProductLocation] = useState('');
  const { addToCart } = useCart();
  const router = useRouter();
  const { propertyId, productId, category } = router.query;
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
const [tempQuantityValue, setTempQuantityValue] = useState('');


  useEffect(() => {
    if (!propertyId || !productId) return;

    async function fetchProduct() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('inventory')
          .select(`
            id,
            apartment_id,
            quantity,
            price,
            product_id,
            products ( name, description, image_url, category )
          `)
          .eq('apartment_id', propertyId)
          .eq('product_id', productId)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          throw new Error('Product not found');
        }
        
        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();

    // Check for saved location in localStorage
    if (propertyId && productId) {
      const locationKey = `product_location_${propertyId}_${productId}`;
      const savedLocation = localStorage.getItem(locationKey);
      if (savedLocation) {
        setProductLocation(savedLocation);
      }
    }
  }, [propertyId, productId]);

  const handleQuantityChange = (change) => {
    setQuantity(prev => {
      const newValue = prev + change;
      
      // Don't allow less than 1 or more than available stock
      if (newValue < 1) return 1;
      if (product && newValue > product.quantity) return product.quantity;
      
      return newValue;
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      propertyId: product.apartment_id,
      productId: product.product_id,  // Verifica che questo campo sia corretto
      name: product.products.name,
      price: parseFloat(product.price),
      quantity: quantity
    });

    // Navigate back to category page or menu if no category
    if (category) {
      router.push(`/guest/menu/${propertyId}?category=${encodeURIComponent(category)}`);
    } else {
      router.push(`/guest/menu/${propertyId}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
        {error}
        <div className="mt-4">
          <Link href={`/guest/menu/${propertyId}`}>
            <span className="text-blue-500 hover:underline cursor-pointer">Back to Menu</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div>
      {/* Back navigation */}
      <div className="bg-white p-2 rounded-xl mb-4 inline-block">
        <Link 
          href={category 
            ? `/guest/menu/${propertyId}?category=${encodeURIComponent(category)}` 
            : `/guest/menu/${propertyId}`
          }
        >
          <span className="text-sm text-[#5e2bff] font-semibold underline cursor-pointer">
            Back to Menu
          </span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Product image */}
        {product.products.image_url ? (
          <div className="relative w-full h-64">
            <Image 
              src={product.products.image_url}
              alt={product.products.name}
              layout="fill"
              objectFit="cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No image available</span>
          </div>
        )}

        {/* Product details */}
        <div className="p-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            {product.products.name}
          </h1>
          
          <p className="text-gray-600 mb-4">
            {product.products.description || 'No description available'}
          </p>

          {/* Product Location */}
          {productLocation && (
            <div className="mt-3 mb-4 bg-blue-50 p-3 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <i className="fas fa-map-marker-alt text-blue-500 mr-2"></i>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-700">Location in property:</h4>
                  <p className="text-sm text-blue-600">{productLocation}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-gray-800">
              €{parseFloat(product.price).toFixed(2)}
            </span>
            <span className="text-sm text-gray-600">
              {product.quantity} in stock
            </span>
          </div>

          {/* Quantity selector */}
          <div className="flex flex-col items-center mt-6">
            <div className="flex items-center mb-4">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xl font-bold"
                aria-label="Decrease quantity"
              >
                −
              </button>
              // Then modify the quantity input
<input
  type="text" // Change from number to text
  value={isEditingQuantity ? tempQuantityValue : quantity}
  onFocus={() => {
    setIsEditingQuantity(true);
    setTempQuantityValue(quantity.toString());
  }}
  onChange={(e) => {
    setTempQuantityValue(e.target.value);
  }}
  onBlur={(e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    // Ensure value doesn't exceed available stock
    const validatedQty = Math.min(val, product.quantity);
    setQuantity(validatedQty);
    setIsEditingQuantity(false);
  }}
  className="w-16 mx-2 border rounded px-2 py-1 text-center"
/>
              <button
                onClick={() => handleQuantityChange(1)}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xl font-bold"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="bg-[#fad02f] text-black px-6 py-2 rounded-full text-base font-semibold hover:opacity-90 transition w-full sm:w-auto"
            >
              Add for €{(parseFloat(product.price) * quantity).toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* Category tag */}
      {product.products.category && (
        <div className="mt-4 inline-block bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
          {product.products.category}
        </div>
      )}
    </div>
  );
}

ProductDetail.getLayout = function getLayout(page) {
  return <GuestLayout title="Product Details - Guestify">{page}</GuestLayout>;
};