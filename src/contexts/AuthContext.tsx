
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';
import { User } from '@/types/database.types';
import { AuthContextProps } from '@/types/auth.types';
import { 
  fetchUserProfile, 
  signUp as apiSignUp, 
  signIn as apiSignIn, 
  signOut as apiSignOut,
  updateUserProfile,
  updateUserAvatar
} from '@/services/authService';

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // Only update state synchronously here
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer fetching user profile with setTimeout to prevent potential deadlocks
          setTimeout(async () => {
            const userData = await fetchUserProfile(currentSession.user.id);
            setUser(userData);
          }, 0);
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          const userData = await fetchUserProfile(initialSession.user.id);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignUp = async (
    email: string, 
    password: string, 
    username: string,
    phone_number?: string,
    latitude?: number,
    longitude?: number,
    location_city?: string
  ) => {
    setLoading(true);
    const result = await apiSignUp(email, password, username, phone_number, latitude, longitude, location_city);
    setLoading(false);
    return result;
  };

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await apiSignIn(email, password);
    setLoading(false);
    return result;
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await apiSignOut();
      setUser(null);
      setSession(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Error signing out:', error);
      // If session is already missing, just clear local state
      if (error.message?.includes('Auth session missing') || error.name === 'AuthSessionMissingError') {
        setUser(null);
        setSession(null);
        navigate('/login');
      } else {
        toast.error(error.message || 'Error signing out');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('User not logged in');
      
      const success = await updateUserProfile(user.id, updates);
      if (success) {
        setUser({ ...user, ...updates });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error updating profile');
    }
  };

  const handleUpdateAvatar = async (file: File): Promise<string | null> => {
    try {
      if (!user) throw new Error('User not logged in');
      
      const avatarUrl = await updateUserAvatar(user.id, file);
      
      if (avatarUrl) {
        await handleUpdateProfile({ avatar_url: avatarUrl });
      }
      
      return avatarUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Error uploading avatar');
      return null;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    updateAvatar: handleUpdateAvatar
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
