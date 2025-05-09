import { createClient } from '@supabase/supabase-js';

// For client-side, we need to use the VITE_ prefix for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback values for development environment
const fallbackUrl = 'https://your-project.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Using fallback values for development.');
  console.warn('For production, make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey
);

export default supabase;