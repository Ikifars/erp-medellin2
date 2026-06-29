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
import { Badge } from '@/components/ui/badge'
import { Download, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { Product, Category } from '@/types/database'

export default function InventoryReportPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Map<string, Category>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [])

  async function loadReport() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('categories')
          .select('*')
          .is('deleted_at', null),
      ])

      if (productsRes.error) throw productsRes.error
      if (categoriesRes.error) throw categoriesRes.error

      setProducts(productsRes.data || [])

      const catMap = new Map<string, Category>()
      // Corrigido: Tipado explicitamente o parâmetro 'c' como 'Category' para não quebrar o build
      categoriesRes.data?.forEach((c: Category) => {
        catMap.set(c.id, c)
      })
      setCategories(catMap)
    } catch (error) {
      console.error('Error loading report:', error)
      toast.error('Erro ao carregar relatório')
    } finally {
      setIsLoading(false)
    }
  }

  function exportCSV() {
    const csvContent = [
      ['Nome', 'SKU', 'Categoria', 'Quantidade', 'Estoque Mínimo', 'Preço de Venda', 'Valor Total', 'Status'],
      ...products.map(p => [
        `"${p.name}"`,
        `"${p.sku || 'N/A'}"`,
        `"${categories.get(p.category_id || '')?.name || 'N/A'}"`,
        p.quantity,
        p.min_stock,
        p.sale_price,
        p.quantity * p.sale_price,
        p.quantity <= p.min_stock ? 'Baixo' : 'OK'
      ])
    ].map(row => row.join(',')).join('\n')

    // Adicionado \uFEFF para corrigir acentuação no Excel do Windows
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estoque_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.sale_price), 0)
  const lowStockProducts = products.filter(p => p.quantity <= p.min_stock)
  const outOfStockProducts = products.filter(p => p.quantity === 0)

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
        <Header title="Relatório de Estoque" subtitle="Análise de produtos em estoque" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Total de Produtos</div>
                <div className="text-2xl font-bold mt-1">{products.length}</div>
              </Card>
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Valor Total em Estoque</div>
                <div className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalValue)}</div>
              </Card>
              <Card className="glass-card p-4 border-warning/50">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Estoque Baixo
                </div>
                <div className="text-2xl font-bold text-warning mt-1">{lowStockProducts.length}</div>
              </Card>
              <Card className="glass-card p-4 border-destructive/50">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Sem Estoque
                </div>
                <div className="text-2xl font-bold text-destructive mt-1">{outOfStockProducts.length}</div>
              </Card>
            </div>

            {/* Products Table */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Produtos</CardTitle>
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
                        <TableHead>SKU</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Mínimo</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const isLowStock = product.quantity <= product.min_stock
                        const isOutOfStock = product.quantity === 0
                        const category = product.category_id ? categories.get(product.category_id) : null

                        return (
                          <TableRow key={product.id} className="border-b border-border/50">
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{product.sku}</TableCell>
                            <TableCell>{category?.name || '-'}</TableCell>
                            <TableCell className="text-right">{product.quantity}</TableCell>
                            <TableCell className="text-right">{product.min_stock}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.sale_price)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(product.quantity * product.sale_price)}</TableCell>
                            <TableCell>
                              {isOutOfStock ? (
                                <Badge className="bg-destructive/20 text-destructive-foreground">Sem Estoque</Badge>
                              ) : isLowStock ? (
                                <Badge className="bg-warning/20 text-warning-foreground">Baixo</Badge>
                              ) : (
                                <Badge className="bg-green-500/20 text-green-400">OK</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
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
