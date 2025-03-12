// contexts/UserContext.js
import React, { createContext, useState, useEffect } from 'react';

// Creiamo il contesto per l'utente
export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Simuliamo il recupero dati utente (in un caso reale usa fetch o axios)
    const fetchUser = async () => {
      try {
        // Esempio: chiamata all'API per recuperare l'utente
        const res = await fetch('/api/user');
        if (!res.ok) throw new Error('Errore nel recupero dei dati utente');
        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error(error);
        // Puoi gestire l'errore, ad esempio impostando un utente di default
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
};
