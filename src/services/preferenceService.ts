import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type UserPreference = Database['public']['Tables']['user_preferences']['Row'];
export type UserPreferenceUpdate = Database['public']['Tables']['user_preferences']['Update'];

export const preferenceService = {
  async getPreferences(userId: string): Promise<UserPreference | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user preferences:", error);
      return null;
    }

    return data;
  },

  async updatePreferences(userId: string, updates: UserPreferenceUpdate): Promise<UserPreference | null> {
    // Try to update first
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ 
        user_id: userId, 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating user preferences:", error);
      return null;
    }

    return data;
  },

  async addLikedBook(userId: string, bookId: string): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    const likedBooks = prefs?.liked_books || [];
    
    if (likedBooks.includes(bookId)) return true;

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        liked_books: [...likedBooks, bookId],
        updated_at: new Date().toISOString()
      });

    return !error;
  },

  async addFavoriteGenre(userId: string, genre: string): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    const favoriteGenres = prefs?.favorite_genres || [];
    
    if (favoriteGenres.includes(genre)) return true;

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        favorite_genres: [...favoriteGenres, genre],
        updated_at: new Date().toISOString()
      });

    return !error;
  }
};
