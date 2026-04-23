import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
 import { showToast } from '@/lib/i18nToast';
 import { toast } from 'sonner';
 import { useTranslation } from 'react-i18next';
 import { UserX, LogOut, MessageSquare } from 'lucide-react';
 import { Button } from '@/components/ui/button';

 const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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
       showToast.success(t('toasts.loggedOutSuccess'));
      navigate('/login');
    } catch (error: any) {
      console.error('Error signing out:', error);
      // If session is already missing, just clear local state
      if (error.message?.includes('Auth session missing') || error.name === 'AuthSessionMissingError') {
        setUser(null);
        setSession(null);
        navigate('/login');
      } else {
         if (error?.message) showToast.errorMessage(error.message);
         else showToast.error(t('toasts.errorOccurred'));
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
      toast.error(error.message || t('toasts.errorUpdatingProfile'));
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
      toast.error(error.message || t('toasts.errorUploadingAvatar'));
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

  const isSupportRoute = location.pathname.startsWith('/support');

  return (
    <AuthContext.Provider value={value}>
      {user?.is_suspended && !isSupportRoute ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-card border rounded-xl shadow-2xl p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <UserX className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {t('admin.userSuspendedTitle')}
              </h1>
              <p className="text-muted-foreground">
                {t('admin.userSuspendedDesc')}
              </p>
            </div>
            <div className="pt-4 flex items-center gap-3">
              <Button 
                variant="default" 
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => navigate('/support')}
              >
                <MessageSquare className="h-4 w-4" />
                {t('support.title')}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 flex items-center justify-center gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
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
