
import { Book } from "@/types/database.types";
import supabase from "@/lib/supabase";

// Interface for search operations
export interface SearchFactory {
  search(query: string): Promise<Book[]>;
}

// Base search data needed for any search type
export interface SearchData {
  query: string;
}

// Title search factory implementation
export class TitleSearchFactory implements SearchFactory {
  async search(query: string): Promise<Book[]> {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching books by title:', error);
      return [];
    }
  }
}

// Author search factory implementation
export class AuthorSearchFactory implements SearchFactory {
  async search(query: string): Promise<Book[]> {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .ilike('author', `%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching books by author:', error);
      return [];
    }
  }
}

// Genre search factory implementation
export class GenreSearchFactory implements SearchFactory {
  async search(query: string): Promise<Book[]> {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('genre', query)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching books by genre:', error);
      return [];
    }
  }
}

// Owner search factory implementation
export class OwnerSearchFactory implements SearchFactory {
  async search(query: string): Promise<Book[]> {
    try {
      // First find users matching the query
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .ilike('username', `%${query}%`);
      
      if (userError) throw userError;
      
      if (!users || users.length === 0) {
        return [];
      }
      
      // Then find books owned by those users
      const userIds = users.map(user => user.id);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .in('owner_id', userIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching books by owner:', error);
      return [];
    }
  }
}

// Combined search factory implementation
export class CombinedSearchFactory implements SearchFactory {
  async search(query: string): Promise<Book[]> {
    try {
      if (!query || query.trim() === '') return [];
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error performing combined search:', error);
      return [];
    }
  }
}

// Factory method to get the appropriate search factory
export function getSearchFactory(type: 'title' | 'author' | 'genre' | 'owner' | 'combined' = 'combined'): SearchFactory {
  switch (type) {
    case 'title':
      return new TitleSearchFactory();
    case 'author':
      return new AuthorSearchFactory();
    case 'genre':
      return new GenreSearchFactory();
    case 'owner':
      return new OwnerSearchFactory();
    case 'combined':
      return new CombinedSearchFactory();
    default:
      return new CombinedSearchFactory();
  }
}
