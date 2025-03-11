// pages/host/inventory/[propertyId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../../components/layout/Layout';
import PropertyTabs from '../../../components/PropertyTabs';
import { supabase } from '../../../lib/supabase';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [propertyName, setPropertyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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
        
        // Fetch inventory with product details
        const { data: inventoryData, error: invError } = await supabase
          .from('inventory')
          .select(`
            id,
            quantity,
            price,
            product_id,
            products ( id, name, barcode, image_url, description, category )
          `)
          .eq('apartment_id', propertyId);
          
        if (invError) throw invError;
        
        setInventory(inventoryData || []);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [propertyId]);

  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item => 
    item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <PropertyTabs propertyId={propertyId} activeTab="inventory" propertyName={propertyName} />

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Inventory</h3>
        <Link href={`/host/inventory/${propertyId}/add-product`}>
          <span className="bg-[#fad02f] text-black px-3 py-1 rounded-full text-sm hover:opacity-90 transition font-semibold cursor-pointer">
            + Add Product
          </span>
        </Link>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          id="searchInput"
          placeholder="Search products by name..."
          className="w-full border px-3 py-2 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto w-full bg-white shadow-md rounded-md text-sm">
          <table id="inventoryTable" className="table-auto w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-700">Image</th>
                <th className="px-2 py-2 text-left font-medium text-gray-700">Name</th>
                <th className="px-2 py-2 text-left font-medium text-gray-700">Category</th>
                <th className="px-2 py-2 text-left font-medium text-gray-700">Price</th>
                <th className="px-2 py-2 text-left font-medium text-gray-700">Qt.</th>
                <th className="px-2 py-2 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr key={item.id}>
                    {/* Image */}
                    <td className="px-2 py-2">
                      {item.products?.image_url ? (
                        <div className="relative w-14 h-14">
                          <Image
                            src={item.products.image_url}
                            alt={item.products.name || 'Product image'}
                            layout="fill"
                            objectFit="cover"
                            className="rounded"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
                    </td>
                    {/* Name */}
                    <td className="px-2 py-2 border">
                      {item.products?.name || 'N/A'}
                    </td>
                    {/* Category */}
                    <td className="px-2 py-2 border">
                      {item.products?.category || "No Category"}
                    </td>
                    {/* Price */}
                    <td className="px-2 py-2 border">
                      EUR {Number(item.price).toFixed(2)}
                    </td>
                    {/* Quantity */}
                    <td className="px-2 py-2 border text-center">
                      {item.quantity}
                    </td>
                    {/* Actions */}
                    <td className="px-2 py-2 border text-center">
                      <Link href={`/host/inventory/${propertyId}/edit-product/${item.products?.id}`}>
                        <span className="text-blue-500 hover:underline mr-2 cursor-pointer">Edit</span>
                      </Link>
                      <Link href={`/host/inventory/${propertyId}/delete-product/${item.products?.id}`}>
                        <span className="text-red-500 hover:underline cursor-pointer">Delete</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-2 text-center text-gray-500">
                    No products in inventory
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

Inventory.getLayout = function getLayout(page) {
  return <Layout title="Inventory - Guestify">{page}</Layout>;
};