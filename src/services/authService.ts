
import { toast } from 'sonner';
import supabase from '@/lib/supabase';
import { User } from '@/types/database.types';

export const fetchUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data as User;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const signUp = async (
  email: string, 
  password: string, 
  username: string,
  phone_number?: string,
  latitude?: number,
  longitude?: number,
  location_city?: string
) => {
  try {
    // Check if username already exists
    const { data: existingUser, error: usernameError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    
    if (usernameError) throw usernameError;
    if (existingUser) {
      return { error: { message: 'Username already taken' } };
    }
    
    // Create auth user with email confirmation redirect
    // Additional user data is passed in metadata and will be automatically inserted by database trigger
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username,
          phone_number: phone_number,
          latitude: latitude,
          longitude: longitude,
          location_city: location_city,
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Signup failed');

    return { success: true };
    
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      return { success: true };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return { error };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email: string, redirectUrl: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return { error };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return { error };
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    
    toast.success('Profile updated successfully');
    return true;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    toast.error(error.message || 'Error updating profile');
    return false;
  }
};

export const updateUserAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    console.log("Starting avatar upload for user:", userId);
    
    // Create a unique file name for the avatar
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Upload the file to the user-content bucket
    console.log("Uploading file to path:", filePath);
    const { error: uploadError, data } = await supabase.storage
      .from('user-content')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }
    
    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('user-content')
      .getPublicUrl(filePath);
    
    const avatarUrl = publicUrlData.publicUrl;
    console.log("Avatar URL:", avatarUrl);
    
    // Update the user's avatar_url in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    toast.success('Profile picture updated successfully');
    return avatarUrl;
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    toast.error(error.message || 'Error uploading avatar');
    return null;
  }
};
