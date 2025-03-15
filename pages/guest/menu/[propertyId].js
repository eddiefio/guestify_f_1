// pages/guest/menu/[propertyId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import GuestLayout from '../../../components/layout/GuestLayout';
import { useCart } from '../../../contexts/CartContext';
import { supabase } from '../../../lib/supabase';

export default function GuestMenu() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { propertyId, category } = router.query;
  const { addToCart, setPropertyId } = useCart();

  useEffect(() => {
    if (!propertyId) return;

    // Set property ID in cart context
    setPropertyId(propertyId);

    async function fetchInventory() {
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
          .gt('quantity', 0);

        if (error) throw error;
        setInventory(data || []);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, [propertyId, setPropertyId]);

  const handleAddToCart = (item, quantity = 1) => {
    // Ensure the quantity doesn't exceed available stock
    const validatedQuantity = Math.min(
      parseInt(quantity, 10),
      item.quantity // Available inventory quantity
    );
    
    addToCart({
      propertyId: item.apartment_id,
      productId: item.product_id,
      name: item.products.name,
      price: parseFloat(item.price),
      quantity: validatedQuantity,
      maxQuantity: item.quantity // Store max available with the cart item
    });
  };

  // If no category is selected, show category selection
  if (!category) {
    return (
      <div className="h-full flex flex-col justify-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center">
          Select a category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-grow">
          {/* Food and Drinks */}
          <Link href={`/guest/menu/${propertyId}?category=Food%20and%20Drinks`}>
            <div className="bg-white rounded-xl shadow flex flex-col items-center justify-center p-6 hover:shadow-lg transition cursor-pointer" style={{ minHeight: '250px' }}>
              <i className="fas fa-utensils fa-4x text-[#fad02f] mb-3"></i>
              <h3 className="text-lg font-bold text-[#000000] mb-1">Food and Drinks</h3>
              <p className="text-sm text-gray-600 text-center">
                View all food and drinks.
              </p>
            </div>
          </Link>

          {/* Objects */}
          <Link href={`/guest/menu/${propertyId}?category=Objects`}>
            <div className="bg-white rounded-xl shadow flex flex-col items-center justify-center p-6 hover:shadow-lg transition cursor-pointer" style={{ minHeight: '250px' }}>
              <i className="fas fa-box-open fa-4x text-[#fad02f] mb-3"></i>
              <h3 className="text-lg font-bold text-[#000000] mb-1">Objects</h3>
              <p className="text-sm text-gray-600 text-center">
                View all articles.
              </p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Filter inventory by category
  const filteredInventory = inventory.filter(item => 
    item.products?.category === category
  );

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
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
        Products - {category}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {filteredInventory.length > 0 ? (
          filteredInventory.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col">
              {/* Product image (clickable) */}
              <Link href={`/guest/product/${item.apartment_id}/${item.product_id}?category=${encodeURIComponent(category)}`}>
                <div className="cursor-pointer">
                  {item.products?.image_url ? (
                    <div className="relative w-full h-40 mb-2">
                      <Image
                        src={item.products.image_url}
                        alt={item.products.name}
                        layout="fill"
                        objectFit="cover"
                        className="rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded mb-2">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}
                </div>
              </Link>

              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">
                {item.products?.name}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                Availability: {item.quantity}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Price: €{parseFloat(item.price).toFixed(2)}
              </p>

              {/* Add to cart section */}
              <div className="mt-auto flex items-center space-x-2">
                <form className="flex items-center space-x-2 w-full">
                  <input
                    type="number"
                    min="1"
                    max={item.quantity}
                    defaultValue="1"
                    className="w-16 border rounded px-2 py-1 text-sm"
                    onChange={(e) => {
                      // Store the quantity in a data attribute for use when adding to cart
                      e.target.dataset.quantity = e.target.value;
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const qty = parseInt(e.target.form[0].dataset.quantity || e.target.form[0].value, 10);
                      handleAddToCart(item, qty);
                    }}
                    className="bg-[#fad02f] text-black px-3 py-1 rounded-full text-sm hover:bg-[#fad02f]/90 transition flex-grow font-semibold"
                  >
                    Add to Cart
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-2 text-center text-gray-500">No products available in this category.</p>
        )}
      </div>

      {/* Back to category selection */}
      <div className="mt-4">
        <Link href={`/guest/menu/${propertyId}`}>
          <span className="text-sm text-[#5e2bff] font-semibold underline cursor-pointer">
            Back to Menu
          </span>
        </Link>
      </div>
    </div>
  );
}

GuestMenu.getLayout = function getLayout(page) {
  return <GuestLayout title="Menu - Guestify">{page}</GuestLayout>;
};