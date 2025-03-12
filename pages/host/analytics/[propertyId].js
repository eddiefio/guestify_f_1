// pages/host/analytics/[propertyId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import PropertyTabs from '../../../components/PropertyTabs';
import { supabase } from '../../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [propertyName, setPropertyName] = useState('');
  const [topProducts, setTopProducts] = useState([]);
  const [monthlySales, setMonthlySales] = useState(0);
  const [monthlyOrders, setMonthlyOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { propertyId } = router.query;

  useEffect(() => {
    if (!propertyId) return;

    async function fetchAnalytics() {
      try {
        setLoading(true);
        
        // 1. Fetch property details
        const { data: property, error: propError } = await supabase
          .from('apartments')
          .select('name')
          .eq('id', propertyId)
          .single();
          
        if (propError) throw propError;
        setPropertyName(property.name);
        
        // 2. Fetch all orders for this property
        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select('*')
          .eq('apartment_id', propertyId);
          
        if (ordersErr) throw ordersErr;
        
        // If no orders, show empty state
        if (!ordersData || ordersData.length === 0) {
          setTopProducts([]);
          setMonthlySales(0);
          setMonthlyOrders(0);
          setTotalSales(0);
          setTotalOrders(0);
          setLoading(false);
          return;
        }
        
        // Get order IDs for fetching order items
        const orderIds = ordersData.map(o => o.id);
        
        // 3. Fetch order items
        const { data: itemsData, error: itemsErr } = await supabase
          .from('order_items')
          .select('order_id, product_id, quantity, price')
          .in('order_id', orderIds);
          
        if (itemsErr) throw itemsErr;
        
        // 4. Fetch product details
        const { data: productsData, error: prodErr } = await supabase
          .from('products')
          .select('id, name');
          
        if (prodErr) throw prodErr;
        
        // Create product ID to name mapping
        const productMap = {};
        productsData.forEach(p => {
          productMap[p.id] = p.name;
        });
        
        // Calculate top selling products
        const productSales = {};
        itemsData.forEach(item => {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = 0;
          }
          productSales[item.product_id] += item.quantity;
        });
        
        // Transform to array and sort by quantity
        const topProductsArray = Object.keys(productSales).map(prodId => ({
          name: productMap[prodId] || 'Unknown',
          totalSold: productSales[prodId]
        }));
        
        topProductsArray.sort((a, b) => b.totalSold - a.totalSold);
        setTopProducts(topProductsArray.slice(0, 5)); // Top 5 products
        
        // Calculate sales stats
        let total = 0;
        let currentMonthSales = 0;
        let currentMonthOrders = 0;
        
        // Current month/year
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Monthly sales data for chart
        const monthlySalesMap = {};
        
        ordersData.forEach(order => {
          const orderDate = new Date(order.order_date);
          const orderTotal = parseFloat(order.total_price);
          total += orderTotal;
          
          // Check if order is from current month
          if (orderDate.getMonth() === currentMonth && 
              orderDate.getFullYear() === currentYear) {
            currentMonthSales += orderTotal;
            currentMonthOrders++;
          }
          
          // Aggregate by month for chart
          const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
          if (!monthlySalesMap[monthKey]) {
            monthlySalesMap[monthKey] = {
              month: new Date(orderDate.getFullYear(), orderDate.getMonth(), 1)
                .toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              sales: 0,
              orders: 0
            };
          }
          monthlySalesMap[monthKey].sales += orderTotal;
          monthlySalesMap[monthKey].orders += 1;
        });
        
        // Convert to array and sort by date
        const salesDataArray = Object.values(monthlySalesMap);
        salesDataArray.sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA - dateB;
        });
        
        setMonthlySales(currentMonthSales);
        setMonthlyOrders(currentMonthOrders);
        setTotalSales(total);
        setTotalOrders(ordersData.length);
        setSalesData(salesDataArray);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [propertyId]);

  return (
    <div>
      <PropertyTabs propertyId={propertyId} activeTab="analytics" propertyName={propertyName} />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : (
        <>
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {/* Top Selling Products Card */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                Top Selling Products
              </h3>
              {topProducts && topProducts.length > 0 ? (
                <ul className="space-y-2">
                  {topProducts.map((p, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{p.name}</span>
                      <span className="text-sm font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {p.totalSold} sold
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No data yet.</p>
              )}
            </div>

            {/* Sales This Month Card */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                Sales This Month
              </h3>
              <p className="text-xl font-bold text-gray-800">
                €{monthlySales.toFixed(2)}
                <span className="text-sm text-gray-500 ml-1">
                  ({monthlyOrders} orders)
                </span>
              </p>
              <div className="mt-2 text-sm">
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${
                    monthlyOrders > 0 ? 'bg-green-500' : 'bg-gray-300'
                  } mr-2`}></span>
                  <span className="text-gray-600">
                    {monthlyOrders > 0 ? 'Active this month' : 'No orders this month'}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Sales Card */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                Total Sales
              </h3>
              <p className="text-xl font-bold text-gray-800">
                €{totalSales.toFixed(2)}
                <span className="text-sm text-gray-500 ml-1">
                  ({totalOrders} orders)
                </span>
              </p>
              <div className="mt-2 text-sm">
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${
                    totalOrders > 10 ? 'bg-blue-500' : 'bg-yellow-500'
                  } mr-2`}></span>
                  <span className="text-gray-600">
                    {totalOrders > 10 ? 'Well established' : 'Growing business'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        // Modified chart implementation in pages/host/analytics/[propertyId].js
// Replace the chart section with this simpler implementation:

{/* Sales Chart - Modified to avoid potential eval usage */}
{salesData.length > 0 && (
  <div className="bg-white p-4 rounded-lg shadow-md mb-8">
    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
      Monthly Sales Overview
    </h3>
    <div className="h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={salesData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`€${value.toFixed(2)}`, 'Sales']} 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
          />
          <Legend />
          <Bar 
            dataKey="sales" 
            name="Sales (€)" 
            fill="#8884d8" 
            isAnimationActive={false} // Disable animations to avoid complex JS evaluation
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

          {/* Performance Insights Card */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
              Performance Insights
            </h3>
            {totalOrders > 0 ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800">Average Order Value</h4>
                  <p className="text-gray-600">
                    €{(totalSales / totalOrders).toFixed(2)} per order
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Recommendations</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                    {topProducts.length > 0 && (
                      <li>Your top seller is "{topProducts[0].name}" - consider adding similar products</li>
                    )}
                    {monthlyOrders === 0 && (
                      <li>No sales this month - consider running a promotion</li>
                    )}
                    {monthlyOrders > 0 && monthlyOrders < 5 && (
                      <li>Low sales volume this month - try advertising your menu to guests</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Make your first sale to see performance insights.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

Analytics.getLayout = function getLayout(page) {
  return <Layout title="Analytics - Guestify">{page}</Layout>;
};