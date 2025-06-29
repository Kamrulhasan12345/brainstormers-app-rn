import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Use environment variables or fallback to demo values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// Create the actual Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to check if we're using demo mode
export const isDemoMode = () => {
  return supabaseUrl === 'https://demo.supabase.co' || supabaseAnonKey === 'demo-key';
};