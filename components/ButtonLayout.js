// components/ButtonLayout.js - Versione migliorata
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * Componente migliorato per standardizzare il layout dei bottoni in tutta l'applicazione
 * 
 * @param {Object} props - Le props del componente
 * @param {string} props.cancelHref - Il link per il bottone Cancel
 * @param {string} props.cancelText - Il testo del bottone Cancel (default: "Cancel")
 * @param {string} props.submitText - Il testo del bottone di submit (default: "Save")
 * @param {boolean} props.loading - Se mostrare lo stato di caricamento (default: false)
 * @param {string} props.loadingText - Il testo durante il caricamento (default: "Saving...")
 * @param {boolean} props.danger - Se il bottone di submit è un'azione pericolosa (default: false)
 * @param {function} props.onCancel - Handler opzionale per il click su Cancel
 * @param {string} props.customCancelClass - Classe CSS opzionale per il bottone Cancel
 * @param {string} props.customSubmitClass - Classe CSS opzionale per il bottone Submit
 */
export default function ButtonLayout({
  cancelHref,
  cancelText = "Cancel",
  submitText = "Save",
  loading = false,
  loadingText = "Saving...",
  danger = false,
  onCancel,
  customCancelClass = "",
  customSubmitClass = ""
}) {
  const [isStuck, setIsStuck] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const router = useRouter();
  
  // Gestione del timeout per evitare blocchi infiniti nel loading state
  useEffect(() => {
    let timer;
    
    if (loading) {
      timer = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          
          // Dopo 10 secondi, consideriamo il loading "bloccato"
          if (newTime >= 10 && !isStuck) {
            setIsStuck(true);
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      setTimeElapsed(0);
      setIsStuck(false);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading, isStuck]);
  
  // Se il caricamento è bloccato, mostriamo un messaggio e opzioni aggiuntive
  const renderLoadingHelp = () => {
    if (!isStuck) return null;
    
    return (
      <div className="text-xs text-red-500 mt-2">
        <p>Richiesta bloccata. Puoi:</p>
        <div className="flex space-x-4 mt-1">
          <button 
            type="button"
            onClick={() => {
              if (cancelHref) {
                router.push(cancelHref);
              } else if (onCancel) {
                onCancel();
              } else {
                router.back();
              }
            }}
            className="text-blue-500 underline"
          >
            Annulla
          </button>
          <button 
            type="button"
            onClick={() => {
              // Ricarica la pagina
              window.location.reload();
            }}
            className="text-blue-500 underline"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  };

  // Classe base per il bottone Cancel
  const cancelButtonClass = `
    px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 
    transition cursor-pointer ${customCancelClass}
  `;
  
  // Classe base per il bottone Submit, dipende se è pericoloso o no
  const submitButtonClass = danger 
    ? `px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 
       transition cursor-pointer ${customSubmitClass}`
    : `px-4 py-2 bg-[#fad02f] text-black rounded hover:opacity-90 
       transition font-semibold ${customSubmitClass}`;

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center pt-4">
        {/* Bottone Cancel */}
        {cancelHref ? (
          <Link href={cancelHref}>
            <span className={cancelButtonClass}>
              {cancelText}
            </span>
          </Link>
        ) : (
          <button 
            type="button" 
            onClick={onCancel} 
            className={cancelButtonClass}
          >
            {cancelText}
          </button>
        )}
        
        {/* Bottone Submit */}
        <button
          type="submit"
          disabled={loading}
          className={submitButtonClass}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {loadingText} ({timeElapsed}s)
            </span>
          ) : (
            submitText
          )}
        </button>
      </div>
      
      {/* Help per loading bloccato */}
      {renderLoadingHelp()}
    </div>
  );
}