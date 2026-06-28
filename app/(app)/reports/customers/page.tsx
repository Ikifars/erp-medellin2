'use client'

import { useEffect, useState } from 'react'
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
import { Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { Customer, OrderType } from '@/types/database'

interface CustomerStats {
  customer: Customer
  totalSpent: number
  orderCount: number
}

export default function CustomersReportPage() {
  const supabase = createClient()
  const [customerStats, setCustomerStats] = useState<CustomerStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [])

  async function loadReport() {
    try {
      const [customersRes, ordersRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('orders')
          .select('*')
          .is('deleted_at', null),
      ])

      if (customersRes.error) throw customersRes.error
      if (ordersRes.error) throw ordersRes.error

      const customers = customersRes.data || []
      const orders = ordersRes.data || []

      const stats = customers.map(customer => {
        const customerOrders = orders.filter(o => o.customer_id === customer.id && o.status !== 'cancelado')
        const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.total), 0)

        return {
          customer,
          totalSpent,
          orderCount: customerOrders.length,
        }
      }).sort((a, b) => b.totalSpent - a.totalSpent)

      setCustomerStats(stats)
    } catch (error) {
      console.error('Error loading report:', error)
      toast.error('Erro ao carregar relatório')
    } finally {
      setIsLoading(false)
    }
  }

  function exportCSV() {
    const csv = [
      ['Nome', 'Email', 'Telefone', 'Total Gasto', 'Número de Pedidos', 'Ticket Médio'],
      ...customerStats.map(stat => [
        stat.customer.name,
        stat.customer.email || 'N/A',
        stat.customer.phone || 'N/A',
        stat.totalSpent,
        stat.orderCount,
        stat.orderCount > 0 ? stat.totalSpent / stat.orderCount : 0
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const totalCustomers = customerStats.length
  const totalRevenue = customerStats.reduce((sum, s) => sum + s.totalSpent, 0)
  const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
  const topCustomer = customerStats[0]

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
        <Header title="Relatório de Clientes" subtitle="Análise de clientes e compras" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Total de Clientes</div>
                <div className="text-2xl font-bold mt-1">{totalCustomers}</div>
              </Card>
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Receita Total</div>
                <div className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalRevenue)}</div>
              </Card>
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Gasto Médio por Cliente</div>
                <div className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(averageSpent)}</div>
              </Card>
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Melhor Cliente</div>
                <div className="text-xl font-bold mt-1 truncate">{topCustomer?.customer.name || '-'}</div>
                <div className="text-sm text-muted-foreground">{formatCurrency(topCustomer?.totalSpent || 0)}</div>
              </Card>
            </div>

            {/* Customers Table */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Clientes</CardTitle>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/50">
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="text-right">Total Gasto</TableHead>
                        <TableHead className="text-right">Nº de Pedidos</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerStats.map((stat) => (
                        <TableRow key={stat.customer.id} className="border-b border-border/50">
                          <TableCell className="font-medium">{stat.customer.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{stat.customer.email || '-'}</TableCell>
                          <TableCell className="text-sm">{stat.customer.phone || '-'}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(stat.totalSpent)}</TableCell>
                          <TableCell className="text-right">{stat.orderCount}</TableCell>
                          <TableCell className="text-right">
                            {stat.orderCount > 0 ? formatCurrency(stat.totalSpent / stat.orderCount) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
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
