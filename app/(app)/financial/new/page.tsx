'use client'

import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { TransactionForm } from '../components/transaction-form'

export default function NewTransactionPage() {
  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Nova Transação" subtitle="Registrar uma nova transação financeira" />

        <main className="flex-1 p-6">
          <div className="max-w-2xl">
            <Card className="glass-card p-6">
              <TransactionForm />
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
