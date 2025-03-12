// components/BarcodeScanner.js - Soluzione definitiva
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Componente per la scansione di codici a barre utilizzando html5-qrcode
 * 
 * @param {Object} props - Le props del componente
 * @param {function} props.onDetected - Callback chiamato quando un barcode viene rilevato
 * @param {boolean} props.isScanning - Se il componente deve iniziare la scansione
 * @param {function} props.onError - Callback chiamato in caso di errore
 */
export default function BarcodeScanner({ onDetected, isScanning, onError }) {
  const [error, setError] = useState(null);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    let scanner = null;

    // Configurazione dello scanner senza riferimenti a formati specifici
    // che potrebbero non essere disponibili
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      // Non specifichiamo formatsToSupport per evitare l'errore
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true
    };

    const startScanner = async () => {
      try {
        // Assicuriamoci che il container sia vuoto prima di inizializzare
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          
          // Creiamo un elemento per lo scanner
          const scannerElement = document.createElement('div');
          scannerElement.id = 'html5qr-code-full-region';
          containerRef.current.appendChild(scannerElement);
          
          console.log('Inizializzazione dello scanner...');
          
          // Inizializziamo lo scanner
          scanner = new Html5Qrcode('html5qr-code-full-region');
          scannerRef.current = scanner;
          
          // Quando viene rilevato un codice
          const onScanSuccess = (decodedText, decodedResult) => {
            console.log(`Barcode detected: ${decodedText}`, decodedResult);
            
            // Fermiamo lo scanner e chiamiamo il callback
            if (scanner) {
              scanner.stop().then(() => {
                onDetected(decodedText);
              }).catch(err => {
                console.error('Error stopping scanner:', err);
              });
            }
          };
          
          // Quando si verifica un errore durante la scansione
          const onScanFailure = (error) => {
            // Non facciamo nulla, è normale avere errori quando non c'è un codice a barre nel frame
          };
          
          // Avviamo lo scanner usando la fotocamera
          await scanner.start(
            { facingMode: "environment" }, // Preferisci la fotocamera posteriore
            config,
            onScanSuccess,
            onScanFailure
          );
          
          setScannerReady(true);
          setError(null); // Resettiamo eventuali errori precedenti
        }
      } catch (err) {
        console.error('Error starting scanner:', err);
        setError(`Cannot access camera: ${err.message}. Please ensure your device has a camera and you've given permission to use it.`);
        if (onError) onError(err);
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current = null;
          
          // Puliamo il container
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        } catch (err) {
          console.error('Error stopping scanner:', err);
        }
      }
    };

    // Avvia o ferma lo scanner in base a isScanning
    if (isScanning) {
      startScanner();
    } else {
      stopScanner();
    }

    // Pulizia quando il componente viene smontato
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
        {!scannerReady && isScanning && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-2"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        {isScanning ? 'Point the camera at a barcode and hold it steady' : 'Press the Scan button to activate the camera'}
      </p>
    </div>
  );
}