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
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, MapPin, FileText, Edit, ArrowLeft } from 'lucide-react'
import { formatDocument, formatPhone, formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Customer, OrderType } from '@/types/database'

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params.id as string
  const supabase = createClient()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<OrderType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalSpent, setTotalSpent] = useState(0)

  useEffect(() => {
    loadData()
  }, [customerId])

  async function loadData() {
    try {
      const [customerRes, ordersRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .is('deleted_at', null)
          .single(),
        supabase
          .from('orders')
          .select('*')
          .eq('customer_id', customerId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
      ])

      if (customerRes.error) throw customerRes.error
      if (ordersRes.error) throw ordersRes.error

      setCustomer(customerRes.data)
      setOrders(ordersRes.data || [])

      // Calculate total spent
      const total = (ordersRes.data || [])
        .filter((o: { status: string }) => o.status !== 'cancelado')
        .reduce((sum: number, o: { total: number | string }) => sum + Number(o.total), 0)
      setTotalSpent(total)
    } catch (error) {
      console.error('Error loading customer:', error)
      toast.error('Erro ao carregar dados do cliente')
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
        <Header title={customer.name} subtitle="Detalhes do cliente" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Customer Info Card */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{customer.name}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Link href={`/customers/${customerId}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <Link href="/customers">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customer.document && (
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Documento</p>
                        <p className="font-medium">{formatDocument(customer.document)}</p>
                      </div>
                    </div>
                  )}

                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <a href={`mailto:${customer.email}`} className="font-medium text-primary hover:underline">
                          {customer.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <a href={`tel:${customer.phone}`} className="font-medium text-primary hover:underline">
                          {formatPhone(customer.phone)}
                        </a>
                      </div>
                    </div>
                  )}

                  {customer.whatsapp && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">WhatsApp</p>
                        <a href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                          {formatPhone(customer.whatsapp)}
                        </a>
                      </div>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Endereço</p>
                        <p className="font-medium">
                          {customer.address}
                          {customer.city && `, ${customer.city}`}
                          {customer.state && ` - ${customer.state}`}
                          {customer.zip_code && ` ${customer.zip_code}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {customer.notes && (
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <p className="text-foreground">{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pedidos Concluídos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'entregue').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Table */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Histórico de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/50">
                        <TableHead>Número</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Nenhum pedido encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <TableRow key={order.id} className="border-b border-border/50">
                            <TableCell className="font-medium">
                              <Link href={`/orders/${order.id}`} className="text-primary hover:underline">
                                {order.number}
                              </Link>
                            </TableCell>
                            <TableCell>{formatDate(order.created_at)}</TableCell>
                            <TableCell>{formatCurrency(order.total)}</TableCell>
                            <TableCell>
                              <Badge className={`
                                ${order.status === 'recebido' && 'bg-blue-500/20 text-blue-400'}
                                ${order.status === 'em_processamento' && 'bg-yellow-500/20 text-yellow-400'}
                                ${order.status === 'faturado' && 'bg-purple-500/20 text-purple-400'}
                                ${order.status === 'entregue' && 'bg-green-500/20 text-green-400'}
                                ${order.status === 'cancelado' && 'bg-red-500/20 text-red-400'}
                              `}>
                                {order.status === 'recebido' && 'Recebido'}
                                {order.status === 'em_processamento' && 'Em Processamento'}
                                {order.status === 'faturado' && 'Faturado'}
                                {order.status === 'entregue' && 'Entregue'}
                                {order.status === 'cancelado' && 'Cancelado'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
