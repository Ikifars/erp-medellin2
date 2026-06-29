import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/auth/callback']

export async function updateSession(request: NextRequest) {
  // 1. Criamos uma resposta inicial padrão
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return supabaseResponse
  }

  // 2. Instanciamos o cliente oficial do Supabase para SSR de forma correta.
  // Ele vai ler e atualizar os tokens e cookies criptografados dinamicamente.
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // 3. Pegamos a sessão atual com segurança através da API oficial do Supabase
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // 4. Se o usuário estiver logado e tentar acessar uma rota pública (como /login), 
  // nós já jogamos ele direto para o dashboard, poupando trabalho.
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 5. Se não estiver logado e tentar acessar o painel de administração, joga pro login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
