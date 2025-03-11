// pages/host/add-property.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CountrySelect } from '../../components/layout/CountrySelect';

export default function AddProperty() {
  const [formData, setFormData] = useState({
    rental_name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to add a property');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('apartments')
        .insert([
          {
            host_id: user.id,
            name: formData.rental_name,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            country: formData.country,
          },
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // Redirect to dashboard on success
      router.push('/host/dashboard');
    } catch (error) {
      console.error('Error creating property:', error);
      setError(error.message || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
      <h2 className="text-xl font-bold mb-4">Add Property</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rental_name" className="block text-sm font-medium text-gray-700 mb-1">Rental Name</label>
          <input
            type="text"
            id="rental_name"
            name="rental_name"
            value={formData.rental_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Good Place"
            required
          />
        </div>
        
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Select Country</label>
          <CountrySelect
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter full address"
            required
          />
        </div>
        
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="City"
          />
        </div>
        
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="State"
          />
        </div>
        
        <div>
          <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
          <input
            type="text"
            id="zip"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="90210"
          />
        </div>
        
        <div className="flex space-x-2">
          <Link href="/host/dashboard">
            <span className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition cursor-pointer">
              Cancel
            </span>
          </Link>
          <button 
            type="submit" 
            className="px-4 py-2 bg-[#fad02f] text-black rounded hover:opacity-90 transition font-semibold"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

AddProperty.getLayout = function getLayout(page) {
  return <Layout title="Add Property - Guestify">{page}</Layout>;
};