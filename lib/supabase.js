// lib/supabase.js - Versione corretta per gestione sessioni
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndiqnzxplopcbcxzondp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXFuenhwbG9wY2JjeHpvbmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDkxODQsImV4cCI6MjA1NTEyNTE4NH0.jCnn7TFfGV1EpBHhO1ITa8PMytD7UJfADpuzrzZOgpw';

// Set global options for better session handling
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth', // Chiave usata per memorizzare la sessione
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') {
          return null; // Return null on the server side
        }
        return JSON.parse(window.localStorage.getItem(key));
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    },
    // Imposta i cookie per essere accessibili anche dalle API
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    }
  },
  global: {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, options);

// Esporta una funzione per creare un client server-side
export const createServerClient = (req, res) => {
  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      ...options,
      global: {
        ...options.global,
        headers: {
          ...options.global.headers,
          cookie: req.headers.cookie || '',
        },
      },
    }
  );
};

// Aggiungi event listeners per debug
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(`Auth state changed: ${event}`, session ? `User: ${session.user?.id}` : 'No session');
    // Salva il token nei cookie per le API
    if (session) {
      const expires = new Date(session.expires_at * 1000);
      document.cookie = `supabase-access-token=${session.access_token}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `supabase-user=${JSON.stringify(session.user)}; path=/; expires=${expires.toUTCString()}`;
    } else {
      document.cookie = 'supabase-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'supabase-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  });
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
      
      const delay = delayMs * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }

  throw lastError;
};

export default supabase;