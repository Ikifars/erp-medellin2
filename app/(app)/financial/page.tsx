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
import type { FinancialTransaction } from '@/types/database'

const ITEMS_PER_PAGE = 15

const categoryLabels = {
  vendas: 'Vendas',
  recebimentos: 'Recebimentos',
  fornecedores: 'Fornecedores',
  salarios: 'Salários',
  impostos: 'Impostos',
  operacionais: 'Operacionais',
  marketing: 'Marketing',
  infraestrutura: 'Infraestrutura',
  equipamentos: 'Equipamentos',
}

export default function FinancialPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    filterAndSortTransactions()
  }, [transactions, searchTerm, typeFilter, statusFilter])

  async function loadTransactions() {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .is('deleted_at', null)
        .order('transaction_date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Erro ao carregar transações')
    } finally {
      setIsLoading(false)
    }
  }

  function filterAndSortTransactions() {
    let filtered = transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'all' || t.type === typeFilter
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })

    setFilteredTransactions(filtered)
    setCurrentPage(1)
  }

  async function deleteTransaction(id: string, description: string) {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      await logAudit('delete', 'financial_transactions', id, { description }, null)
      setTransactions(transactions.filter(t => t.id !== id))
      toast.success('Transação removida com sucesso')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Erro ao remover transação')
    }
  }

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Calculate totals
  const entradas = filteredTransactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + Number(t.amount), 0)
  const saidas = filteredTransactions.filter(t => t.type === 'saida').reduce((sum, t) => sum + Number(t.amount), 0)
  const balance = entradas - saidas

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
        <Header title="Financeiro" subtitle="Gerenciar transações financeiras" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Entradas</div>
                <div className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(entradas)}</div>
              </Card>
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Saídas</div>
                <div className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(saidas)}</div>
              </Card>
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Saldo</div>
                <div className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(balance)}
                </div>
              </Card>
            </div>

            {/* Filters */}
            <Card className="glass-card p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição..."
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
                    <SelectItem value="investimento">Investimento</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Link href="/financial/new">
                  <Button className="w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Transação
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Transactions Table */}
            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50">
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma transação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="border-b border-border/50">
                          <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell>
                            <Badge className={`
                              ${transaction.type === 'entrada' && 'bg-green-500/20 text-green-400'}
                              ${transaction.type === 'saida' && 'bg-red-500/20 text-red-400'}
                              ${transaction.type === 'investimento' && 'bg-blue-500/20 text-blue-400'}
                            `}>
                              {transaction.type === 'entrada' && 'Entrada'}
                              {transaction.type === 'saida' && 'Saída'}
                              {transaction.type === 'investimento' && 'Investimento'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{categoryLabels[transaction.category as keyof typeof categoryLabels]}</TableCell>
                          <TableCell className={`text-right font-medium ${
                            transaction.type === 'entrada' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.type === 'entrada' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`
                              ${transaction.status === 'pendente' && 'bg-yellow-500/20 text-yellow-400'}
                              ${transaction.status === 'pago' && 'bg-green-500/20 text-green-400'}
                              ${transaction.status === 'cancelado' && 'bg-red-500/20 text-red-400'}
                            `}>
                              {transaction.status === 'pendente' && 'Pendente'}
                              {transaction.status === 'pago' && 'Pago'}
                              {transaction.status === 'cancelado' && 'Cancelado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/financial/${transaction.id}/edit`}>
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
                                    Tem certeza que deseja remover a transação &apos;{transaction.description}&apos;?
                                  </AlertDialogDescription>
                                  <div className="flex gap-2 justify-end">
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteTransaction(transaction.id, transaction.description)}
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredTransactions.length)} de {filteredTransactions.length}
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
