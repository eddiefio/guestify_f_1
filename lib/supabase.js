// lib/supabase.js - Versione migliorata
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndiqnzxplopcbcxzondp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXFuenhwbG9wY2JjeHpvbmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDkxODQsImV4cCI6MjA1NTEyNTE4NH0.jCnn7TFfGV1EpBHhO1ITa8PMytD7UJfADpuzrzZOgpw';

if (!supabaseKey) {
  console.warn('Missing Supabase key');
}

// Set global options to improve reliability
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth-token', // Specifichiamo esplicitamente la chiave di storage
  },
  global: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
    fetch: (...args) => {
      // Timeout personalizzato per le richieste fetch
      const fetchPromise = fetch(...args);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 10000); // 10 secondi
      });
      return Promise.race([fetchPromise, timeoutPromise]);
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, options);

// Aggiunge event listeners per debug
if (typeof window !== 'undefined') {
  // Monitora gli eventi di autenticazione
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(`Supabase auth event: ${event}`, session ? `Session ID: ${session.user?.id}` : 'No session');
  });
  
  // Simula una richiesta di ping per verificare la connessione all'avvio
  setTimeout(() => {
    supabase.from('profiles').select('count', { count: 'exact', head: true }).then(() => {
      console.log('Supabase connection test: success');
    }).catch(err => {
      console.error('Supabase connection test: failed', err);
    });
  }, 2000);
}

// Funzione di utilità per gestire i tentativi di ripetizione
export const fetchWithRetry = async (operation, maxRetries = 3, delayMs = 1000) => {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${retries + 1}/${maxRetries}):`, error);
      
      // Exponential backoff
      const delay = delayMs * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }

  // All retries failed
  console.error(`All ${maxRetries} retry attempts failed`, lastError);
  throw lastError;
};

// Funzioni wrapper per operazioni comuni con retry automatico
export const supabaseWithRetry = {
  // Auth operations
  auth: {
    ...supabase.auth,
    getSession: () => fetchWithRetry(() => supabase.auth.getSession()),
    signInWithPassword: (credentials) => fetchWithRetry(() => supabase.auth.signInWithPassword(credentials)),
    signUp: (credentials) => fetchWithRetry(() => supabase.auth.signUp(credentials))
  },
  
  // Database operations
  from: (table) => {
    const originalFrom = supabase.from(table);
    
    return {
      ...originalFrom,
      select: (...args) => {
        const query = originalFrom.select(...args);
        
        // Aggiungiamo metodi che possono beneficiare di retry
        const enhancedQuery = {
          ...query,
          single: () => fetchWithRetry(() => query.single()),
          maybeSingle: () => fetchWithRetry(() => query.maybeSingle())
        };
        
        return enhancedQuery;
      },
      insert: (...args) => fetchWithRetry(() => originalFrom.insert(...args)),
      update: (...args) => fetchWithRetry(() => originalFrom.update(...args)),
      delete: (...args) => fetchWithRetry(() => originalFrom.delete(...args))
    };
  }
};

// Esporta sia il client originale che quello con retry
export default supabase;