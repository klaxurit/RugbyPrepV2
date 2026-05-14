import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
const supabaseAnonKey =
  (
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
    ''
  ).trim()

if (import.meta.env.PROD) {
  if (!supabaseUrl) {
    throw new Error(
      '[config] VITE_SUPABASE_URL est obligatoire pour un build de production. Définis-la dans CI / hébergeur (.env.production ou secrets).',
    )
  }
  if (!supabaseAnonKey) {
    throw new Error(
      '[config] VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_KEY) est obligatoire pour un build de production.',
    )
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
