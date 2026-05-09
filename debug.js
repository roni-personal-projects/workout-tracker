import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: users } = await supabase.auth.admin?.listUsers() || {};
  console.log('Admin listUsers may fail with anon key, skipping.');
  
  // Just query directly since RLS is enabled, wait, without user session we can't bypass RLS unless using Service Role Key.
  // BUT we don't have service role key.
}
check();
