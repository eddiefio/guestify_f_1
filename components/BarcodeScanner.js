// components/BarcodeScanner.js
import { useState, useEffect, useRef } from 'react';

/**
 * Componente per la scansione dei codici a barre
 * 
 * @param {Object} props - Le props del componente
 * @param {function} props.onDetected - Callback chiamato quando un barcode viene rilevato
 * @param {boolean} props.isScanning - Se il componente deve iniziare la scansione
 * @param {function} props.onError - Callback chiamato in caso di errore
 */
export default function BarcodeScanner({ onDetected, isScanning, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  // Setup e cleanup dello scanner
  useEffect(() => {
    let animationFrameId = null;
    let videoTrack = null;

    const startScanner = async () => {
      try {
        // Richiedi l'accesso alla fotocamera
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' } // Preferisci la fotocamera posteriore
        });
        
        setStream(mediaStream);
        videoTrack = mediaStream.getVideoTracks()[0];
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          
          // Quando il video è caricato, inizia l'analisi dei frame
          videoRef.current.onloadedmetadata = () => {
            const scanFrame = () => {
              if (!isScanning || !videoRef.current || !canvasRef.current) return;
              
              const video = videoRef.current;
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              
              // Assicurati che canvas e video abbiano le stesse dimensioni
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              // Disegna il frame corrente sul canvas
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Prova a scansionare il frame (simuliamo qui)
              // In una implementazione reale useremmo una libreria come ZXing o QuaggaJS
              // per analizzare il frame e trovare il barcode
              
              // Poiché non possiamo integrare una vera libreria di scansione qui,
              // simuliamo un rilevamento dopo 3 secondi per scopi dimostrativi
              if (Math.random() < 0.01) { // ~1% di probabilità per frame
                // Genera un barcode casuale per la demo
                const mockBarcode = Math.floor(Math.random() * 10000000000000).toString();
                onDetected(mockBarcode);
                return; // Terminiamo il ciclo
              }
              
              // Continua ad analizzare i frame
              animationFrameId = requestAnimationFrame(scanFrame);
            };
            
            scanFrame();
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Please ensure you have granted camera permissions.');
        if (onError) onError(err);
      }
    };

    // Avvia o ferma lo scanner in base allo stato isScanning
    if (isScanning) {
      startScanner();
    } else {
      // Ferma la scansione e rilascia le risorse
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }

    // Cleanup quando il componente viene smontato
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isScanning, onDetected, onError]);

  return (
    <div className="relative w-full">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-2 text-sm">
          {error}
        </div>
      )}
      
      <div className="w-full bg-black relative rounded overflow-hidden" style={{ height: '240px' }}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-0"
        />
        
        {/* Overlay con mirino per guidare l'utente */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-white opacity-50 m-8 rounded"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
            Point camera at barcode
          </div>
        </div>
      </div>
      
      {/* Solo a scopo di demo, permettiamo input manuale */}
      <p className="text-xs text-gray-500 mt-2 text-center">
        If scanning doesn't work, please enter the barcode manually
      </p>
    </div>
  );
}