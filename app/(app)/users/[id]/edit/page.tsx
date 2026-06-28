'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { UserForm } from '../../components/user-form'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

export default function EditUserPage() {
  const params = useParams()
  const userId = params.id as string
  const supabase = createClient()

  const [user, setUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [userId])

  async function loadUser() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .is('deleted_at', null)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error loading user:', error)
      toast.error('Erro ao carregar usuário')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Usuário não encontrado</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Editar Usuário" subtitle={`Editando: ${user.name}`} />

        <main className="flex-1 p-6">
          <div className="max-w-2xl">
            <Card className="glass-card p-6">
              <UserForm userId={userId} initialData={user} />
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
