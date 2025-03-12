// contexts/AuthContext.js - Versione corretta
import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();

  // Funzione per ottenere il profilo utente
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      console.log('fetchUserProfile: No userId provided');
      return null;
    }

    try {
      console.log('Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      console.log('Profile fetched successfully:', data?.id);
      return data;
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
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
        // Ottieni la sessione corrente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
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
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
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
            
            // Fetch user profile
            const profileData = await fetchUserProfile(session.user.id);
            if (isSubscribed) {
              setProfile(profileData);
            }
          } else {
            setUser(null);
            setProfile(null);
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
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      console.log('Signing in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful:', data.user?.id);
      
      if (data.user) {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      
      if (error) throw error;
      
      // Create profile entry with metadata
      if (data.user) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            ...metadata
          }
        ]);
        
        // Set user immediately after signup
        setUser(data.user);
        setProfile(metadata);
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
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
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
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local profile state
      setProfile(prev => ({ ...prev, ...updates }));
      
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