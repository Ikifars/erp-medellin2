'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { OrderForm } from '../../components/order-form'
import { toast } from 'sonner'
import type { OrderType, OrderItem } from '@/types/database'

interface OrderWithItems extends OrderType {
  order_items?: OrderItem[]
}

export default function EditOrderPage() {
  const params = useParams()
  const orderId = params.id as string
  const supabase = createClient()

  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [orderId])

  async function loadOrder() {
    try {
      const [orderRes, itemsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .is('deleted_at', null)
          .single(),
        supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId),
      ])

      if (orderRes.error) throw orderRes.error
      if (itemsRes.error) throw itemsRes.error

      setOrder({
        ...orderRes.data,
        order_items: itemsRes.data || [],
      })
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Erro ao carregar pedido')
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

  if (!order) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Pedido não encontrado</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Editar Pedido" subtitle={`Editando: ${order.number}`} />

        <main className="flex-1 p-6">
          <div className="max-w-4xl">
            <Card className="glass-card p-6">
              <OrderForm orderId={orderId} initialData={order} />
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
