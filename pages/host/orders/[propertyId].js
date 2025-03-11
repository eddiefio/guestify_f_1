// pages/host/orders/[propertyId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import PropertyTabs from '../../../components/PropertyTabs';
import { supabase } from '../../../lib/supabase';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [propertyName, setPropertyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { propertyId } = router.query;

  useEffect(() => {
    if (!propertyId) return;

    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch property details
        const { data: property, error: propError } = await supabase
          .from('apartments')
          .select('name')
          .eq('id', propertyId)
          .single();
          
        if (propError) throw propError;
        setPropertyName(property.name);
        
        // Fetch orders for this property
        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select('*')
          .eq('apartment_id', propertyId)
          .order('order_date', { ascending: false });
          
        if (ordersErr) throw ordersErr;
        
        setOrders(ordersData || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [propertyId]);

  return (
    <div>
      <PropertyTabs propertyId={propertyId} activeTab="orders" propertyName={propertyName} />

      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Orders</h2>

      {loading ? (
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto text-sm sm:text-base p-2">
          {orders && orders.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-violet-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-[#5e2bff]">Order Date</th>
                  <th className="px-4 py-2 text-left font-medium text-[#5e2bff]">Order ID</th>
                  <th className="px-4 py-2 text-left font-medium text-[#5e2bff]">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(order => {
                  const orderDate = new Date(order.order_date).toLocaleDateString("en-US", {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  return (
                    <tr key={order.id}>
                      <td className="px-4 py-2">{orderDate}</td>
                      <td className="px-4 py-2">#{order.id}</td>
                      <td className="px-4 py-2">EUR {Number(order.total_price).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-white">
                <tr>
                  <td colSpan="2" className="px-4 py-2 text-right font-bold text-gray-700">
                    Total Revenue:
                  </td>
                  <td className="px-4 py-2 font-bold text-gray-700">
                    EUR {orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-gray-500 p-4">No orders yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

Orders.getLayout = function getLayout(page) {
  return <Layout title="Orders - Guestify">{page}</Layout>;
};