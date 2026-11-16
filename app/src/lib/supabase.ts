import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) throw new Error('Mancano VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in app/.env.local')

// La chiave anon è pubblica per progetto: i permessi li fanno le policy RLS.
export const supabase = createClient(url, key)
