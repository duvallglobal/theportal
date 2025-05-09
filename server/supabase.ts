import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase credentials. Real-time functionality will be limited.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

export default supabase;