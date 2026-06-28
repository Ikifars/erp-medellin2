'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Edit, ArrowLeft } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { logAudit } from '@/lib/audit'
import type { OrderType, OrderItem, Customer, FinancialTransaction } from '@/types/database'

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const supabase = createClient()

  const [order, setOrder] = useState<OrderType | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [orderId])

  async function loadData() {
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

      const orderData = orderRes.data
      setOrder(orderData)
      setOrderItems(itemsRes.data || [])

      // Load customer
      if (orderData?.customer_id) {
        const { data: custData, error: custError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', orderData.customer_id)
          .single()

        if (!custError) {
          setCustomer(custData)
        }
      }
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Erro ao carregar pedido')
    } finally {
      setIsLoading(false)
    }
  }

  async function updateOrderStatus(newStatus: OrderType['status']) {
    if (!order) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      // If status is faturado, create financial transaction
      if (newStatus === 'faturado') {
        const { error: transError } = await supabase
          .from('financial_transactions')
          .insert({
            type: 'entrada',
            category: 'vendas',
            description: `Venda ${order.number}`,
            amount: order.total,
            reference_id: orderId,
            reference_type: 'order',
            transaction_date: new Date().toISOString().split('T')[0],
            status: 'pago',
          })

        if (transError) throw transError

        // Update stock for each item if they have product_id
        for (const item of orderItems) {
          if (item.product_id) {
            const { data: product, error: prodError } = await supabase
              .from('products')
              .select('quantity')
              .eq('id', item.product_id)
              .single()

            if (!prodError && product) {
              const newQty = product.quantity - item.quantity
              await supabase
                .from('products')
                .update({ quantity: Math.max(0, newQty) })
                .eq('id', item.product_id)

              // Create stock movement
              await supabase
                .from('stock_movements')
                .insert({
                  product_id: item.product_id,
                  type: 'saida',
                  quantity: item.quantity,
                  reason: `Venda ${order.number}`,
                })
            }
          }
        }
      }

      await logAudit('update', 'orders', orderId, { status: order.status }, { status: newStatus })
      setOrder({ ...order, status: newStatus })
      toast.success('Status do pedido atualizado com sucesso')
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Erro ao atualizar pedido')
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

  const statusLabels = {
    recebido: 'Recebido',
    em_processamento: 'Em Processamento',
    faturado: 'Faturado',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
  }

  const statusColors = {
    recebido: 'bg-blue-500/20 text-blue-400',
    em_processamento: 'bg-yellow-500/20 text-yellow-400',
    faturado: 'bg-purple-500/20 text-purple-400',
    entregue: 'bg-green-500/20 text-green-400',
    cancelado: 'bg-red-500/20 text-red-400',
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title={order.number} subtitle="Detalhes do pedido" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Order Header */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{order.number}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/orders/${orderId}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <Link href="/orders">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {customer && (
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <Link href={`/customers/${customer.id}`} className="font-medium text-primary hover:underline">
                        {customer.name}
                      </Link>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Status</p>
                    <Select value={order.status} onValueChange={updateOrderStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recebido">Recebido</SelectItem>
                        <SelectItem value="em_processamento">Em Processamento</SelectItem>
                        <SelectItem value="faturado">Faturado</SelectItem>
                        <SelectItem value="entregue">Entregue</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(order.total)}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <p className="text-foreground">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Itens do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/50">
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id} className="border-b border-border/50">
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Desconto:</span>
                      <span className="text-destructive">-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-border/50 pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
