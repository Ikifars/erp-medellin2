'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { StockMovement, Product } from '@/types/database'

const ITEMS_PER_PAGE = 20

interface MovementWithProduct extends StockMovement {
  product?: Product
}

export default function StockMovementsPage() {
  const supabase = createClient()
  const [movements, setMovements] = useState<MovementWithProduct[]>([])
  const [filteredMovements, setFilteredMovements] = useState<MovementWithProduct[]>([])
  const [products, setProducts] = useState<Map<string, Product>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterAndSortMovements()
  }, [movements, searchTerm, typeFilter, dateRange])

  async function loadData() {
    try {
      const [movementsRes, productsRes] = await Promise.all([
        supabase
          .from('stock_movements')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*')
          .is('deleted_at', null),
      ])

      if (movementsRes.error) throw movementsRes.error
      if (productsRes.error) throw productsRes.error

      setMovements(movementsRes.data || [])

      // CORREÇÃO AQUI: Tipagem do Map e do parâmetro 'p' para evitar o erro do Vercel build
      const productMap = new Map<string, Product>()
      productsRes.data?.forEach((p: Product) => {
        productMap.set(p.id, p)
      })
      setProducts(productMap)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Erro ao carregar movimentações')
    } finally {
      setisLoading(false)
    }
  }

  function filterAndSortMovements() {
    let filtered = movements.filter(m => {
      const product = products.get(m.product_id)
      const matchesSearch = product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reason?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === 'all' || m.type === typeFilter

      let matchesDate = true
      if (dateRange !== 'all') {
        const now = new Date()
        const movementDate = new Date(m.created_at)
        const dayDiff = Math.floor((now.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (dateRange) {
          case 'today':
            matchesDate = dayDiff === 0
            break
          case 'week':
            matchesDate = dayDiff <= 7
            break
          case 'month':
            matchesDate = dayDiff <= 30
            break
        }
      }

      return matchesSearch && matchesType && matchesDate
    })

    setFilteredMovements(filtered)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + ITEMS_PER_PAGE)

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
        <Header title="Movimentação de Estoque" subtitle="Histórico de entradas, saídas e ajustes" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Filters */}
            <Card className="glass-card p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por produto, SKU ou motivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Últimos 7 dias</SelectItem>
                    <SelectItem value="month">Últimos 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Movements Table */}
            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50">
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma movimentação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMovements.map((movement) => {
                        const product = products.get(movement.product_id)
                        return (
                          <TableRow key={movement.id} className="border-b border-border/50">
                            <TableCell className="text-sm">{formatDateTime(movement.created_at)}</TableCell>
                            <TableCell className="font-medium">{product?.name || 'Produto não encontrado'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{product?.sku || '-'}</TableCell>
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
                    Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredMovements.length)} de {filteredMovements.length}
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
