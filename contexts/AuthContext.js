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
              } else {
                // Sessione scaduta, rimuoviamo dal localStorage
                console.log('Cached session expired, removing');
                localStorage.removeItem('auth_session');
              }
            } catch (e) {
              console.warn('Failed to parse cached session:', e);
              localStorage.removeItem('auth_session');
            }
          }
        }
        
        // Always verify the session with server, but don't wait for completion
        await verifySessionWithServer();
        
        if (isSubscribed) {
          // Delay authInitialized until session verification is complete
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    
// contexts/AuthContext.js - Just the function that needs to be updated

const verifySessionWithServer = async () => {
  try {
    // Get current session with retry
    const { data: { session }, error: sessionError } = await fetchWithRetry(
      () => supabase.auth.getSession(),
      3,  // Max retries
      1000 // Delay between retries
    );
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      if (isSubscribed) {
        setLoading(false);
        return;
      }
    }
    
    if (!isSubscribed) return;
    
    if (session?.user) {
      // Check if session is expired
      if (session.expires_at && new Date(session.expires_at) <= new Date()) {
        console.log('Session expired, refreshing token');
        try {
          // Try to refresh the token instead of immediately signing out
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession(session);
          
          if (refreshError || !refreshData.session) {
            console.log('Token refresh failed, signing out');
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            
            // Clear localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_session');
            }
          } else {
            // Successfully refreshed the token
            console.log('Token refreshed successfully');
            const refreshedSession = refreshData.session;
            
            if (typeof window !== 'undefined' && refreshedSession.expires_at) {
              localStorage.setItem('auth_session', JSON.stringify({
                user: refreshedSession.user,
                expires_at: refreshedSession.expires_at
              }));
            }
            
            setUser(refreshedSession.user);
            
            // Update session cookies to help middleware
            document.cookie = `supabase-auth=true; path=/; max-age=86400; SameSite=Lax`;
            
            // Fetch user profile
            const profileData = await fetchUserProfile(refreshedSession.user.id);
            if (isSubscribed) {
              setProfile(profileData);
            }
          }
        } catch (refreshErr) {
          console.error('Error during token refresh:', refreshErr);
          // Fall back to signout
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
        }
      } else {
        console.log('Found valid session for user:', session.user.id);
        
        // Save session to localStorage
        if (typeof window !== 'undefined' && session.expires_at) {
          localStorage.setItem('auth_session', JSON.stringify({
            user: session.user,
            expires_at: session.expires_at
          }));
          
          // Set a long-lived cookie for middleware
          document.cookie = `supabase-auth=true; path=/; max-age=86400; SameSite=Lax`;
        }
        
        setUser(session.user);
        
        // Fetch user profile
        const profileData = await fetchUserProfile(session.user.id);
        if (isSubscribed) {
          setProfile(profileData);
        }
      }
    } else {
      console.log('No valid session found');
      if (isSubscribed) {
        setUser(null);
        setProfile(null);
        
        // Clear localStorage and cookies
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_session');
          document.cookie = 'supabase-auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
      }
    }
    
    if (isSubscribed) {
      setLoading(false);
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    if (isSubscribed) {
      setLoading(false);
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
        console.warn('Auth loading timed out, forcing completion after 10 seconds');
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 10000); // Increase from 5 to 10 seconds

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
        // Improve error message for email confirmation
        if (error.message.includes('Email not confirmed')) {
          return { 
            user: null, 
            error: { 
              ...error, 
              message: 'Please check your email and confirm your account before signing in.' 
            } 
          };
        }
        
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful:', data.user?.id);
      
      if (data.user) {
        // Salva la sessione in localStorage
        if (typeof window !== 'undefined' && data.session?.expires_at) {
          // Set a temporary cookie to indicate recent login
          document.cookie = `recent-signin=true; path=/; max-age=60; SameSite=Lax`;
          localStorage.setItem('auth_session', JSON.stringify({
            user: data.user,
            expires_at: data.session.expires_at
          }));
          
          // Mark as verified
          sessionStorage.setItem('auth_verified', 'true');
        }
        
        setUser(data.user);
        
        // Get profile - but don't block returning the result
        fetchUserProfile(data.user.id).then(profileData => {
          setProfile(profileData);
        });
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error in signIn function:', error);
      return { user: null, error };
    }
  };

  // Rest of the AuthContext.js remains the same...
  
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
        sessionStorage.removeItem('auth_verified');
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