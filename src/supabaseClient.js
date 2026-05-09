import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const supabase = isValidUrl(SUPABASE_URL) && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : { auth: { onAuthStateChange: () => ({ data: { subscription: null } }), getSession: async () => ({ data: { session: null } }) } };
