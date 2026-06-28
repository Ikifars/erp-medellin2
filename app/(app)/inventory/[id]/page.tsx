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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Edit, Plus, AlertTriangle, ArrowLeft, Barcode } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { StockMovementForm } from '../components/stock-movement-form'
import type { Product, Category, StockMovement } from '@/types/database'

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const supabase = createClient()

  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [productId])

  async function loadData() {
    try {
      const [productRes, movementsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .is('deleted_at', null)
          .single(),
        supabase
          .from('stock_movements')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false }),
      ])

      if (productRes.error) throw productRes.error
      if (movementsRes.error) throw movementsRes.error

      const productData = productRes.data
      setProduct(productData)
      setMovements(movementsRes.data || [])

      // Load category if exists
      if (productData?.category_id) {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', productData.category_id)
          .single()

        if (!catError) {
          setCategory(catData)
        }
      }
    } catch (error) {
      console.error('Error loading product:', error)
      toast.error('Erro ao carregar produto')
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

  if (!product) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Produto não encontrado</div>
        </div>
      </AppLayout>
    )
  }

  const isLowStock = product.quantity <= product.min_stock
  const stockValue = product.quantity * product.sale_price
  const profitMargin = ((product.sale_price - product.cost_price) / product.sale_price) * 100

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title={product.name} subtitle={`SKU: ${product.sku}`} />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Product Info */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{product.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Barcode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{product.sku}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/inventory/${productId}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <Link href="/inventory">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {product.description && (
                  <div className="pb-4 border-b border-border/50">
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="text-foreground mt-1">{product.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category && (
                    <div>
                      <p className="text-sm text-muted-foreground">Categoria</p>
                      <p className="font-medium">{category.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                    <p className="font-medium text-green-400">{profitMargin.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Quantidade em Estoque</span>
                    {isLowStock && <AlertTriangle className="w-4 h-4 text-warning" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{product.quantity}</div>
                  <p className="text-xs text-muted-foreground mt-1">Mínimo: {product.min_stock}</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Preço de Custo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(product.cost_price)}</div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Preço de Venda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(product.sale_price)}</div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Valor Total em Estoque</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stockValue)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Stock Movements */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Movimentação de Estoque</CardTitle>
                <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Movimento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Registrar Movimento de Estoque</DialogTitle>
                      <DialogDescription>Entrada, saída ou ajuste de estoque</DialogDescription>
                    </DialogHeader>
                    <StockMovementForm
                      productId={productId}
                      onSuccess={() => {
                        setIsMovementDialogOpen(false)
                        loadData()
                      }}
                      onCancel={() => setIsMovementDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/50">
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Nenhum movimento registrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        movements.map((movement) => (
                          <TableRow key={movement.id} className="border-b border-border/50">
                            <TableCell>{formatDate(movement.created_at)}</TableCell>
                            <TableCell>
                              <Badge className={`
                                ${movement.type === 'entrada' && 'bg-green-500/20 text-green-400'}
                                ${movement.type === 'saida' && 'bg-red-500/20 text-red-400'}
                                ${movement.type === 'ajuste' && 'bg-yellow-500/20 text-yellow-400'}
                              `}>
                                {movement.type === 'entrada' && 'Entrada'}
                                {movement.type === 'saida' && 'Saída'}
                                {movement.type === 'ajuste' && 'Ajuste'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {movement.type === 'saida' ? '-' : '+'}{movement.quantity}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {movement.reason || '-'}
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
