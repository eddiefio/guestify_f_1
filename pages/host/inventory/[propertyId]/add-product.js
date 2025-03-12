// pages/host/inventory/[propertyId]/add-product.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../../components/layout/Layout';
import { supabase } from '../../../../lib/supabase';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ButtonLayout from '../../../../components/ButtonLayout';

export default function AddProduct() {
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    price: '',
    quantity: '1',
    description: '',
    category: 'Food and Drinks',
    image_url: '',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { propertyId } = router.query;

  useEffect(() => {
    // Check if barcode is in query params
    if (router.query.barcode) {
      fetchProductByBarcode(router.query.barcode);
    }
  }, [router.query]);

  const fetchProductByBarcode = async (barcode) => {
    try {
      setLoading(true);
      
      // Check if product with this barcode already exists
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // If product exists, prefill the form
      if (data) {
        setFormData({
          ...formData,
          barcode: data.barcode || '',
          name: data.name || '',
          description: data.description || '',
          category: data.category || 'Food and Drinks',
          image_url: data.image_url || '',
        });
        
        if (data.image_url) {
          setPreview(data.image_url);
        }
      } else {
        // Just set the barcode
        setFormData({
          ...formData,
          barcode,
        });
      }
    } catch (err) {
      console.error('Error fetching product by barcode:', err);
      setError('Failed to fetch product information');
    } finally {
      setLoading(false);
    }
  };

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
    setLoading(true);
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
      
      // Check if product with this barcode already exists
      const { data: existingProduct, error: searchError } = await supabase
        .from('products')
        .select('id')
        .eq('barcode', formData.barcode)
        .maybeSingle();
        
      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }
      
      let productId;
      
      if (existingProduct) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            image_url: imageUrl,
          })
          .eq('id', existingProduct.id)
          .select()
          .single();
          
        if (error) throw error;
        productId = data.id;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([
            {
              barcode: formData.barcode,
              name: formData.name,
              description: formData.description,
              category: formData.category,
              image_url: imageUrl,
            }
          ])
          .select()
          .single();
          
        if (error) throw error;
        productId = data.id;
      }
      
      // Check if this product is already in the property's inventory
      const { data: existingInventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('id')
        .eq('apartment_id', propertyId)
        .eq('product_id', productId)
        .maybeSingle();
        
      if (inventoryError && inventoryError.code !== 'PGRST116') {
        throw inventoryError;
      }
      
      if (existingInventory) {
        // Update inventory
        const { error } = await supabase
          .from('inventory')
          .update({
            quantity: parseInt(formData.quantity),
            price: parseFloat(formData.price),
          })
          .eq('id', existingInventory.id);
          
        if (error) throw error;
      } else {
        // Add to inventory
        const { error } = await supabase
          .from('inventory')
          .insert([
            {
              apartment_id: propertyId,
              product_id: productId,
              quantity: parseInt(formData.quantity),
              price: parseFloat(formData.price),
            }
          ]);
          
        if (error) throw error;
      }
      
      setSuccess(true);
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push(`/host/inventory/${propertyId}`);
      }, 1500);
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Failed to add product');
      setLoading(false);
    }
  };

  const startBarcodeScanner = () => {
    setScanning(true);
    // Note: In a real app, you would integrate a barcode scanning library
    // For now, we'll simulate scanning with a mock dialog
  };

  const stopBarcodeScanner = () => {
    setScanning(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Add Product</h2>
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
          Product added successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Barcode scanner section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 mb-1 font-medium">Barcode:</label>
            <button
              type="button"
              onClick={scanning ? stopBarcodeScanner : startBarcodeScanner}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
            >
              {scanning ? 'Stop Scanning' : 'Scan Barcode'}
            </button>
          </div>
          <input
            type="text"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter or scan barcode"
          />
        </div>

        {scanning && (
          <div className="mb-4 bg-black text-center p-4 rounded relative">
            <div className="text-white mb-2">Point camera at barcode</div>
            <div className="bg-white w-full h-40 flex items-center justify-center">
              <span className="text-gray-500">Camera preview would appear here</span>
            </div>
            <div className="border-2 border-white absolute inset-0 m-8 pointer-events-none"></div>
          </div>
        )}

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
              min="1"
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
                value="Articles"
                checked={formData.category === "Articles"}
                onChange={handleChange}
                className="mr-2"
                required
              />
              <span>Articles</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-medium">Product Image:</label>
          {preview && (
            <div className="mb-2">
              <img
                src={preview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded border"
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
          submitText="Add Product"
          loading={loading}
          loadingText="Adding..."
        />
      </form>
    </div>
  );
}

AddProduct.getLayout = function getLayout(page) {
  return (
    <Layout title="Add Product - Guestify">
      <ProtectedRoute>{page}</ProtectedRoute>
    </Layout>
  );
};