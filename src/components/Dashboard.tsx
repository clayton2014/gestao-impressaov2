"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Clock, 
  FileText,
  Users,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import useTranslation from '@/hooks/useTranslation';
import { useEffect, useState, useMemo } from 'react';
import { getDashboardMetrics } from '@/lib/database';
import type { DashboardMetrics } from '@/lib/types';
import { toArr, num } from '@/lib/safe';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const materials = useAppStore(s => s.materials);
  const clients = useAppStore(s => s.clients);
  const services = useAppStore(s => s.services);
  const { t, formatCurrency } = useTranslation();
  
  // Safe array conversion
  const materialsArray = toArr(materials);
  const clientsArray = toArr(clients);
  const servicesArray = toArr(services);
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    receitaMes: 0,
    custoMes: 0,
    lucroMes: 0,
    margemMes: 0,
    pedidosProducao: 0,
    orcamentosPendentes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Error loading dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  // Material lookup map
  const materialById = useMemo(() => new Map(materialsArray.map(m => [m.id, m])), [materialsArray]);

  // Client lookup map
  const clientById = useMemo(() => new Map(clientsArray.map(c => [c.id, c])), [clientsArray]);

  // Top materials by cost (real data from service orders)
  const topMaterials = useMemo(() => {
    const totals = new Map<string, number>();
    
    for (const so of servicesArray) {
      const itens = toArr(so.itens);
      for (const it of itens) {
        const snap = num(it.custoPorUnidadeSnapshot);
        let qty = 0;
        
        if (it.unidade === "m") {
          qty = num(it.metros);
        } else if (it.unidade === "m2") {
          qty = num(it.largura) * num(it.altura) * num(it.quantidade, 1);
        }
        
        const add = snap * qty;
        if (!it.materialId || !Number.isFinite(add)) continue;
        
        totals.set(it.materialId, num(totals.get(it.materialId), 0) + add);
      }
    }
    
    const rows = Array.from(totals.entries()).map(([materialId, value]) => {
      const m = materialById.get(materialId);
      return { 
        id: materialId, 
        name: m?.nome ?? "—", 
        value,
        color: COLORS[Array.from(totals.keys()).indexOf(materialId) % COLORS.length]
      };
    });
    
    return rows.sort((a, b) => b.value - a.value).slice(0, 5);
  }, [servicesArray, materialById]);

  // Top clients by revenue (real data from service orders)
  const topClients = useMemo(() => {
    const totals = new Map<string, number>();
    
    for (const so of servicesArray) {
      const preco = num(so?.calc?.preco ?? so?.precoManual);
      if (!so.clienteId) continue;
      
      totals.set(so.clienteId, num(totals.get(so.clienteId), 0) + preco);
    }
    
    const rows = Array.from(totals.entries()).map(([clientId, value]) => {
      const c = clientById.get(clientId);
      return { 
        id: clientId, 
        name: c?.nome ?? "—", 
        value 
      };
    });
    
    return rows.sort((a, b) => b.value - a.value).slice(0, 5);
  }, [servicesArray, clientById]);

  // Recent service orders (safe data handling)
  const recentOrders = useMemo(() => {
    return toArr(servicesArray)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || a.dueDate || Date.now());
        const dateB = new Date(b.createdAt || b.updatedAt || b.dueDate || Date.now());
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);
  }, [servicesArray]);

  // Sample chart data (SSR-safe, no random values)
  const monthlyData = [
    { month: 'Jan', receita: 15000, custo: 8000, lucro: 7000 },
    { month: 'Fev', receita: 18000, custo: 9500, lucro: 8500 },
    { month: 'Mar', receita: 22000, custo: 11000, lucro: 11000 },
    { month: 'Abr', receita: 25000, custo: 12500, lucro: 12500 },
    { month: 'Mai', receita: 28000, custo: 14000, lucro: 14000 },
    { month: 'Jun', receita: 32000, custo: 16000, lucro: 16000 },
  ];

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue,
    color = "purple",
    loading = false
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: string;
    loading?: boolean;
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${
          color === 'purple' ? 'from-purple-500 to-purple-600' :
          color === 'cyan' ? 'from-cyan-500 to-cyan-600' :
          color === 'green' ? 'from-green-500 to-green-600' :
          color === 'orange' ? 'from-orange-500 to-orange-600' :
          'from-slate-500 to-slate-600'
        }`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {loading ? (
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          ) : (
            value
          )}
        </div>
        {trend && trendValue && !loading && (
          <div className={`flex items-center text-xs mt-1 ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title={t('dashboard.monthRevenue')}
          value={formatCurrency(metrics.receitaMes)}
          icon={DollarSign}
          trend="up"
          trendValue="+12.5%"
          color="green"
          loading={loading}
        />
        
        <MetricCard
          title={t('dashboard.monthCost')}
          value={formatCurrency(metrics.custoMes)}
          icon={TrendingDown}
          trend="down"
          trendValue="-3.2%"
          color="orange"
          loading={loading}
        />
        
        <MetricCard
          title={t('dashboard.monthProfit')}
          value={formatCurrency(metrics.lucroMes)}
          icon={TrendingUp}
          trend="up"
          trendValue="+18.7%"
          color="purple"
          loading={loading}
        />
        
        <MetricCard
          title={t('dashboard.marginPercent')}
          value={`${metrics.margemMes.toFixed(1)}%`}
          icon={BarChart3}
          trend="up"
          trendValue="+2.1%"
          color="cyan"
          loading={loading}
        />
        
        <MetricCard
          title={t('dashboard.inProduction')}
          value={metrics.pedidosProducao}
          icon={Package}
          color="orange"
          loading={loading}
        />
        
        <MetricCard
          title={t('dashboard.pendingQuotes')}
          value={metrics.orcamentosPendentes}
          icon={FileText}
          color="slate"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span>{t('dashboard.revenueVsCost')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="receita" fill="#8b5cf6" name="Receita" />
                <Bar dataKey="custo" fill="#06b6d4" name="Custo" />
                <Bar dataKey="lucro" fill="#10b981" name="Lucro" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-cyan-600" />
              <span>{t('dashboard.topMaterials')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topMaterials.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sem dados no período</p>
                <p className="text-sm mt-2">Crie alguns serviços para ver materiais mais usados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topMaterials}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {topMaterials.map((entry) => (
                      <Cell key={`material-${entry.id}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients & Recent Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Top Clientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClients.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sem dados no período</p>
                <p className="text-sm mt-2">Crie alguns serviços para ver clientes principais</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">{client.name}</span>
                    <span className="text-green-600 font-semibold">{formatCurrency(client.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>{t('dashboard.recentUpdates')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sem dados no período</p>
                <p className="text-sm mt-2">Crie alguns serviços para ver atualizações aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const client = clientById.get(order.clienteId);
                  const date = new Date(order.createdAt || order.updatedAt || order.dueDate || Date.now());
                  
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium">{client?.nome ?? "Cliente não identificado"}</p>
                        <p className="text-sm text-slate-500">
                          {date.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="text-purple-600 font-semibold">
                        {formatCurrency(num(order?.calc?.preco ?? order?.precoManual))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}