import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

function createSupabaseBrowserClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null
  }

  try {
    return createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  } catch {
    return null
  }
}

export const supabaseClient = createSupabaseBrowserClient()

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient
}

export function isSupabaseAuthConfigured(): boolean {
  return supabaseClient !== null
}
