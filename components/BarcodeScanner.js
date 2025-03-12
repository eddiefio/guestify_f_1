// components/BarcodeScanner.js - Gestione DOM corretta
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Componente per la scansione di codici a barre con gestione robusta del DOM
 */
export default function BarcodeScanner({ onDetected, isScanning, onError }) {
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const scannerElementId = 'qr-reader-' + Math.random().toString(36).substring(7);

  // Gestione dello scanner
  useEffect(() => {
    let scanner = null;
    let mounted = true;

    const createScanner = async () => {
      if (!isScanning || !mounted) return;

      try {
        console.log('Inizializzazione dello scanner...');
        
        // Verifica e prepara il container
        if (!containerRef.current) {
          console.error('Container not found');
          return;
        }
        
        // Crea un nuovo div per lo scanner se non esiste
        let scannerElement = document.getElementById(scannerElementId);
        if (!scannerElement) {
          scannerElement = document.createElement('div');
          scannerElement.id = scannerElementId;
          containerRef.current.appendChild(scannerElement);
        }
        
        // Configurazione minima
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 }
        };

        // Creiamo l'istanza dello scanner
        scanner = new Html5Qrcode(scannerElementId);
        scannerRef.current = scanner;

        // Avvia lo scanner
        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            console.log(`Codice rilevato: ${decodedText}`);
            if (mounted && onDetected) {
              safeStopScanner().then(() => {
                onDetected(decodedText);
              });
            }
          },
          () => {}  // Non gestire gli errori di scansione
        );
        
        if (mounted) {
          setError(null);
          setInitialized(true);
        }
        
      } catch (err) {
        console.error('Errore di inizializzazione scanner:', err);
        if (mounted) {
          setError(`Camera error: ${err.message || 'Unknown error'}`);
          if (onError) onError(err);
        }
      }
    };
    
    // Funzione sicura per fermare lo scanner
    const safeStopScanner = async () => {
      if (!scannerRef.current) return;
      
      try {
        console.log('Stopping scanner safely...');
        // Verifica se lo scanner è attivo prima di fermarlo
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('Error while stopping scanner:', err);
      } finally {
        scannerRef.current = null;
        setInitialized(false);
      }
    };

    // Gestisci l'avvio e lo stop dello scanner
    if (isScanning && !initialized) {
      createScanner();
    } else if (!isScanning && initialized) {
      safeStopScanner();
    }

    // Pulizia al dismount
    return () => {
      mounted = false;
      safeStopScanner();
      
      // Rimuovi manualmente l'elemento se esistente
      setTimeout(() => {
        try {
          const element = document.getElementById(scannerElementId);
          if (element && element.parentNode) {
            element.parentNode.removeChild(element);
          }
        } catch (e) {
          console.warn('Error cleaning up scanner element:', e);
        }
      }, 100);
    };
  }, [isScanning, onDetected, onError, initialized]);

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
        {isScanning && !initialized && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-2"></div>
              <p>Preparing camera...</p>
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