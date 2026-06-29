'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// KPI Card Component
function KPICard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  prefix = '',
  suffix = ''
}: {
  title: string
  value: string | number
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  prefix?: string
  suffix?: string
}) {
  return (
    <Card className="glass-card hover:border-primary/30 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-muted-foreground">{title}</CardDescription>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}{suffix}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-xs mt-1 ${
            changeType === 'positive' ? 'text-success-foreground' :
            changeType === 'negative' ? 'text-destructive-foreground' :
            'text-muted-foreground'
          }`}>
            {changeType === 'positive' ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : changeType === 'negative' ? (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            ) : null}
            <span>{change > 0 ? '+' : ''}{change}% em relação ao mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardData {
  faturamentoMes: number
  lucroLiquido: number
  totalPedidos: number
  clientesAtivos: number
  produtosEstoque: number
  ticketMedio: number
  crescimentoMensal: number
  margemLucro: number
  pedidosRecebidos: number
  pedidosFaturados: number
  pedidosCancelados: number
  faturamentoMensal: { mes: string; valor: number }[]
  entradasSaidas: { mes: string; entradas: number; saidas: number }[]
  lucroPeriodo: { mes: string; lucro: number }[]
  produtosMaisVendidos: { nome: string; quantidade: number }[]
  clientesTop: { nome: string; total: number }[]
  alertasEstoque: { nome: string; quantidade: number; minimo: number }[]
  contasVencidas: number
  pedidosPendentes: number
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      try {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        const startOfYear = new Date(now.getFullYear(), 0, 1)

        // Fetch orders
        const { data: orders } = await supabase
          .from('orders')
          .select('id, total, status, created_at')
          .is('deleted_at', null)
          .gte('created_at', startOfYear.toISOString())

        // Fetch customers
        const { data: customers } = await supabase
          .from('customers')
          .select('id')
          .is('deleted_at', null)

        // Fetch products
        const { data: products } = await supabase
          .from('products')
          .select('id, name, quantity, min_stock')
          .is('deleted_at', null)

        // Fetch financial transactions
        const { data: transactions } = await supabase
          .from('financial_transactions')
          .select('id, type, amount, category, transaction_date')
          .is('deleted_at', null)
          .gte('transaction_date', startOfYear.toISOString().split('T')[0])

        // ✅ CORREÇÃO DO COMPILADOR: Parâmetro 'o' agora explicitamente tipado como 'any' para aceitar checagem estrita
        const currentMonthOrders = orders?.filter((o: any) =>
          new Date(o.created_at) >= startOfMonth && o.status !== 'cancelado'
        ) || []

        const lastMonthOrders = orders?.filter((o: any) => {
          const date = new Date(o.created_at)
          return date >= startOfLastMonth && date <= endOfLastMonth && o.status !== 'cancelado'
        ) || []

        const faturamentoMes = currentMonthOrders.reduce((sum, o: any) => sum + Number(o.total), 0)
        const faturamentoUltimoMes = lastMonthOrders.reduce((sum, o: any) => sum + Number(o.total), 0)
        const crescimentoMensal = faturamentoUltimoMes > 0
          ? ((faturamentoMes - faturamentoUltimoMes) / faturamentoUltimoMes) * 100
          : 0

        // Calculate financials
        const currentMonthEntradas = transactions?.filter((t: any) =>
          t.type === 'entrada' &&
          new Date(t.transaction_date) >= startOfMonth
        ).reduce((sum, t: any) => sum + Number(t.amount), 0) || 0

        const currentMonthSaidas = transactions?.filter((t: any) =>
          t.type === 'saida' &&
          new Date(t.transaction_date) >= startOfMonth
        ).reduce((sum, t: any) => sum + Number(t.amount), 0) || 0

        const lucroLiquido = currentMonthEntradas - currentMonthSaidas
        const margemLucro = faturamentoMes > 0 ? (lucroLiquido / faturamentoMes) * 100 : 0

        // Order stats
        const pedidosRecebidos = orders?.filter((o: any) => o.status === 'recebido').length || 0
        const pedidosFaturados = orders?.filter((o: any) => o.status === 'faturado').length || 0
        const pedidosCancelados = orders?.filter((o: any) => o.status === 'cancelado').length || 0
        const pedidosPendentes = orders?.filter((o: any) =>
          o.status === 'recebido' || o.status === 'em_processamento'
        ).length || 0

        // Ticket médio
        const ticketMedio = currentMonthOrders.length > 0
          ? faturamentoMes / currentMonthOrders.length
          : 0

        // Monthly revenue data for chart
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        const faturamentoMensal = monthNames.map((mes, i) => {
          const monthOrders = orders?.filter((o: any) => {
            const date = new Date(o.created_at)
            return date.getMonth() === i && o.status !== 'cancelado'
          }) || []
          return {
            mes,
            valor: monthOrders.reduce((sum, o: any) => sum + Number(o.total), 0)
          }
        })

        // Entries vs Exits
        const entradasSaidas = monthNames.map((mes, i) => {
          const monthTransactions = transactions?.filter((t: any) => {
            const date = new Date(t.transaction_date)
            return date.getMonth() === i
          }) || []
          return {
            mes,
            entradas: monthTransactions.filter((t: any) => t.type === 'entrada').reduce((sum, t: any) => sum + Number(t.amount), 0),
            saidas: monthTransactions.filter((t: any) => t.type === 'saida').reduce((sum, t: any) => sum + Number(t.amount), 0)
          }
        })

        // Profit by period
        const lucroPeriodo = monthNames.map((mes, i) => {
          const monthTransactions = transactions?.filter((t: any) => {
            const date = new Date(t.transaction_date)
            return date.getMonth() === i
          }) || []
          const entradas = monthTransactions.filter((t: any) => t.type === 'entrada').reduce((sum, t: any) => sum + Number(t.amount), 0)
          const saidas = monthTransactions.filter((t: any) => t.type === 'saida').reduce((sum, t: any) => sum + Number(t.amount), 0)
          return {
            mes,
            lucro: entradas - saidas
          }
        })

        // Alert products low stock
        const alertasEstoque = products?.filter((p: any) => p.quantity <= p.min_stock).map((p: any) => ({
          nome: p.name,
          quantidade: p.quantity,
          minimo: p.min_stock
        })) || []

        // Overdue accounts
        const { data: overdueTransactions } = await supabase
          .from('financial_transactions')
          .select('id')
          .eq('status', 'pendente')
          .lt('due_date', now.toISOString().split('T')[0])

        // ✅ CORREÇÃO DE LOGICA: Alimentando diretamente o estado correto do componente
        setDashboardData({
          faturamentoMes,
          lucroLiquido,
          totalPedidos: currentMonthOrders.length,
          clientesAtivos: customers?.length || 0,
          produtosEstoque: products?.reduce((sum, p: any) => sum + p.quantity, 0) || 0,
          ticketMedio,
          crescimentoMensal,
          margemLucro,
          pedidosRecebidos,
          pedidosFaturados,
          pedidosCancelados,
          faturamentoMensal,
          entradasSaidas,
          lucroPeriodo,
          alertasEstoque,
          contasVencidas: overdueTransactions?.length || 0,
          pedidosPendentes,
          produtosMaisVendidos: [],
          clientesTop: []
        })
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [supabase])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  const chartColors = ['#A37C3F', '#4B4D2A', '#7D7965', '#B79A5A', '#A39D93']
  const pieData = dashboardData ? [
    { name: 'Recebidos', value: dashboardData.pedidosRecebidos },
    { name: 'Faturados', value: dashboardData.pedidosFaturados },
    { name: 'Cancelados', value: dashboardData.pedidosCancelados }
  ].filter(d => d.value > 0) : []

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header
          title="Dashboard"
          subtitle={`Bem-vindo, ${profile?.name || 'Usuário'}`}
        />

        <main className="flex-1 p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Faturamento do Mês"
              value={dashboardData?.faturamentoMes || 0}
              change={Number(dashboardData?.crescimentoMensal?.toFixed(1))}
              changeType={(dashboardData?.crescimentoMensal || 0) >= 0 ? 'positive' : 'negative'}
              icon={DollarSign}
              prefix="R$ "
            />
            <KPICard
              title="Lucro Líquido"
              value={dashboardData?.lucroLiquido || 0}
              icon={TrendingUp}
              prefix="R$ "
            />
            <KPICard
              title="Total de Pedidos"
              value={dashboardData?.totalPedidos || 0}
              icon={ShoppingCart}
            />
            <KPICard
              title="Clientes Ativos"
              value={dashboardData?.clientesAtivos || 0}
              icon={Users}
            />
            <KPICard
              title="Produtos em Estoque"
              value={dashboardData?.produtosEstoque || 0}
              icon={Package}
            />
            <KPICard
              title="Ticket Médio"
              value={Number((dashboardData?.ticketMedio || 0).toFixed(2))}
              icon={Activity}
              prefix="R$ "
            />
          </div>

          {/* Alerts */}
          {(dashboardData?.alertasEstoque?.length || 0) > 0 || (dashboardData?.contasVencidas || 0) > 0 || (dashboardData?.pedidosPendentes || 0) > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {(dashboardData?.alertasEstoque?.length || 0) > 0 && (
                <Card className="glass-card border-warning/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-warning-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      Estoque Baixo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {dashboardData?.alertasEstoque?.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-muted-foreground">{item.nome}</span>
                          <span className="text-warning-foreground">{item.quantidade}/{item.minimo}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {(dashboardData?.contasVencidas || 0) > 0 && (
                <Card className="glass-card border-destructive/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      Contas Vencidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-destructive-foreground">
                      {dashboardData?.contasVencidas} contas
                    </p>
                  </CardContent>
                </Card>
              )}
              {(dashboardData?.pedidosPendentes || 0) > 0 && (
                <Card className="glass-card border-primary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-primary">
                      <AlertTriangle className="h-4 w-4" />
                      Pedidos Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">
                      {dashboardData?.pedidosPendentes} pedidos
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          {/* Charts Row 1 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Faturamento Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData?.faturamentoMensal || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(163,124,63,0.1)" />
                      <XAxis dataKey="mes" stroke="#A39D93" />
                      <YAxis stroke="#A39D93" tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                        contentStyle={{ backgroundColor: '#1A1B17', border: '1px solid #A37C3F' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="valor"
                        stroke="#A37C3F"
                        strokeWidth={2}
                        dot={{ fill: '#A37C3F' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Entradas x Saídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.entradasSaidas || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(163,124,63,0.1)" />
                      <XAxis dataKey="mes" stroke="#A39D93" />
                      <YAxis stroke="#A39D93" tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`]}
                        contentStyle={{ backgroundColor: '#1A1B17', border: '1px solid #A37C3F' }}
                      />
                      <Legend />
                      <Bar dataKey="entradas" fill="#4B4D2A" />
                      <Bar dataKey="saidas" fill="#A37C3F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Lucro por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData?.lucroPeriodo || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(163,124,63,0.1)" />
                      <XAxis dataKey="mes" stroke="#A39D93" />
                      <YAxis stroke="#A39D93" tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Lucro']}
                        contentStyle={{ backgroundColor: '#1A1B17', border: '1px solid #A37C3F' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="lucro"
                        stroke="#B79A5A"
                        fill="rgba(183, 154, 90, 0.2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Status dos Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData.length > 0 ? pieData : [{ name: 'Sem dados', value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1A1B17', border: '1px solid #A37C3F' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="chart-container lg:col-span-1">
              <CardHeader>
                <CardTitle>Indicadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Crescimento Mensal</span>
                    <span className={`font-medium ${(dashboardData?.crescimentoMensal || 0) >= 0 ? 'text-success-foreground' : 'text-destructive-foreground'}`}>
                      {(dashboardData?.crescimentoMensal || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Margem de Lucro</span>
                    <span className="font-medium text-foreground">
                      {(dashboardData?.margemLucro || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pedidos Faturados</span>
                    <span className="font-medium text-foreground">
                      {dashboardData?.pedidosFaturados || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pedidos Cancelados</span>
                    <span className="font-medium text-destructive-foreground">
                      {dashboardData?.pedidosCancelados || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
