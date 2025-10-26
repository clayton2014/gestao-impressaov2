'use client'

import { useState } from 'react'
import { useAppStore, actions } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SafeSelect } from '@/components/ui/safe-select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { settingsSchema, type SettingsFormData } from '@/lib/validations'
import { Settings, Building, Palette, Database, Download, Upload, Save, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { exportData, importData } from '@/lib/database'

export default function SettingsPage() {
  const user = useAppStore(s => s.user);
  const settings = useAppStore(s => s.settings);
  const theme = useAppStore(s => s.theme);
  const locale = useAppStore(s => s.locale);
  const currency = useAppStore(s => s.currency);
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: settings.company_name,
      company_logo: settings.company_logo || '',
      default_markup: settings.default_markup,
      default_unit: settings.default_unit,
      tax_percent: settings.tax_percent,
      dashboard_cards: settings.dashboard_cards,
      theme: theme,
    },
  })

  const onSubmit = async (data: SettingsFormData) => {
    try {
      actions.patchSettings(data);
      actions.setTheme(data.theme);
      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    }
  }

  const handleExportData = async () => {
    setExporting(true)
    
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Dados exportados com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      toast.error('Erro ao exportar dados')
    } finally {
      setExporting(false)
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importData(data)
      toast.success('Dados importados com sucesso!')
      window.location.reload() // Reload to reflect changes
    } catch (error) {
      console.error('Erro ao importar dados:', error)
      toast.error('Erro ao importar dados. Verifique se o arquivo está correto.')
    } finally {
      setImporting(false)
      // Reset input
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema e preferências
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building className="mr-2 h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-2 h-4 w-4" />
            Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as preferências básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <SafeSelect
                    value={locale}
                    onChange={actions.setLocale}
                    options={[
                      { value: "pt-BR", label: "Português (Brasil)" },
                      { value: "en-US", label: "English (US)" },
                      { value: "es-ES", label: "Español" }
                    ]}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <SafeSelect
                    value={currency}
                    onChange={setCurrency}
                    options={[
                      { value: "BRL", label: "Real (R$)" },
                      { value: "USD", label: "Dólar ($)" },
                      { value: "EUR", label: "Euro (€)" }
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Configure as informações da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nome da Empresa</Label>
                    <Input
                      id="company_name"
                      placeholder="Nome da sua empresa"
                      {...form.register('company_name')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company_logo">Logo da Empresa (URL)</Label>
                    <Input
                      id="company_logo"
                      placeholder="https://exemplo.com/logo.png"
                      {...form.register('company_logo')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_markup">Margem Padrão (%)</Label>
                    <Input
                      id="default_markup"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1000"
                      {...form.register('default_markup', { valueAsNumber: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Unidade Padrão</Label>
                    <Controller
                      name="default_unit"
                      control={form.control}
                      render={({ field }) => (
                        <SafeSelect
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          options={[
                            { value: "m", label: "Metro (m)" },
                            { value: "m2", label: "Metro Quadrado (m²)" }
                          ]}
                        />
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax_percent">Taxa/Imposto (%)</Label>
                    <Input
                      id="tax_percent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...form.register('tax_percent', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tema</Label>
                <SafeSelect
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: "light", label: "Claro" },
                    { value: "dark", label: "Escuro" },
                    { value: "system", label: "Sistema" }
                  ]}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">Cards do Dashboard</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_revenue">Mostrar Receita</Label>
                    <Switch
                      id="show_revenue"
                      checked={settings.dashboard_cards.revenue}
                      onCheckedChange={(checked) => {
                        const newCards = { ...settings.dashboard_cards, revenue: checked }
                        updateSettings({ ...settings, dashboard_cards: newCards })
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_costs">Mostrar Custos</Label>
                    <Switch
                      id="show_costs"
                      checked={settings.dashboard_cards.costs}
                      onCheckedChange={(checked) => {
                        const newCards = { ...settings.dashboard_cards, costs: checked }
                        updateSettings({ ...settings, dashboard_cards: newCards })
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_profit">Mostrar Lucro</Label>
                    <Switch
                      id="show_profit"
                      checked={settings.dashboard_cards.profit}
                      onCheckedChange={(checked) => {
                        const newCards = { ...settings.dashboard_cards, profit: checked }
                        updateSettings({ ...settings, dashboard_cards: newCards })
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_orders">Mostrar Pedidos</Label>
                    <Switch
                      id="show_orders"
                      checked={settings.dashboard_cards.orders}
                      onCheckedChange={(checked) => {
                        const newCards = { ...settings.dashboard_cards, orders: checked }
                        updateSettings({ ...settings, dashboard_cards: newCards })
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Dados</CardTitle>
              <CardDescription>
                Exporte ou importe seus dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Exportar Dados</Label>
                  <p className="text-sm text-muted-foreground">
                    Baixe um backup completo dos seus dados
                  </p>
                  <Button 
                    onClick={handleExportData} 
                    disabled={exporting}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {exporting ? 'Exportando...' : 'Exportar Dados'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Importar Dados</Label>
                  <p className="text-sm text-muted-foreground">
                    Restaure dados de um backup anterior
                  </p>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      disabled={importing}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    {importing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800">
                      Atenção ao importar dados
                    </p>
                    <p className="text-sm text-amber-700">
                      A importação substituirá todos os dados atuais. Certifique-se de fazer um backup antes de importar.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}