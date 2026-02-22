
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Singleton class for managing Supabase database connection
 * This ensures only one connection is created throughout the application
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private supabaseClient: SupabaseClient;
  
  // Supabase configuration
  private supabaseUrl = 'https://ykckvpobcwwzowiyhjwx.supabase.co';
  private supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrY2t2cG9iY3d3em93aXloand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwOTI3MzMsImV4cCI6MjA2MTY2ODczM30._vvJIDPRsY2TlHJ2sYO7nh702fF1sGEnssRHR-YJB9g';
  
  /**
   * Private constructor to prevent creating instances with 'new'
   */
  private constructor() {
    console.log('DatabaseManager: Initializing Supabase connection');
    this.supabaseClient = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'book-loop-auth',
      },
    });
  }
  
  /**
   * Get the singleton instance of DatabaseManager
   * Creates the instance if it doesn't exist
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }
  
  /**
   * Get the Supabase client instance
   */
  public getClient(): SupabaseClient {
    return this.supabaseClient;
  }
  
  /**
   * Reset the connection (useful for testing)
   */
  public static resetInstance(): void {
    DatabaseManager.instance = undefined as unknown as DatabaseManager;
  }
}

// Export a convenient method to get the Supabase client directly
export const getSupabaseClient = (): SupabaseClient => {
  return DatabaseManager.getInstance().getClient();
};
