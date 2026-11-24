import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey)

// Os valores locais evitam falha durante o build. Nenhuma chamada é feita sem configuração.
export const supabase = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabaseAnonKey || 'chave-publicavel-pendente',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export function exigirSupabaseConfigurado() {
  if (!supabaseConfigurado) {
    throw new Error(
      'Configuração pendente: informe VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.',
    )
  }
}
