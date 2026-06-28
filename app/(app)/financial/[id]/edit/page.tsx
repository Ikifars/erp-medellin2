'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { TransactionForm } from '../../components/transaction-form'
import { toast } from 'sonner'
import type { FinancialTransaction } from '@/types/database'

export default function EditTransactionPage() {
  const params = useParams()
  const transactionId = params.id as string
  const supabase = createClient()

  const [transaction, setTransaction] = useState<FinancialTransaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTransaction()
  }, [transactionId])

  async function loadTransaction() {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('id', transactionId)
        .is('deleted_at', null)
        .single()

      if (error) throw error
      setTransaction(data)
    } catch (error) {
      console.error('Error loading transaction:', error)
      toast.error('Erro ao carregar transação')
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

  if (!transaction) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Transação não encontrada</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Editar Transação" subtitle={`Editando: ${transaction.description}`} />

        <main className="flex-1 p-6">
          <div className="max-w-2xl">
            <Card className="glass-card p-6">
              <TransactionForm transactionId={transactionId} initialData={transaction} />
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
