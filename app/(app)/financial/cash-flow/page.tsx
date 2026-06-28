'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { FinancialTransaction } from '@/types/database'

export default function CashFlowPage() {
  const supabase = createClient()
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totals, setTotals] = useState({ entradas: 0, saidas: 0, balance: 0 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .is('deleted_at', null)
        .order('transaction_date')

      if (error) throw error

      const transactions = data as FinancialTransaction[]

      // Group by month
      const monthlyData: Record<string, { entradas: number; saidas: number }> = {}
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

      transactions.forEach(t => {
        const date = new Date(t.transaction_date)
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { entradas: 0, saidas: 0 }
        }

        if (t.type === 'entrada') {
          monthlyData[monthKey].entradas += Number(t.amount)
        } else if (t.type === 'saida') {
          monthlyData[monthKey].saidas += Number(t.amount)
        }
      })

      const chartArray = Object.entries(monthlyData).map(([month, values]) => ({
        month,
        entradas: values.entradas,
        saidas: values.saidas,
        balance: values.entradas - values.saidas,
      }))

      setChartData(chartArray)

      // Calculate totals
      const totalEntradas = transactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + Number(t.amount), 0)
      const totalSaidas = transactions.filter(t => t.type === 'saida').reduce((sum, t) => sum + Number(t.amount), 0)

      setTotals({
        entradas: totalEntradas,
        saidas: totalSaidas,
        balance: totalEntradas - totalSaidas,
      })
    } catch (error) {
      console.error('Error loading cash flow:', error)
      toast.error('Erro ao carregar fluxo de caixa')
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

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Fluxo de Caixa" subtitle="Análise de entradas e saídas" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Total de Entradas</div>
                <div className="text-2xl font-bold text-green-400 mt-1">
                  {formatCurrency(totals.entradas)}
                </div>
              </Card>
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Total de Saídas</div>
                <div className="text-2xl font-bold text-red-400 mt-1">
                  {formatCurrency(totals.saidas)}
                </div>
              </Card>
              <Card className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Saldo Geral</div>
                <div className={`text-2xl font-bold mt-1 ${totals.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(totals.balance)}
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Entradas vs Saídas (Mensal)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(163,124,63,0.1)" />
                        <XAxis dataKey="month" stroke="#A39D93" />
                        <YAxis stroke="#A39D93" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ backgroundColor: '#1A1B17', border: '1px solid #A37C3F' }}
                        />
                        <Legend />
                        <Bar dataKey="entradas" fill="#22c55e" />
                        <Bar dataKey="saidas" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Saldo Cumulativo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(163,124,63,0.1)" />
                        <XAxis dataKey="month" stroke="#A39D93" />
                        <YAxis stroke="#A39D93" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ backgroundColor: '#1A1B17', border: '1px solid #A37C3F' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="balance"
                          stroke="#A37C3F"
                          strokeWidth={2}
                          dot={{ fill: '#A37C3F' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
