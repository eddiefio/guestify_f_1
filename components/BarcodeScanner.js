// components/BarcodeScanner.js - Versione stabile senza cicli
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Componente scanner di codici a barre semplificato e stabile
 */
export default function BarcodeScanner({ onDetected, isScanning, onError }) {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const mountedRef = useRef(true);
  const scanAttemptedRef = useRef(false);
  
  // Al montaggio, configuriamo il riferimento "mounted"
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Effetto principale per gestire lo scanner
  useEffect(() => {
    // Se non stiamo scansionando, non facciamo nulla
    if (!isScanning) {
      return;
    }
    
    // Non riproviamo se abbiamo già fatto un tentativo
    if (scanAttemptedRef.current) {
      return;
    }
    
    console.log('Initializing scanner...');
    scanAttemptedRef.current = true;
    
    // Configurazione minimale
    const config = {
      fps: 5,  // Riduciamo il framerate per migliori prestazioni
      qrbox: 250
    };
    
    let scanner = null;
    
    // Funzione di pulizia
    const cleanup = () => {
      if (scanner) {
        console.log('Stopping scanner...');
        scanner.stop().catch(err => console.warn('Error stopping scanner:', err));
        scanner = null;
      }
      scannerRef.current = null;
    };
    
    // Prepara il container
    const prepareContainer = () => {
      if (!containerRef.current) return false;
      
      // Pulisce il container
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      
      // Crea un nuovo elemento per lo scanner
      const scannerElement = document.createElement('div');
      scannerElement.id = 'html5-qrcode-element';
      containerRef.current.appendChild(scannerElement);
      
      return true;
    };
    
    // Inizializza lo scanner
    const initScanner = async () => {
      try {
        if (!prepareContainer()) {
          console.error('Container not ready');
          return;
        }
        
        // Crea una nuova istanza dello scanner
        scanner = new Html5Qrcode('html5-qrcode-element');
        scannerRef.current = scanner;
        
        // Avvia lo scanner con poche opzioni per massima compatibilità
        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            console.log('Barcode detected:', decodedText);
            if (onDetected && mountedRef.current) {
              // Stop scanner first
              scanner.stop().then(() => {
                scannerRef.current = null;
                scanner = null;
                
                // Call callback with the result
                onDetected(decodedText);
              }).catch(err => {
                console.warn('Error stopping scanner after detection:', err);
                if (mountedRef.current) {
                  onDetected(decodedText);
                }
              });
            }
          },
          () => {} // Ignoriamo gli errori di scansione
        );
        
        if (mountedRef.current) {
          setError(null);
        }
      } catch (err) {
        console.error('Error initializing scanner:', err);
        if (mountedRef.current) {
          setError(`Camera error: ${err.message || 'Cannot access camera'}`);
          if (onError) onError(err);
        }
      }
    };
    
    // Inizializziamo lo scanner
    initScanner();
    
    // Pulizia quando cambia isScanning o al dismount
    return () => {
      cleanup();
      // Resettiamo il flag solo quando cambia isScanning
      if (!isScanning) {
        scanAttemptedRef.current = false;
      }
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
        {isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
            <div className="z-10 bg-black bg-opacity-50 p-2 rounded">
              <p>Scanning...</p>
            </div>
          </div>
        )}
        
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p>Press Scan to start camera</p>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        {isScanning ? 'Point the camera at a barcode' : 'Press the Scan button to activate the camera'}
      </p>
    </div>
  );
}