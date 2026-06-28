'use client'

import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { OrderForm } from '../components/order-form'

export default function NewOrderPage() {
  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Novo Pedido" subtitle="Criar um novo pedido" />

        <main className="flex-1 p-6">
          <div className="max-w-4xl">
            <Card className="glass-card p-6">
              <OrderForm />
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
