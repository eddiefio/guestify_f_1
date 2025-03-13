// pages/host/printqr/[propertyId].js - Simple check
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import PropertyTabs from '../../../components/PropertyTabs';
import { supabase } from '../../../lib/supabase';
import QRCode from 'qrcode';
import { useAuth } from '../../../contexts/AuthContext';

export default function PrintQR() {
  const [propertyName, setPropertyName] = useState('');
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [menuUrl, setMenuUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printingStatus, setPrintingStatus] = useState('idle'); // 'idle', 'preparing', 'ready', 'error'
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isCheckingStripe, setIsCheckingStripe] = useState(true);
  const qrRef = useRef(null);
  const router = useRouter();
  const { propertyId } = router.query;
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !profile || !router.isReady) return;

    console.log("PrintQR - Checking Stripe account");
    console.log("Profile:", profile);
    
    // Check if user has connected Stripe
    if (!profile.stripe_account_id) {
      console.log('No Stripe account found, redirecting to connect-stripe');
      setIsCheckingStripe(false);
      
      // Store property ID for return after Stripe connection
      localStorage.setItem('property_id_for_qr', propertyId);
      router.push(`/host/connect-stripe`);
      return;
    }
    
    setIsCheckingStripe(false);
    
    const fetchData = async () => {
      try {
        // Fetch property details
        const { data: property, error: propError } = await supabase
          .from('apartments')
          .select('name')
          .eq('id', propertyId)
          .single();
          
        if (propError) throw propError;
        setPropertyName(property.name);
        
        // Generate menu URL
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/guest/menu/${propertyId}`;
        setMenuUrl(url);
        
        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 1,
          color: {
            dark: '#5e2bff',
            light: '#ffffff'
          }
        });
        
        setQrCodeDataURL(qrDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId, user, profile, router]);

  const handlePrintQR = async () => {
    try {
      setPrintingStatus('preparing');
      
      // Request PDF from server
      const response = await fetch(`/api/printqr-pdf?propertyId=${propertyId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      // Get blob from response
      const blob = await response.blob();
      
      // Create URL for the blob
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setPrintingStatus('ready');
      
      // Open PDF in new tab
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error creating PDF:', error);
      setPrintingStatus('error');
    }
  };

  const handleDirectPrint = () => {
    if (qrRef.current) {
      // Open the print dialog
      const printWindow = window.open('', '', 'height=500,width=500');
      printWindow.document.write('<html><head><title>Print QR Code</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<div style="text-align:center; padding:20px;">');
      printWindow.document.write('<h1 style="font-family:Arial,sans-serif;color:#5e2bff;">Guestify Menu</h1>');
      printWindow.document.write('<h2 style="font-family:Arial,sans-serif;color:#333;">' + propertyName + '</h2>');
      printWindow.document.write('<div style="margin:30px 0;">');
      printWindow.document.write('<img src="' + qrCodeDataURL + '" style="width:300px;height:300px;" />');
      printWindow.document.write('</div>');
      printWindow.document.write('<p style="font-family:Arial,sans-serif;color:#666;">Scan this QR code to access the menu</p>');
      printWindow.document.write('<p style="font-family:Arial,sans-serif;color:#999;font-size:12px;">' + menuUrl + '</p>');
      printWindow.document.write('</div>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      
      // Print after a short delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  // Show loading while checking Stripe status
  if (isCheckingStripe) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="ml-3">Checking account status...</p>
      </div>
    );
  }

  return (
    <div>
      <PropertyTabs propertyId={propertyId} activeTab="printqr" propertyName={propertyName} />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : (
        <div className="max-w-md mx-auto text-center bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-6">Menu QR Code</h3>
          <p className="mb-6 text-gray-600">
            Place this QR code in your rental property so guests can easily access your menu.
          </p>

          {/* QR Code Display */}
          <div className="mb-6 border p-4 rounded-lg bg-gray-50 mx-auto" style={{ maxWidth: "280px" }} ref={qrRef}>
            {qrCodeDataURL && (
              <div>
                <div className="text-[#5e2bff] font-bold text-lg mb-2">Guestify Menu</div>
                <div className="mb-4 mx-auto" style={{ width: '200px', height: '200px', position: 'relative' }}>
                  <Image
                    src={qrCodeDataURL}
                    alt="QR Code"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {propertyName}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            {/* Print QR button */}
            <button
              onClick={handleDirectPrint}
              className="bg-white border border-[#5e2bff] text-[#5e2bff] px-4 py-2 rounded-full hover:bg-purple-50 transition-colors flex items-center justify-center"
            >
              <i className="fas fa-print mr-2"></i>
              Print Directly
            </button>

            {/* Download PDF button */}
            <button
              onClick={handlePrintQR}
              disabled={printingStatus === 'preparing'}
              className="bg-[#fad02f] text-black px-4 py-2 rounded-full hover:opacity-90 transition font-semibold flex items-center justify-center"
            >
              {printingStatus === 'preparing' ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Preparing PDF...
                </>
              ) : (
                <>
                  <i className="fas fa-file-pdf mr-2"></i>
                  Download PDF
                </>
              )}
            </button>
          </div>

          {/* Show download link if PDF is ready */}
          {printingStatus === 'ready' && downloadUrl && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 mb-2">PDF generated successfully!</p>
              <a 
                href={downloadUrl} 
                download="guestify-qrcode.pdf"
                className="text-[#5e2bff] hover:underline text-sm"
              >
                Click here to download if it didn't open automatically
              </a>
            </div>
          )}

          {/* Error message */}
          {printingStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                There was an error generating the PDF. Please try again.
              </p>
            </div>
          )}

          {/* URL display */}
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-1">
              Or share this URL with your guests:
            </p>
            <div className="flex items-center justify-center">
              <input
                type="text"
                value={menuUrl}
                readOnly
                className="w-full text-sm text-gray-700 border rounded-l px-3 py-2 bg-gray-50"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(menuUrl);
                  // Show a toast or some kind of feedback
                  alert('URL copied to clipboard!');
                }}
                className="bg-gray-200 px-3 py-2 rounded-r hover:bg-gray-300 transition-colors"
                title="Copy to clipboard"
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

PrintQR.getLayout = function getLayout(page) {
  return <Layout title="Print QR Code - Guestify">{page}</Layout>;
};