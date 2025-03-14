// pages/host/inventory/[propertyId]/add-product.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Layout from '../../../../components/layout/Layout';
import { supabase } from '../../../../lib/supabase';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ButtonLayout from '../../../../components/ButtonLayout';

// Importa dinamicamente il componente BarcodeScanner per evitare errori SSR
// poiché la libreria html5-qrcode richiede il browser
const BarcodeScanner = dynamic(
  () => import('../../../../components/BarcodeScanner'),
  { ssr: false }
);

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
  const [productFound, setProductFound] = useState(false);
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
      console.log(`Searching for product with barcode: ${barcode}`);
      
      // Check if product with this barcode already exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();
        
      if (productError && productError.code !== 'PGRST116') {
        throw productError;
      }
      
      // If product exists, prefill the form
      if (product) {
        console.log('Product found:', product);
        setProductFound(true);
        
        // Cerca se questo prodotto è già nell'inventario di questa proprietà
        const { data: inventoryItem, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .eq('product_id', product.id)
          .eq('apartment_id', propertyId)
          .maybeSingle();
        
        if (inventoryError && inventoryError.code !== 'PGRST116') {
          console.error('Error checking inventory:', inventoryError);
        }
        
        // Compila il form con i dati del prodotto
        setFormData({
          barcode: product.barcode || '',
          name: product.name || '',
          description: product.description || '',
          category: product.category || 'Food and Drinks',
          image_url: product.image_url || '',
          // Se il prodotto è già nell'inventario, usa il suo prezzo, altrimenti lascia vuoto
          price: inventoryItem ? inventoryItem.price : '',
          // Lascia sempre la quantità impostata a 1 per prodotti nuovi
          quantity: '1',
        });
        
        if (product.image_url) {
          setPreview(product.image_url);
        }
        
        // Mostra un messaggio all'utente
        if (inventoryItem) {
          setError(`This product is already in your inventory with quantity ${inventoryItem.quantity}. You can add more.`);
        } else {
          setSuccess('Product found in database! Details loaded. Enter quantity and price to add to inventory.');
          // Dopo 3 secondi, nasconde il messaggio di successo
          setTimeout(() => setSuccess(false), 3000);
        }
      } else {
        console.log('Product not found, only setting barcode');
        // Imposta solo il barcode
        setFormData(prev => ({
          ...prev,
          barcode,
        }));
        setProductFound(false);
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
        .select('id, quantity')
        .eq('apartment_id', propertyId)
        .eq('product_id', productId)
        .maybeSingle();
        
      if (inventoryError && inventoryError.code !== 'PGRST116') {
        throw inventoryError;
      }
      
      if (existingInventory) {
        // Update inventory - increase quantity
        const newQuantity = existingInventory.quantity + parseInt(formData.quantity);
        
        const { error } = await supabase
          .from('inventory')
          .update({
            quantity: newQuantity,
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
      setError('Failed to add product: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handleBarcodeDetected = (barcode) => {
    console.log('Barcode detected:', barcode);
    setScanning(false); // Ferma la scansione
    
    // Imposta il barcode nel form
    setFormData(prev => ({
      ...prev,
      barcode: barcode,
    }));
    
    // Cerca informazioni sul prodotto
    fetchProductByBarcode(barcode);
  };

  const startBarcodeScanner = () => {
    setScanning(true);
    setError(null); // Pulisce eventuali errori precedenti
  };

  const stopBarcodeScanner = () => {
    setScanning(false);
  };

  const handleScannerError = (err) => {
    console.error('Scanner error:', err);
    setError(`Scanner error: ${err.message || 'Cannot access camera'}`);
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
          {typeof success === 'string' ? success : 'Product added successfully! Redirecting...'}
        </div>
      )}

      {productFound && (
        <div className="bg-blue-100 text-blue-700 p-3 rounded mb-4">
          Product found in database! Fields have been auto-filled.
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
              className={`${scanning ? 'bg-red-500' : 'bg-blue-500'} text-white px-3 py-1 rounded text-sm hover:opacity-90 transition`}
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
          <div className="mb-4 rounded relative">
            <BarcodeScanner 
              isScanning={scanning} 
              onDetected={handleBarcodeDetected} 
              onError={handleScannerError}
            />
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
                value="Products"
                checked={formData.category === "Products"}
                onChange={handleChange}
                className="mr-2"
                required
              />
              <span>Products</span>
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