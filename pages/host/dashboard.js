// pages/host/dashboard.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    async function fetchProperties() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('apartments')
          .select('*')
          .eq('host_id', user.id);

        if (error) throw error;
        setProperties(data || []);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties');
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [user]);

  // Filter properties based on search term
  const filteredProperties = properties.filter(prop => 
    prop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
      <p className="text-sm sm:text-base mb-4">Here you can view your properties.</p>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          id="propertySearchInput"
          placeholder="Search properties by name..."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="propertyGrid">
          {filteredProperties.length > 0 ? (
            filteredProperties.map((prop) => (
              <div key={prop.id} className="property-card bg-white p-4 rounded-xl shadow-sm border flex flex-col">
                {/* Header card: Name/Address & Edit/Delete */}
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="property-name text-base sm:text-lg font-bold text-gray-800">{prop.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">{prop.address}</p>
                  </div>
                  <div className="flex space-x-3">
                    <Link href={`/host/edit-property/${prop.id}`}>
                      <span className="text-blue-500 hover:text-blue-700 cursor-pointer" title="Edit property">
                        <i className="fas fa-pen text-lg"></i>
                      </span>
                    </Link>
                    <Link href={`/host/delete-property/${prop.id}`}>
                      <span className="text-red-500 hover:text-red-700 cursor-pointer" title="Delete property">
                        <i className="fas fa-trash text-lg"></i>
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Four icons horizontally */}
                <div className="flex space-x-6 mt-2 justify-center">
                  <Link href={`/host/analytics/${prop.id}`}>
                    <span className="flex flex-col items-center text-gray-700 hover:text-gray-900 cursor-pointer">
                      <i className="fas fa-chart-line text-2xl mb-1"></i>
                      <span className="text-xs">Analytics</span>
                    </span>
                  </Link>
                  <Link href={`/host/orders/${prop.id}`}>
                    <span className="flex flex-col items-center text-gray-700 hover:text-gray-900 cursor-pointer">
                      <i className="fas fa-receipt text-2xl mb-1"></i>
                      <span className="text-xs">Orders</span>
                    </span>
                  </Link>
                  <Link href={`/host/inventory/${prop.id}`}>
                    <span className="flex flex-col items-center text-gray-700 hover:text-gray-900 cursor-pointer">
                      <i className="fas fa-box text-2xl mb-1"></i>
                      <span className="text-xs">Inventory</span>
                    </span>
                  </Link>
                  <Link href={`/host/printqr/${prop.id}`}>
                    <span className="flex flex-col items-center text-gray-700 hover:text-gray-900 cursor-pointer">
                      <i className="fas fa-print text-2xl mb-1"></i>
                      <span className="text-xs">Print QR</span>
                    </span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm sm:text-base col-span-full">No properties available.</p>
          )}
        </div>
      )}

      {/* Add Property Button */}
      <Link href="/host/add-property">
        <span className="inline-block bg-white text-[#fad02f] font-semibold border border-[#fad02f] px-3 py-1 rounded-full text-sm sm:text-base mt-4 hover:bg-[#fad02f] hover:text-white transition cursor-pointer">
          + Add Property
        </span>
      </Link>
    </div>
  );
}

Dashboard.getLayout = function getLayout(page) {
  return <Layout title="Dashboard - Guestify">{page}</Layout>;
};