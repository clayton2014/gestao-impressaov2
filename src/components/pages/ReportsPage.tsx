'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SafeSelect } from '@/components/ui/safe-select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { formatCurrency, getPlanLimits, isFeatureAvailable, exportToCSV } from '@/lib/utils-app'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, Calculator, Percent, Download, Lock, Crown, Printer } from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceOrder, Client, Material, Ink } from '@/lib/types'
import { DateRange } from 'react-day-picker'
import { addDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { getServiceOrders, getClients, getMaterials, getInks } from '@/lib/database'

export default function ReportsPage() {
  const { user, currency, locale } = useAppStore()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<ServiceOrder[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [materials, setMaterials] = useState<Material[]>([])

  const planLimits = getPlanLimits(user?.plano || 'free')

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [servicesData, clientsData, materialsData] = await Promise.all([
        getServiceOrders(),
        getClients(),
        getMaterials()
      ])
      
      setServices(servicesData.data)
      setClients(clientsData.data)
      setMaterials(materialsData.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter services by date range
  const filteredServices = services.filter(service => {
    if (!dateRange?.from || !dateRange?.to) return true
    const serviceDate = new Date(service.createdAt)
    return serviceDate >= dateRange.from && serviceDate <= dateRange.to
  })

  // Calculate metrics
  const totalRevenue = filteredServices.reduce((sum, service) => sum + (service.calc?.preco || 0), 0)
  const totalCosts = filteredServices.reduce((sum, service) => sum + (service.calc?.custo || 0), 0)
  const totalProfit = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // Revenue by month
  const revenueByMonth = filteredServices.reduce((acc, service) => {
    const month = new Date(service.createdAt).toLocaleDateString(locale, { month: 'short', year: 'numeric' })
    acc[month] = (acc[month] || 0) + (service.calc?.preco || 0)
    return acc
  }, {} as Record<string, number>)

  const revenueChartData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
    month,
    revenue,
  }))

  // Top clients
  const clientRevenue = filteredServices.reduce((acc, service) => {
    const clientName = clients.find(c => c.id === service.clienteId)?.nome || 'Cliente não encontrado'
    acc[clientName] = (acc[clientName] || 0) + (service.calc?.preco || 0)
    return acc
  }, {} as Record<string, number>)

  const topClients = Object.entries(clientRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue }))

  // Service status distribution
  const statusDistribution = filteredServices.reduce((acc, service) => {
    acc[service.status] = (acc[service.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusChartData = Object.entries(statusDistribution).map(([status, count]) => ({
    status: status === 'quote' ? 'Orçamento' : 
            status === 'approved' ? 'Aprovado' :
            status === 'production' ? 'Em Produção' : 'Concluído',
    count,
  }))

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300']

  const handleExportData = () => {
    if (!isFeatureAvailable('reports', user?.plano || 'free')) {
      toast.error('Relatórios avançados disponíveis apenas no plano Pro')
      return
    }

    const data = filteredServices.map(service => ({
      Cliente: clients.find(c => c.id === service.clienteId)?.nome || 'N/A',
      Serviço: service.nome,
      Status: service.status,
      'Data Criação': new Date(service.createdAt).toLocaleDateString(locale),
      'Data Entrega': service.dataEntrega ? new Date(service.dataEntrega).toLocaleDateString(locale) : 'N/A',
      Custo: service.calc?.custo || 0,
      Preço: service.calc?.preco || 0,
      Lucro: service.calc?.lucro || 0,
      'Margem (%)': service.calc?.margem ? (service.calc.margem * 100).toFixed(2) : '0',
    }))

    exportToCSV(data, 'relatorio-servicos')
    toast.success('Relatório exportado com sucesso!')
  }

  const quickDateRanges = [
    {
      label: 'Este mês',
      range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
    },
    {
      label: 'Mês passado',
      range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }
    },
    {
      label: 'Últimos 30 dias',
      range: { from: addDays(new Date(), -30), to: new Date() }
    },
    {
      label: 'Últimos 90 dias',
      range: { from: addDays(new Date(), -90), to: new Date() }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho do seu negócio
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <SafeSelect
            value=""
            onChange={(value) => {
              const range = quickDateRanges.find(r => r.label === value)?.range
              if (range) setDateRange(range)
            }}
            placeholder="Período rápido"
            options={quickDateRanges.map(range => ({ value: range.label, label: range.label }))}
            className="w-40"
          />
          
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          
          <Button onClick={handleExportData} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {!isFeatureAvailable('reports', user?.plano || 'free') && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Lock className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="font-medium text-amber-500">Relatórios Avançados - Plano Pro</p>
              <p className="text-sm text-muted-foreground">
                Acesse gráficos detalhados, exportação de dados e análises avançadas.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Pro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue, currency, locale)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredServices.length} serviços no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCosts, currency, locale)}</div>
            <p className="text-xs text-muted-foreground">
              Materiais, tintas e mão de obra
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit, currency, locale)}</div>
            <p className="text-xs text-muted-foreground">
              Receita - Custos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Lucro / Receita
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Mês</CardTitle>
            <CardDescription>
              Evolução da receita ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value), currency, locale), 'Receita']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
            <CardDescription>
              Clientes que mais geraram receita
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topClients} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value), currency, locale), 'Receita']}
                  />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Serviços</CardTitle>
            <CardDescription>
              Distribuição dos serviços por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do Período</CardTitle>
            <CardDescription>
              Estatísticas gerais do período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total de Serviços:</span>
                <span className="font-medium">{filteredServices.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ticket Médio:</span>
                <span className="font-medium">
                  {formatCurrency(filteredServices.length > 0 ? totalRevenue / filteredServices.length : 0, currency, locale)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Custo Médio:</span>
                <span className="font-medium">
                  {formatCurrency(filteredServices.length > 0 ? totalCosts / filteredServices.length : 0, currency, locale)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lucro Médio:</span>
                <span className="font-medium">
                  {formatCurrency(filteredServices.length > 0 ? totalProfit / filteredServices.length : 0, currency, locale)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Clientes Únicos:</span>
                <span className="font-medium">
                  {new Set(filteredServices.map(s => s.clienteId)).size}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}