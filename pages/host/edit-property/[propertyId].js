// pages/host/edit-property/[propertyId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import { CountrySelect } from '../../../components/layout/CountrySelect';
import { supabase } from '../../../lib/supabase';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function EditProperty() {
  const [formData, setFormData] = useState({
    rental_name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
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
        
        setFormData({
          rental_name: data.name || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          country: data.country || '',
        });
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Could not load property data');
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [propertyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed to ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      console.log('Submitting updated form data:', formData);
      const { error } = await supabase
        .from('apartments')
        .update({
          name: formData.rental_name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        })
        .eq('id', propertyId);

      if (error) throw error;
      
      // Redirect back to dashboard
      router.push('/host/dashboard');
    } catch (err) {
      console.error('Error updating property:', err);
      setError('Failed to update property');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
      <h2 className="text-xl font-bold mb-4">Edit Property</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rental Name</label>
          <input
            type="text"
            name="rental_name"
            value={formData.rental_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
          <input
            type="text"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <CountrySelect
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {/* Aggiunto un indicatore di debug per verificare che il paese sia stato selezionato */}
          {formData.country && (
            <p className="text-xs text-green-600 mt-1">Selected: {formData.country}</p>
          )}
        </div>
        
        {/* Container dei bottoni corretto */}
        <div className="flex justify-end space-x-4">
          <Link href="/host/dashboard">
            <span className="inline-block px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition cursor-pointer">
              Cancel
            </span>
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-block px-4 py-2 bg-[#fad02f] text-black rounded hover:opacity-90 transition font-semibold"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

EditProperty.getLayout = function getLayout(page) {
  return (
    <Layout title="Edit Property - Guestify">
      <ProtectedRoute>{page}</ProtectedRoute>
    </Layout>
  );
};