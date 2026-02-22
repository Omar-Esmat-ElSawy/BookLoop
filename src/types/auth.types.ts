
import { Session } from '@supabase/supabase-js';
import { User } from '@/types/database.types';

export interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string, 
    password: string, 
    username: string,
    phone_number?: string,
    latitude?: number,
    longitude?: number,
    location_city?: string
  ) => Promise<{ success?: boolean; error?: any }>;
  signIn: (email: string, password: string) => Promise<{ success?: boolean; error?: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateAvatar: (file: File) => Promise<string | null>;
}
