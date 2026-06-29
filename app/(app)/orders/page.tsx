'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Trash2, Edit, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { logAudit } from '@/lib/audit'
import type { OrderType, Customer } from '@/types/database'

const ITEMS_PER_PAGE = 10

interface OrderWithCustomer extends OrderType {
  customer?: Customer
}

export default function OrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<OrderWithCustomer[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderWithCustomer[]>([])
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterAndSortOrders()
  }, [orders, searchTerm, statusFilter, sortBy])

  async function loadData() {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('customers')
          .select('*')
          .is('deleted_at', null),
      ])

      if (ordersRes.error) throw ordersRes.error
      if (customersRes.error) throw customersRes.error

      setOrders(ordersRes.data || [])

      // Create customer map
      const customerMap = new Map()
      customersRes.data?.forEach(c => {
        customerMap.set(c.id, c)
      })
      setCustomers(customerMap)
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Erro ao carregar pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  function filterAndSortOrders() {
    let filtered = orders.filter(o => {
      const customer = o.customer_id ? customers.get(o.customer_id) : null
      const matchesSearch = o.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter

      return matchesSearch && matchesStatus
    })

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return Number(b.total) - Number(a.total)
      }
    })

    setFilteredOrders(filtered)
    setCurrentPage(1)
  }

  async function deleteOrder(id: string, number: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      await logAudit('delete', 'orders', id, { number }, null)
      setOrders(orders.filter(o => o.id !== id))
      toast.success('Pedido removido com sucesso')
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Erro ao remover pedido')
    }
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

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Pedidos" subtitle="Gerenciar pedidos e vendas" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Filters */}
            <Card className="glass-card p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="em_processamento">Em Processamento</SelectItem>
                    <SelectItem value="faturado">Faturado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Mais Recentes</SelectItem>
                    <SelectItem value="total">Maior Valor</SelectItem>
                  </SelectContent>
                </Select>

                <Link href="/orders/new">
                  <Button className="w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Pedido
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Orders Table */}
            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50">
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum pedido encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOrders.map((order) => {
                        const customer = order.customer_id ? customers.get(order.customer_id) : null
                        const statusKey = order.status as keyof typeof statusColors

                        return (
                          <TableRow key={order.id} className="border-b border-border/50">
                            <TableCell className="font-medium">{order.number}</TableCell>
                            <TableCell>{customer?.name || 'Cliente não encontrado'}</TableCell>
                            <TableCell>{formatDate(order.created_at)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[statusKey] || ''}>
                                {statusLabels[statusKey] || order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Link href={`/orders/${order.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Link href={`/orders/${order.id}/edit`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja remover o pedido &apos;{order.number}&apos;?
                                    </AlertDialogDescription>
                                    <div className="flex gap-2 justify-end">
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteOrder(order.id, order.number)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Remover
                                      </AlertDialogAction>
                                    </div>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)} de {filteredOrders.length}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
