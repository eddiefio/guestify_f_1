// contexts/AuthContext.js - Versione ottimizzata per prestazioni
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase, fetchWithRetry } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();

  // Funzione per ottenere il profilo utente con memoization
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      console.log('fetchUserProfile: No userId provided');
      return null;
    }

    try {
      console.log('Fetching user profile for:', userId);
      
      // Prima controlliamo se abbiamo questo profilo già memorizzato in localStorage
      if (typeof window !== 'undefined') {
        const cachedProfile = localStorage.getItem(`profile_${userId}`);
        if (cachedProfile) {
          try {
            const parsedProfile = JSON.parse(cachedProfile);
            console.log('Using cached profile data');
            
            // Aggiorniamo comunque in background
            fetchFromSupabase(userId).catch(console.error);
            
            return parsedProfile;
          } catch (e) {
            console.warn('Failed to parse cached profile:', e);
          }
        }
      }
      
      return await fetchFromSupabase(userId);
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
      return null;
    }
  }, []);
  
  // Funzione per ottenere il profilo da Supabase
  const fetchFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile from Supabase:', error);
        return null;
      }
      
      // Salva nel localStorage per accesso veloce la prossima volta
      if (typeof window !== 'undefined' && data) {
        localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
      }
      
      console.log('Profile fetched successfully from Supabase:', data?.id);
      return data;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    let authTimeout;

    // Funzione per inizializzare l'autenticazione
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth context...');
        
        // Prima controlliamo localStorage per sessioni salvate
        if (typeof window !== 'undefined') {
          const cachedSession = localStorage.getItem('auth_session');
          if (cachedSession) {
            try {
              const parsedSession = JSON.parse(cachedSession);
              if (parsedSession?.user && new Date(parsedSession.expires_at) > new Date()) {
                console.log('Using cached session');
                
                if (isSubscribed) {
                  setUser(parsedSession.user);
                  
                  // Carica il profilo dalla cache se possibile
                  const cachedProfile = localStorage.getItem(`profile_${parsedSession.user.id}`);
                  if (cachedProfile) {
                    setProfile(JSON.parse(cachedProfile));
                  }
                }
                
                // Continuiamo a verificare la sessione in background
                verifySessionWithServer();
              } else {
                // Sessione scaduta, rimuoviamo dal localStorage
                localStorage.removeItem('auth_session');
                verifySessionWithServer();
              }
            } catch (e) {
              console.warn('Failed to parse cached session:', e);
              verifySessionWithServer();
            }
          } else {
            verifySessionWithServer();
          }
        } else {
          verifySessionWithServer();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    
    // Verifica la sessione con il server
    const verifySessionWithServer = async () => {
      try {
        // Ottieni la sessione corrente
        const { data: { session }, error: sessionError } = await fetchWithRetry(
          () => supabase.auth.getSession()
        );
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (isSubscribed) {
            setLoading(false);
            setAuthInitialized(true);
          }
          return;
        }
        
        if (!isSubscribed) return;
        
        if (session?.user) {
          console.log('Found existing session for user:', session.user.id);
          
          // Salva la sessione in localStorage
          if (typeof window !== 'undefined' && session.expires_at) {
            localStorage.setItem('auth_session', JSON.stringify({
              user: session.user,
              expires_at: session.expires_at
            }));
          }
          
          setUser(session.user);
          
          // Fetch user profile
          const profileData = await fetchUserProfile(session.user.id);
          if (isSubscribed) {
            setProfile(profileData);
          }
        } else {
          console.log('No valid session found');
          if (isSubscribed) {
            setUser(null);
            setProfile(null);
            
            // Pulisci localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_session');
            }
          }
        }
        
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    // Imposta un listener per i cambiamenti di autenticazione
    const setupAuthListener = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          if (!isSubscribed) return;
          
          if (session?.user) {
            setUser(session.user);
            
            // Salva la sessione in localStorage
            if (typeof window !== 'undefined' && session.expires_at) {
              localStorage.setItem('auth_session', JSON.stringify({
                user: session.user,
                expires_at: session.expires_at
              }));
            }
            
            // Fetch user profile
            const profileData = await fetchUserProfile(session.user.id);
            if (isSubscribed) {
              setProfile(profileData);
            }
          } else {
            setUser(null);
            setProfile(null);
            
            // Pulisci localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_session');
            }
          }
          
          // Imposta loading a false solo se l'auth non è ancora stata inizializzata
          if (!authInitialized && isSubscribed) {
            setLoading(false);
            setAuthInitialized(true);
          }
        }
      );
      
      return subscription;
    };

    // Inizializza l'autenticazione e imposta il listener
    const setup = async () => {
      const subscription = await setupAuthListener();
      await initializeAuth();
      return subscription;
    };

    let subscription;
    setup().then(sub => {
      subscription = sub;
    });
    
    // Timeout di sicurezza per evitare caricamenti infiniti
    authTimeout = setTimeout(() => {
      if (isSubscribed && loading) {
        console.warn('Auth loading timed out, forcing completion after 5 seconds');
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 5000);

    return () => {
      isSubscribed = false;
      clearTimeout(authTimeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchUserProfile]);

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      console.log('Signing in user:', email);
      
      const { data, error } = await fetchWithRetry(() => 
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      );
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful:', data.user?.id);
      
      if (data.user) {
        // Salva la sessione in localStorage
        if (typeof window !== 'undefined' && data.session?.expires_at) {
          localStorage.setItem('auth_session', JSON.stringify({
            user: data.user,
            expires_at: data.session.expires_at
          }));
        }
        
        setUser(data.user);
        
        // Get profile
        const profileData = await fetchUserProfile(data.user.id);
        setProfile(profileData);
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error in signIn function:', error);
      return { user: null, error };
    }
  };

  // Sign up new user
  const signUp = async (email, password, metadata) => {
    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase.auth.signUp({
          email,
          password,
          options: { data: metadata }
        })
      );
      
      if (error) throw error;
      
      // Crea un nuovo profilo in Supabase
      if (data.user) {
        await fetchWithRetry(() => 
          supabase.from('profiles').insert([
            {
              id: data.user.id,
              ...metadata
            }
          ])
        );
        
        // Salva la sessione in localStorage
        if (typeof window !== 'undefined' && data.session?.expires_at) {
          localStorage.setItem('auth_session', JSON.stringify({
            user: data.user,
            expires_at: data.session.expires_at
          }));
          
          // Salva anche il profilo
          localStorage.setItem(`profile_${data.user.id}`, JSON.stringify({
            id: data.user.id,
            ...metadata
          }));
        }
        
        // Set user immediately after signup
        setUser(data.user);
        setProfile({
          id: data.user.id,
          ...metadata
        });
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      
      // Pulisci localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_session');
        // Rimuovi tutti i profili in cache
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('profile_')) {
            localStorage.removeItem(key);
          }
        }
      }
      
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })
      );
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase.auth.updateUser({
          password: newPassword
        })
      );
      
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) {
      return { profile: null, error: new Error('User not authenticated') };
    }
    
    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
      );
      
      if (error) throw error;
      
      // Update local profile state
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      
      // Update localStorage cache
      if (typeof window !== 'undefined') {
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile));
      }
      
      return { profile: data, error: null };
    } catch (error) {
      return { profile: null, error };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    profile,
    loading,
    authInitialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);