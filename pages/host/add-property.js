// pages/host/add-property.js - Versione migliorata
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, fetchWithRetry } from '../../lib/supabase';
import { CountrySelect } from '../../components/layout/CountrySelect';
import ProtectedRoute from '../../components/ProtectedRoute';
import ButtonLayout from '../../components/ButtonLayout';

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
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed to ${value}`);
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to add a property');
      return;
    }
    
    // Validazione del form
    if (!formData.country) {
      setError('Please select a country');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Submitting form data:', formData);
      
      // Impostiamo un timeout per evitare blocchi infiniti
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000);
      });
      
      // Utilizziamo fetchWithRetry per gestire i tentativi di invio
      const insertPromise = fetchWithRetry(async () => {
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
        return data;
      });
      
      // Race per gestire il timeout
      const data = await Promise.race([insertPromise, timeoutPromise]);
      
      console.log('Property created successfully:', data);
      setSuccess(true);
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/host/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error creating property:', error);
      setError(error.message || 'Failed to create property. Please try again.');
      setLoading(false);
    }
  };

  // Se siamo in uno stato di successo, mostriamo un messaggio invece che il form
  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow mt-10">
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          Property added successfully! Redirecting to dashboard...
        </div>
      </div>
    );
  }

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
            disabled={loading}
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
            disabled={loading}
          />
          {/* Aggiunto un indicatore di debug per verificare che il paese sia stato selezionato */}
          {formData.country && (
            <p className="text-xs text-green-600 mt-1">Selected: {formData.country}</p>
          )}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
        </div>
        
        {/* Utilizzo del componente ButtonLayout per i bottoni */}
        <ButtonLayout 
          cancelHref="/host/dashboard"
          submitText="Save"
          loading={loading}
          loadingText="Saving..."
        />
        
        {/* Pulsante di fallback in caso di problemi con ButtonLayout */}
        {loading && (
          <div className="text-center mt-2">
            <button 
              type="button" 
              onClick={() => {
                setLoading(false);
                router.push('/host/dashboard');
              }}
              className="text-sm text-gray-500 underline"
            >
              Cancel and go back
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

AddProperty.getLayout = function getLayout(page) {
  return (
    <Layout title="Add Property - Guestify">
      <ProtectedRoute>{page}</ProtectedRoute>
    </Layout>
  );
};