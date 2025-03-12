// components/ButtonLayout.js
import Link from 'next/link';

/**
 * Componente per standardizzare il layout dei bottoni in tutta l'applicazione
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
        {loading ? loadingText : submitText}
      </button>
    </div>
  );
}