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
    e.preventDefault(); // Importante per gestire il form correttamente
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      
      // Redirect to dashboard after successful deletion
      router.push('/host/dashboard');
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property');
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
                  This action cannot be undone. All data related to this property will be permanently deleted.
                </p>
              </div>
            </div>
          </div>
          
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