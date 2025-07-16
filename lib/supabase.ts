import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database-new';

// Use environment variables or fallback to demo values
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// Helper function to check if we're using demo mode
export const isDemoMode = () => {
  return (
    supabaseUrl === 'https://demo.supabase.co' || supabaseAnonKey === 'demo-key'
  );
};

// Log configuration status (helpful for debugging)
if (isDemoMode()) {
  console.log(
    '⚠️  Running in demo mode. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables for production use.'
  );
} else {
  console.log('✅ Using configured Supabase instance');
}

// Create the actual Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
