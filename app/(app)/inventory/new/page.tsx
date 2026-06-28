'use client'

import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { ProductForm } from '../components/product-form'

export default function NewProductPage() {
  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Novo Produto" subtitle="Criar um novo produto" />

        <main className="flex-1 p-6">
          <div className="max-w-2xl">
            <Card className="glass-card p-6">
              <ProductForm />
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
