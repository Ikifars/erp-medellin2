'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { OrderType, OrderItem, Product } from '@/types/database'

export default function SalesReportPage() {
  const supabase = createClient()
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [orders, setOrders] = useState<OrderType[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<Map<string, Product>>(new Map())
  const [isLoading, setIsLoading] = useState(false)

  async function loadReport() {
    if (!startDate || !endDate) {
      toast.error('Selecione as datas')
      return
    }

    setIsLoading(true)
    try {
      const [ordersRes, itemsRes, productsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .is('deleted_at', null)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .eq('status', 'faturado'),
        supabase
          .from('order_items')
          .select('*'),
        supabase
          .from('products')
          .select('*')
          .is('deleted_at', null),
      ])

      if (ordersRes.error) throw ordersRes.error
      if (itemsRes.error) throw itemsRes.error
      if (productsRes.error) throw productsRes.error

      setOrders(ordersRes.data || [])
      setOrderItems(itemsRes.data || [])

      const prodMap = new Map()
      productsRes.data?.forEach(p => {
        prodMap.set(p.id, p)
      })
      setProducts(prodMap)
    } catch (error) {
      console.error('Error loading report:', error)
      toast.error('Erro ao carregar relatório')
    } finally {
      setIsLoading(false)
    }
  }

  function exportCSV() {
    const data = orders.map(order => ({
      'Número do Pedido': order.number,
      'Data': formatDate(order.created_at),
      'Total': formatCurrency(order.total),
    }))

    const csv = [
      ['Número do Pedido', 'Data', 'Total'],
      ...data.map(d => [d['Número do Pedido'], d['Data'], d['Total']])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendas_${startDate}_${endDate}.csv`
    a.click()
  }

  const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0)
  const totalOrders = orders.length
  const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0

  // Group by product
  const productSales: Record<string, { quantity: number; total: number }> = {}
  orderItems.forEach(item => {
    const orderId = item.order_id
    const order = orders.find(o => o.id === orderId)
    if (order) {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { quantity: 0, total: 0 }
      }
      productSales[item.product_name].quantity += item.quantity
      productSales[item.product_name].total += item.total
    }
  })

  const productArray = Object.entries(productSales).sort((a, b) => b[1].total - a[1].total)

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Relatório de Vendas" subtitle="Análise de vendas por período" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Filters */}
            <Card className="glass-card p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground block mb-2">Data Inicial</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground block mb-2">Data Final</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button onClick={loadReport} disabled={isLoading}>
                  {isLoading ? 'Carregando...' : 'Gerar Relatório'}
                </Button>
              </div>
            </Card>

            {/* Summary */}
            {orders.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="glass-card p-4">
                    <div className="text-sm text-muted-foreground">Total de Vendas</div>
                    <div className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalSales)}</div>
                  </Card>
                  <Card className="glass-card p-4">
                    <div className="text-sm text-muted-foreground">Quantidade de Pedidos</div>
                    <div className="text-2xl font-bold mt-1">{totalOrders}</div>
                  </Card>
                  <Card className="glass-card p-4">
                    <div className="text-sm text-muted-foreground">Ticket Médio</div>
                    <div className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(averageOrder)}</div>
                  </Card>
                </div>

                {/* Products Table */}
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Produtos Vendidos</CardTitle>
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
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Quantidade</TableHead>
                            <TableHead className="text-right">Total Vendido</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productArray.map(([name, data]) => (
                            <TableRow key={name} className="border-b border-border/50">
                              <TableCell className="font-medium">{name}</TableCell>
                              <TableCell className="text-right">{data.quantity}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(data.total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
