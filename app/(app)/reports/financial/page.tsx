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
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { FinancialTransaction } from '@/types/database'

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

export default function FinancialReportPage() {
  const supabase = createClient()
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  async function loadReport() {
    if (!startDate || !endDate) {
      toast.error('Selecione as datas')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .is('deleted_at', null)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date')

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading report:', error)
      toast.error('Erro ao carregar relatório')
    } finally {
      setIsLoading(false)
    }
  }

  function exportCSV() {
    const csv = [
      ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor', 'Status'],
      ...transactions.map(t => [
        t.transaction_date,
        t.description,
        t.type,
        categoryLabels[t.category as keyof typeof categoryLabels],
        t.amount,
        t.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financeiro_${startDate}_${endDate}.csv`
    a.click()
  }

  const entradas = transactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + Number(t.amount), 0)
  const saidas = transactions.filter(t => t.type === 'saida').reduce((sum, t) => sum + Number(t.amount), 0)
  const investimentos = transactions.filter(t => t.type === 'investimento').reduce((sum, t) => sum + Number(t.amount), 0)
  const balance = entradas - saidas

  // Category breakdown
  const categoryData: Record<string, number> = {}
  transactions.forEach(t => {
    const cat = categoryLabels[t.category as keyof typeof categoryLabels]
    if (!categoryData[cat]) {
      categoryData[cat] = 0
    }
    if (t.type === 'saida') {
      categoryData[cat] -= Number(t.amount)
    } else {
      categoryData[cat] += Number(t.amount)
    }
  })

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Relatório Financeiro" subtitle="Análise financeira por período" />

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
            {transactions.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="glass-card p-4">
                    <div className="text-sm text-muted-foreground">Entradas</div>
                    <div className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(entradas)}</div>
                  </Card>
                  <Card className="glass-card p-4">
                    <div className="text-sm text-muted-foreground">Saídas</div>
                    <div className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(saidas)}</div>
                  </Card>
                  <Card className="glass-card p-4">
                    <div className="text-sm text-muted-foreground">Investimentos</div>
                    <div className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(investimentos)}</div>
                  </Card>
                  <Card className="glass-card p-4">
                    <div className="text-sm text-muted-foreground">Saldo</div>
                    <div className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(balance)}
                    </div>
                  </Card>
                </div>

                {/* Category Breakdown */}
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Resumo por Categoria</CardTitle>
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
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(categoryData).map(([cat, value]) => (
                            <TableRow key={cat} className="border-b border-border/50">
                              <TableCell className="font-medium">{cat}</TableCell>
                              <TableCell className={`text-right font-medium ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(value)}
                              </TableCell>
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
