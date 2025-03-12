// components/BarcodeScanner.js - Versione migliorata
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
  const [devices, setDevices] = useState([]);
  const [hasCamera, setHasCamera] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  
  // Verifica se ci sono dispositivi di acquisizione disponibili
  useEffect(() => {
    async function checkCameraAvailability() {
      try {
        // Controlla se HTML5QrCode è disponibile (non in server-side)
        if (typeof Html5Qrcode === 'undefined') {
          console.log('Html5Qrcode non disponibile ancora, in attesa...');
          return;
        }
        
        console.log('Controllo disponibilità fotocamera...');
        
        // Controlla se navigator.mediaDevices è supportato
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          setHasCamera(false);
          throw new Error('Browser non supportato: mediaDevices API non disponibile');
        }

        // Ottieni la lista dei dispositivi
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        setDevices(videoDevices);
        setHasCamera(videoDevices.length > 0);
        
        if (videoDevices.length === 0) {
          throw new Error('Nessuna fotocamera rilevata sul dispositivo');
        }

        console.log(`Trovate ${videoDevices.length} fotocamere`);
        setScannerReady(true);
      } catch (err) {
        console.error('Errore durante il controllo della fotocamera:', err);
        setError(`Camera error: ${err.message || 'Impossibile accedere alla fotocamera'}`);
        if (onError) onError(err);
        setHasCamera(false);
      }
    }

    checkCameraAvailability();
  }, [onError]);
  
  // Gestisce l'inizializzazione e la pulizia dello scanner
  useEffect(() => {
    let scanner = null;
    let scannerInitialized = false;

    // Configurazione dello scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      formatsToSupport: [
        Html5Qrcode.FORMATS.EAN_13,  // Formato comune per prodotti commerciali
        Html5Qrcode.FORMATS.EAN_8,    // Versione corta dell'EAN
        Html5Qrcode.FORMATS.UPC_A,    // Codici universali per prodotti
        Html5Qrcode.FORMATS.UPC_E,    // Versione corta dell'UPC
        Html5Qrcode.FORMATS.CODE_39,  // Codice 39, usato in vari settori
        Html5Qrcode.FORMATS.CODE_93,  // Codice 93
        Html5Qrcode.FORMATS.CODE_128  // Codice 128, molto versatile
      ],
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true
    };

    const startScanner = async () => {
      // Non fare nulla se lo scanner non è pronto o la fotocamera non è disponibile
      if (!scannerReady || hasCamera === false) {
        console.log('Scanner non pronto o fotocamera non disponibile, non avvio la scansione');
        return;
      }
      
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
            // console.warn(`Scan error: ${error}`);
          };
          
          // Avviamo lo scanner usando la fotocamera
          await scanner.start(
            { facingMode: "environment" }, // Preferisci la fotocamera posteriore
            config,
            onScanSuccess,
            onScanFailure
          );
          
          scannerInitialized = true;
          setError(null); // Resettiamo eventuali errori precedenti
        }
      } catch (err) {
        console.error('Error starting scanner:', err);
        setError(`Cannot access camera: ${err.message}. Please ensure your device has a camera and you've given permission to use it.`);
        
        // Tentativo di fallback alla prima fotocamera disponibile
        if (devices.length > 0 && scanner) {
          try {
            console.log('Tentativo di fallback alla prima fotocamera disponibile...');
            await scanner.start(
              { deviceId: devices[0].deviceId }, 
              config,
              (decodedText, decodedResult) => {
                console.log(`Barcode detected (fallback): ${decodedText}`, decodedResult);
                if (scanner) {
                  scanner.stop().then(() => {
                    onDetected(decodedText);
                  }).catch(console.error);
                }
              },
              () => {}
            );
            scannerInitialized = true;
            setError(null);
          } catch (fallbackErr) {
            console.error('Fallback camera error:', fallbackErr);
            if (onError) onError(fallbackErr);
          }
        } else if (onError) {
          onError(err);
        }
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current && scannerInitialized) {
        try {
          await scannerRef.current.stop();
          scannerRef.current = null;
          scannerInitialized = false;
          
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
  }, [isScanning, onDetected, onError, scannerReady, hasCamera, devices]);

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-2 text-sm">
          {error}
        </div>
      )}
      
      {hasCamera === false && (
        <div className="bg-yellow-100 text-yellow-700 p-3 rounded mb-2 text-sm">
          No camera detected on your device. Please ensure you have a camera and have given permission to use it.
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="w-full bg-black relative rounded overflow-hidden" 
        style={{ minHeight: '300px' }}
      >
        {/* Il contenuto dello scanner verrà inserito qui dinamicamente dalla libreria */}
        {!scannerReady && hasCamera !== false && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-2"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        )}
        
        {hasCamera === false && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center p-4">
              <i className="fas fa-camera-slash text-4xl mb-3"></i>
              <p>Camera not available</p>
              <p className="text-sm opacity-70 mt-2">Please check your device and browser permissions</p>
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