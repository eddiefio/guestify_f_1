// pages/host/inventory/[propertyId]/edit-product/[productId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../../../../components/layout/Layout';
import { supabase } from '../../../../../lib/supabase';
import ProtectedRoute from '../../../../../components/ProtectedRoute';
import ButtonLayout from '../../../../../components/ButtonLayout';

export default function EditProduct() {
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    price: '',
    quantity: '',
    description: '',
    category: '',
    image_url: '',
    location: '', // Added location field
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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
        
        setFormData({
          barcode: product.barcode || '',
          name: product.name || '',
          price: inventory.price || '',
          quantity: inventory.quantity || '',
          description: product.description || '',
          category: product.category || 'Food and Drinks',
          image_url: product.image_url || '',
          location: '', // Will be updated from localStorage below
        });
        
        if (product.image_url) {
          setPreview(product.image_url);
        }

        // Load location from localStorage if available
        if (productId && propertyId) {
          const locationKey = `product_location_${propertyId}_${productId}`;
          const savedLocation = localStorage.getItem(locationKey);
          if (savedLocation) {
            setFormData(prev => ({
              ...prev,
              location: savedLocation
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product data');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [propertyId, productId]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview URL
      if (selectedFile) {
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
        
        // Clear preview URL when component unmounts
        return () => URL.revokeObjectURL(objectUrl);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      let imageUrl = formData.image_url;
      
      // Upload image if a new file is selected
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `product-images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('guestify')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data } = supabase.storage
          .from('guestify')
          .getPublicUrl(filePath);
          
        imageUrl = data.publicUrl;
      }
      
      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update({
          barcode: formData.barcode,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          image_url: imageUrl,
        })
        .eq('id', productId);
        
      if (productError) throw productError;
      
      // Update inventory
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          quantity: parseInt(formData.quantity),
          price: parseFloat(formData.price),
        })
        .eq('apartment_id', propertyId)
        .eq('product_id', productId);
        
      if (inventoryError) throw inventoryError;
      
      // Save location to localStorage if provided, or remove if empty
      if (formData.location && formData.location.trim() !== '') {
        const locationKey = `product_location_${propertyId}_${productId}`;
        localStorage.setItem(locationKey, formData.location);
      } else {
        // If location is empty, remove any existing entry
        const locationKey = `product_location_${propertyId}_${productId}`;
        localStorage.removeItem(locationKey);
      }
      
      setSuccess(true);
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push(`/host/inventory/${propertyId}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
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
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Edit Product</h2>
        <Link href={`/host/inventory/${propertyId}`}>
          <span className="text-blue-500 hover:underline cursor-pointer">
            Back to Inventory
          </span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          Product updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Barcode:</label>
          <input
            type="text"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter barcode"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-medium">Product Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Product name"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Price (EUR):</label>
            <input
              type="number"
              step="0.01"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Quantity:</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="1"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-medium">Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Product description"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-medium">Location in Property:</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., Kitchen cabinet, Refrigerator, Bathroom shelf"
          />
          <p className="text-xs text-gray-500 mt-1">
            This helps guests find the product. Only visible to guests, not stored in database.
          </p>
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-medium">Category:</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="category"
                value="Food and Drinks"
                checked={formData.category === "Food and Drinks"}
                onChange={handleChange}
                className="mr-2"
                required
              />
              <span>Food and Drinks</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="category"
                value="Objects"
                checked={formData.category === "Objects"}
                onChange={handleChange}
                className="mr-2"
                required
              />
              <span>Objects</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-medium">Product Image:</label>
          {preview && (
            <div className="mb-2">
              <Image
                src={preview}
                alt="Preview"
                width={128}
                height={128}
                className="object-cover rounded border"
              />
            </div>
          )}
          <input
            type="file"
            name="image"
            onChange={handleChange}
            accept="image/*"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <ButtonLayout 
          cancelHref={`/host/inventory/${propertyId}`}
          submitText="Save Changes"
          loading={saving}
          loadingText="Saving..."
        />
      </form>
    </div>
  );
}

EditProduct.getLayout = function getLayout(page) {
  return (
    <Layout title="Edit Product - Guestify">
      <ProtectedRoute>{page}</ProtectedRoute>
    </Layout>
  );
};