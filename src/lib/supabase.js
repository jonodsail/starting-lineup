import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Absent in local preview builds. Every caller must tolerate a null client and
// fall back to bundled data rather than assuming a database is reachable.
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export const isSupabaseConfigured = Boolean(supabase)

export async function currentUserId() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data?.user?.id ?? null
}
