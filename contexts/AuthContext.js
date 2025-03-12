// contexts/AuthContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Funzione per ottenere il profilo utente
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Setup auth state listener
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.id);
    
    // Aggiungi questa riga per evitare aggiornamenti inutili
    if (event === 'INITIAL_SESSION') return;
    
    if (session?.user) {
      setUser(session.user);
      
      // Fetch user profile from profiles table
      const profileData = await fetchUserProfile(session.user.id);
      setProfile(profileData);
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  }
);

   // Get initial session
const initializeAuth = async () => {
  // Aggiungi questa riga all'inizio della funzione
  if (loading === false) return; // Previene chiamate ripetute
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('Found existing session for user:', session.user.id);
      setUser(session.user);
      
      // Fetch user profile
      const profileData = await fetchUserProfile(session.user.id);
      setProfile(profileData);
    } else {
      console.log('No session found');
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  } finally {
    setLoading(false);
  }
};

    initializeAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

 // Sign in with email and password
const signIn = async (email, password) => {
  try {
    console.log('Signing in user:', email);
    
    // Non fare signOut prima di signIn
    
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