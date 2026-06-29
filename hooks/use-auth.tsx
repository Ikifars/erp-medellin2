'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/database'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
}

type Permission = 'dashboard' | 'orders' | 'orders_create' | 'orders_edit' | 'orders_delete' | 'financial' | 'financial_create' | 'financial_edit' | 'customers' | 'customers_create' | 'customers_edit' | 'customers_delete' | 'inventory' | 'inventory_create' | 'inventory_edit' | 'reports' | 'users' | 'users_edit'

const rolePermissions: Record<string, Permission[]> = {
  admin: [
    'dashboard', 'orders', 'orders_create', 'orders_edit', 'orders_delete',
    'financial', 'financial_create', 'financial_edit',
    'customers', 'customers_create', 'customers_edit', 'customers_delete',
    'inventory', 'inventory_create', 'inventory_edit',
    'reports', 'users', 'users_edit'
  ],
  gerente: [
    'dashboard', 'orders', 'orders_create', 'orders_edit', 'orders_delete',
    'financial', 'financial_create', 'financial_edit',
    'customers', 'customers_create', 'customers_edit', 'customers_delete',
    'inventory', 'inventory_create', 'inventory_edit',
    'reports'
  ],
  operador: [
    'dashboard', 'orders', 'orders_create', 'orders_edit',
    'customers', 'customers_create', 'customers_edit',
    'inventory'
  ],
  visualizador: [
    'dashboard', 'orders', 'customers', 'inventory', 'reports'
  ]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ✅ CORREÇÃO 1: Instanciado fora do componente para virar um Singleton global.
// Isso evita a criação de múltiplas instâncias do GoTrueClient a cada re-render,
// matando de vez o loop infinito de requisições e limpando o aviso do console.
const supabase = createClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setProfile(null)
        
        // Só redireciona se o usuário de fato não estiver na página de login
        if (!window.location.pathname.includes('login')) {
          router.push('/login')
        }
      } else if (event === 'SIGNED_IN' && session.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
        
        // ✅ CORREÇÃO 2: Verificação de rota mais resiliente usando .includes().
        // Garante o redirecionamento mesmo se a URL da Vercel vier com barras extras ou queries.
        // Só joga para o dashboard se o usuário estiver na tela de login ou na raiz.
        const noLogin = window.location.pathname.includes('login')
        const naRaiz = window.location.pathname === '/'

        if (noLogin || naRaiz) {
          router.push('/dashboard')
        }
      } else if (event === 'TOKEN_REFRESHED' && session.user) {
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/login')
  }

  const hasPermission = (permission: Permission): boolean => {
    if (!profile) return false
    if (profile.status === 'inativo') return false
    const permissions = rolePermissions[profile.role] || []
    return permissions.includes(permission)
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut, refreshProfile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
