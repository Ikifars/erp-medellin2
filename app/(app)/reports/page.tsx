'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Package, Users, DollarSign } from 'lucide-react'

const reports = [
  {
    title: 'Relatório de Vendas',
    description: 'Análise de vendas por período e produto',
    href: '/reports/sales',
    icon: BarChart3,
    color: 'bg-blue-500/20 text-blue-400'
  },
  {
    title: 'Relatório Financeiro',
    description: 'Visão geral de entradas, saídas e lucro',
    href: '/reports/financial',
    icon: DollarSign,
    color: 'bg-green-500/20 text-green-400'
  },
  {
    title: 'Relatório de Estoque',
    description: 'Análise de produtos e movimentações',
    href: '/reports/inventory',
    icon: Package,
    color: 'bg-purple-500/20 text-purple-400'
  },
  {
    title: 'Relatório de Clientes',
    description: 'Análise de clientes e histórico de compras',
    href: '/reports/customers',
    icon: Users,
    color: 'bg-yellow-500/20 text-yellow-400'
  },
]

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Relatórios" subtitle="Análises e relatórios do sistema" />

        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => {
              const Icon = report.icon
              return (
                <Card key={report.href} className="glass-card p-6 hover:border-primary/50 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${report.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                  <Link href={report.href}>
                    <Button variant="outline" className="w-full">
                      Ver Relatório
                    </Button>
                  </Link>
                </Card>
              )
            })}
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
