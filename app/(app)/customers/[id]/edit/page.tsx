'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { CustomerForm } from '../../components/customer-form'
import { toast } from 'sonner'
import type { Customer } from '@/types/database'

export default function EditCustomerPage() {
  const params = useParams()
  const customerId = params.id as string
  const supabase = createClient()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCustomer()
  }, [customerId])

  async function loadCustomer() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .is('deleted_at', null)
        .single()

      if (error) throw error
      setCustomer(data)
    } catch (error) {
      console.error('Error loading customer:', error)
      toast.error('Erro ao carregar cliente')
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

  if (!customer) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Cliente não encontrado</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Editar Cliente" subtitle={`Editando: ${customer.name}`} />

        <main className="flex-1 p-6">
          <div className="max-w-2xl">
            <Card className="glass-card p-6">
              <CustomerForm customerId={customerId} initialData={customer} />
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
