
import { getSupabaseClient } from './DatabaseManager';

// Get the Supabase client from our singleton DatabaseManager
const supabase = getSupabaseClient();

export default supabase;
