// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndiqnzxplopcbcxzondp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXFuenhwbG9wY2JjeHpvbmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDkxODQsImV4cCI6MjA1NTEyNTE4NH0.jCnn7TFfGV1EpBHhO1ITa8PMytD7UJfADpuzrzZOgpw';

if (!supabaseKey) {
  console.warn('Missing Supabase key');
}

// Set global options to improve reliability
const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => {
      const fetchPromise = fetch(...args);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000);
      });
      return Promise.race([fetchPromise, timeoutPromise]);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, options);

// Debugging connection
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(`Supabase auth event: ${event}`, session ? 'with session' : 'no session');
  });
}

// Add retry logic for common operations
export const fetchWithRetry = async (operation, maxRetries = 3) => {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${retries + 1}/${maxRetries}):`, error);
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }

  // All retries failed
  console.error(`All ${maxRetries} retry attempts failed`, lastError);
  throw lastError;
};