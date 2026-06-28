'use client'

import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { CustomerForm } from '../components/customer-form'

export default function NewCustomerPage() {
  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Novo Cliente" subtitle="Criar um novo cliente" />

        <main className="flex-1 p-6">
          <div className="max-w-2xl">
            <Card className="glass-card p-6">
              <CustomerForm />
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
