// pages/host/delete-property/[propertyId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import { supabase } from '../../../lib/supabase';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ButtonLayout from '../../../components/ButtonLayout';

export default function DeleteProperty() {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [deleteProgress, setDeleteProgress] = useState({ step: '', completed: false });
  const router = useRouter();
  const { propertyId } = router.query;

  useEffect(() => {
    if (!propertyId) return;

    async function fetchProperty() {
      try {
        const { data, error } = await supabase
          .from('apartments')
          .select('*')
          .eq('id', propertyId)
          .single();

        if (error) throw error;
        setProperty(data);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Could not find property');
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [propertyId]);

  const handleDelete = async (e) => {
    e.preventDefault();
    try {
      setDeleting(true);
      
      // 1. First, get all order IDs for this property to find related order items
      setDeleteProgress({ step: 'Finding orders...', completed: false });
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('apartment_id', propertyId);
        
      if (ordersError) throw ordersError;
      
      // 2. Delete all order items related to these orders
      if (orders && orders.length > 0) {
        const orderIds = orders.map(order => order.id);
        setDeleteProgress({ step: 'Deleting order items...', completed: false });
        
        const { error: orderItemsError } = await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds);
          
        if (orderItemsError) throw orderItemsError;
      }
      
      // 3. Delete all orders for this property
      setDeleteProgress({ step: 'Deleting orders...', completed: false });
      const { error: deleteOrdersError } = await supabase
        .from('orders')
        .delete()
        .eq('apartment_id', propertyId);
        
      if (deleteOrdersError) throw deleteOrdersError;
      
      // 4. Find all inventory items for this property to identify product IDs
      setDeleteProgress({ step: 'Finding inventory...', completed: false });
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory')
        .select('product_id')
        .eq('apartment_id', propertyId);
        
      if (inventoryError) throw inventoryError;
      
      // 5. Delete all inventory items for this property
      setDeleteProgress({ step: 'Deleting inventory...', completed: false });
      const { error: deleteInventoryError } = await supabase
        .from('inventory')
        .delete()
        .eq('apartment_id', propertyId);
        
      if (deleteInventoryError) throw deleteInventoryError;
      
      // 6. Finally delete the property itself
      setDeleteProgress({ step: 'Deleting property...', completed: false });
      const { error: deletePropertyError } = await supabase
        .from('apartments')
        .delete()
        .eq('id', propertyId);
        
      if (deletePropertyError) throw deletePropertyError;
      
      setDeleteProgress({ step: 'Complete!', completed: true });
      
      // 7. Redirect to dashboard after successful deletion
      setTimeout(() => {
        router.push('/host/dashboard');
      }, 1000);
      
    } catch (err) {
      console.error('Error deleting property:', err);
      setError(`Failed to delete property: ${err.message}`);
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
        
        <ButtonLayout 
          cancelHref="/host/dashboard"
          cancelText="Back to Dashboard"
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
      <h2 className="text-xl font-bold text-red-600 mb-4">Delete Property</h2>
      
      {property && (
        <form onSubmit={handleDelete}>
          <p className="mb-4">
            Are you sure you want to delete the property:
            <span className="font-semibold block mt-2">{property.name}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">{property.address}</p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-yellow-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This action cannot be undone. All data related to this property will be permanently deleted, including:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
                  <li>All orders and order history</li>
                  <li>All inventory items</li>
                  <li>All QR codes and product data</li>
                </ul>
              </div>
            </div>
          </div>
          
          {deleting && deleteProgress.step && (
            <div className="mb-4 bg-blue-50 p-3 rounded">
              <div className="flex items-center">
                <div className="mr-2">
                  {deleteProgress.completed ? (
                    <i className="fas fa-check-circle text-green-500"></i>
                  ) : (
                    <i className="fas fa-spinner fa-spin text-blue-500"></i>
                  )}
                </div>
                <p className="text-sm text-blue-700">{deleteProgress.step}</p>
              </div>
            </div>
          )}
          
          <ButtonLayout 
            cancelHref="/host/dashboard"
            submitText="Delete"
            loading={deleting}
            loadingText="Deleting..."
            danger={true}
          />
        </form>
      )}
    </div>
  );
}

DeleteProperty.getLayout = function getLayout(page) {
  return (
    <Layout title="Delete Property - Guestify">
      <ProtectedRoute>{page}</ProtectedRoute>
    </Layout>
  );
};