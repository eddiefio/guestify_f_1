// components/BarcodeScanner.js
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Component for barcode scanning using html5-qrcode
 * 
 * @param {Object} props - Component props
 * @param {function} props.onDetected - Callback called when a barcode is detected
 * @param {boolean} props.isScanning - Whether the component should start scanning
 * @param {function} props.onError - Callback called on error
 */
export default function BarcodeScanner({ onDetected, isScanning, onError }) {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    let scanner = null;

    // Scanner configuration
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      formatsToSupport: [
        Html5Qrcode.FORMATS.EAN_13,  // Common format for commercial products
        Html5Qrcode.FORMATS.EAN_8,    // Short version of EAN
        Html5Qrcode.FORMATS.UPC_A,    // Universal product codes
        Html5Qrcode.FORMATS.UPC_E,    // Short version of UPC
        Html5Qrcode.FORMATS.CODE_39,  // Code 39, used in various sectors
        Html5Qrcode.FORMATS.CODE_93,  // Code 93
        Html5Qrcode.FORMATS.CODE_128  // Code 128, very versatile
      ],
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      // Add this to prevent using eval
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    };

    const startScanner = async () => {
      try {
        // Make sure the container is empty before initializing
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          
          // Create scanner element
          const scannerElement = document.createElement('div');
          scannerElement.id = 'html5qr-code-full-region';
          containerRef.current.appendChild(scannerElement);
          
          // Initialize scanner with CSP-friendly options
          scanner = new Html5Qrcode('html5qr-code-full-region', { formatsToSupport: config.formatsToSupport });
          scannerRef.current = scanner;
          
          // When a code is detected
          const onScanSuccess = (decodedText, decodedResult) => {
            console.log(`Barcode detected: ${decodedText}`, decodedResult);
            
            // Stop scanner and call callback
            if (scanner) {
              scanner.stop().then(() => {
                onDetected(decodedText);
              }).catch(err => {
                console.error('Error stopping scanner:', err);
              });
            }
          };
          
          // When scan fails
          const onScanFailure = (error) => {
            // Do nothing, it's normal to have errors when no barcode is in frame
            // console.warn(`Scan error: ${error}`);
          };
          
          // Start scanner using camera
          await scanner.start(
            { facingMode: "environment" }, // Prefer back camera
            config,
            onScanSuccess,
            onScanFailure
          );
        }
      } catch (err) {
        console.error('Error starting scanner:', err);
        setError(`Cannot access camera: ${err.message}`);
        if (onError) onError(err);
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current = null;
          
          // Clean container
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        } catch (err) {
          console.error('Error stopping scanner:', err);
        }
      }
    };

    // Start or stop scanner based on isScanning
    if (isScanning) {
      startScanner();
    } else {
      stopScanner();
    }

    // Cleanup when component unmounts
    return () => {
      stopScanner();
    };
  }, [isScanning, onDetected, onError]);

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-2 text-sm">
          {error}
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="w-full bg-black relative rounded overflow-hidden" 
        style={{ minHeight: '300px' }}
      >
        {/* Scanner content will be dynamically inserted here by the library */}
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Point the camera at a barcode and hold it steady
      </p>
    </div>
  );
}