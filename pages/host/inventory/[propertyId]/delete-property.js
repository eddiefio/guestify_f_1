// pages/host/inventory/[propertyId]/delete-product/[productId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../../../components/layout/Layout';
import { supabase } from '../../../../../lib/supabase';

export default function DeleteProduct() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { propertyId, productId } = router.query;

  useEffect(() => {
    if (!propertyId || !productId) return;

    async function fetchProduct() {
      try {
        setLoading(true);
        
        // Fetch product details
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
          
        if (productError) throw productError;
        
        // Fetch inventory details
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .eq('apartment_id', propertyId)
          .eq('product_id', productId)
          .single();
          
        if (inventoryError) throw inventoryError;
        
        setProduct({
          ...product,
          price: inventory.price,
          quantity: inventory.quantity
        });
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product data');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [propertyId, productId]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      
      // Delete from inventory (we only remove the link between property and product)
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .eq('apartment_id', propertyId)
        .eq('product_id', productId);
        
      if (deleteError) throw deleteError;
      
      // Redirect back to inventory
      router.push(`/host/inventory/${propertyId}`);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      setDeleting(false);
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
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
        <Link href={`/host/inventory/${propertyId}`}>
          <span className="text-blue-500 hover:underline cursor-pointer">
            Back to Inventory
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Product Deletion</h2>
      
      {product && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            {product.image_url ? (
              <div className="flex-shrink-0">
                <Image 
                  src={product.image_url} 
                  alt={product.name} 
                  width={80} 
                  height={80} 
                  className="rounded object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                <i className="fas fa-image text-gray-400"></i>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-sm text-gray-500">
                €{parseFloat(product.price).toFixed(2)} · {product.quantity} in stock
              </p>
              {product.category && (
                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mt-1">
                  {product.category}
                </span>
              )}
            </div>
          </div>
          
          <p className="mb-4">
            Are you sure you want to delete this product from your inventory?
          </p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-yellow-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This will remove the product from this property's inventory only. The product data will still be available for use in other properties.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Link href={`/host/inventory/${propertyId}`}>
              <span className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition cursor-pointer">
                Cancel
              </span>
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

DeleteProduct.getLayout = function getLayout(page) {
  return <Layout title="Delete Product - Guestify">{page}</Layout>;
};