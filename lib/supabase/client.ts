import { createBrowserClient } from '@supabase/ssr'

// Variável mantida fora escopo para armazenar a instância única no navegador
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Se já existir uma instância criada no navegador, apenas retorna ela
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Se não existir, cria a primeira e única instância
  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return supabaseInstance
}
