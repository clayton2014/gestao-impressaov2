'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SafeSelect } from '@/components/ui/safe-select'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, FileText, X, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceOrder, Client, Material, Ink } from '@/lib/types'
import { ServicesDAO, ClientsDAO, MaterialsDAO, InksDAO } from '@/lib/dao'
import { formatCurrency } from '@/hooks/useTranslation'
import { useAppStore } from '@/lib/store'

interface ServiceItem {
  id?: string
  material_id?: string
  unit: 'm' | 'm2'
  meters?: number
  width?: number
  height?: number
  quantity: number
  unit_cost_snapshot: number
}

interface ServiceInk {
  id?: string
  ink_id?: string
  ml: number
  cost_per_liter_snapshot: number
}

interface ServiceFormData {
  client_id: string
  name: string
  description: string
  status: string
  due_date?: string
  labor_hours?: number
  labor_rate?: number
  markup?: number
  manual_price?: number
  items: ServiceItem[]
  inks: ServiceInk[]
}

export default function ServicesPage() {
  const { currency, locale } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceOrder | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [services, setServices] = useState<ServiceOrder[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [inks, setInks] = useState<Ink[]>([])

  const [formData, setFormData] = useState<ServiceFormData>({
    client_id: '',
    name: '',
    description: '',
    status: 'Orçamento',
    due_date: '',
    labor_hours: 0,
    labor_rate: 0,
    markup: 0,
    manual_price: undefined,
    items: [],
    inks: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [servicesData, clientsData, materialsData, inksData] = await Promise.all([
        ServicesDAO.list(),
        ClientsDAO.list(),
        MaterialsDAO.list(),
        InksDAO.list()
      ])
      
      setServices(servicesData)
      setClients(clientsData)
      setMaterials(materialsData)
      setInks(inksData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Cliente não encontrado'
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Cliente não encontrado'
  }

  const filteredServices = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase()
    
    return services.filter(service => {
      const serviceName = service?.name?.toLowerCase() || ''
      const clientName = getClientName(service?.client_id).toLowerCase()
      
      const matchesSearch = serviceName.includes(searchTermLower) || clientName.includes(searchTermLower)
      const matchesStatus = statusFilter === 'all' || service?.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [services, searchTerm, statusFilter, clients])

  const handleNewService = () => {
    setEditingService(null)
    setFormData({
      client_id: '',
      name: '',
      description: '',
      status: 'Orçamento',
      due_date: '',
      labor_hours: 0,
      labor_rate: 0,
      markup: 0,
      manual_price: undefined,
      items: [],
      inks: []
    })
    setIsDialogOpen(true)
  }

  const handleEditService = (service: ServiceOrder) => {
    setEditingService(service)
    
    setFormData({
      client_id: service.client_id || '',
      name: service.name || '',
      description: service.description || '',
      status: service.status || 'Orçamento',
      due_date: service.due_date ? new Date(service.due_date).toISOString().split('T')[0] : '',
      labor_hours: service.labor_hours || 0,
      labor_rate: service.labor_rate || 0,
      markup: service.markup || 0,
      manual_price: service.manual_price || undefined,
      items: service.items || [],
      inks: service.inks || []
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome do serviço é obrigatório')
      return
    }

    if (!formData.client_id) {
      toast.error('Cliente é obrigatório')
      return
    }

    try {
      const serviceData = {
        client_id: formData.client_id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        due_date: formData.due_date ? new Date(formData.due_date) : null,
        labor_hours: formData.labor_hours,
        labor_rate: formData.labor_rate,
        markup: formData.markup,
        manual_price: formData.manual_price,
        items: formData.items,
        inks: formData.inks
      }

      if (editingService) {
        await ServicesDAO.update(editingService.id, serviceData)
        toast.success('Serviço atualizado com sucesso!')
      } else {
        await ServicesDAO.create(serviceData)
        toast.success('Serviço criado com sucesso!')
      }

      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
      toast.error('Erro ao salvar serviço')
    }
  }

  const handleDeleteService = async (id: string) => {
    try {
      await ServicesDAO.remove(id)
      toast.success('Serviço excluído com sucesso!')
      loadData()
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
      toast.error('Erro ao excluir serviço')
    }
  }

  const addMaterialItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        material_id: '',
        unit: 'm2',
        meters: 0,
        width: 0,
        height: 0,
        quantity: 1,
        unit_cost_snapshot: 0
      }]
    }))
  }

  const addInkItem = () => {
    setFormData(prev => ({
      ...prev,
      inks: [...prev.inks, {
        ink_id: '',
        ml: 0,
        cost_per_liter_snapshot: 0
      }]
    }))
  }

  const removeMaterialItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const removeInkItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inks: prev.inks.filter((_, i) => i !== index)
    }))
  }

  const updateMaterialItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))

    // Auto-update cost snapshot when material changes
    if (field === 'material_id') {
      const material = materials.find(m => m.id === value)
      if (material) {
        setFormData(prev => ({
          ...prev,
          items: prev.items.map((item, i) => 
            i === index ? { 
              ...item, 
              unit_cost_snapshot: material.cost_per_unit || 0,
              unit: material.unit
            } : item
          )
        }))
      }
    }
  }

  const updateInkItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      inks: prev.inks.map((ink, i) => 
        i === index ? { ...ink, [field]: value } : ink
      )
    }))

    // Auto-update cost snapshot when ink changes
    if (field === 'ink_id') {
      const ink = inks.find(i => i.id === value)
      if (ink) {
        setFormData(prev => ({
          ...prev,
          inks: prev.inks.map((inkItem, i) => 
            i === index ? { 
              ...inkItem, 
              cost_per_liter_snapshot: ink.cost_per_liter || 0
            } : inkItem
          )
        }))
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie seus serviços ({services.length})
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewService} className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
              <Plus className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
              <DialogDescription>
                {editingService ? 'Atualize as informações do serviço.' : 'Adicione um novo serviço ao sistema.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente *</Label>
                  <SafeSelect
                    value={formData.client_id}
                    onChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                    placeholder="Selecione o cliente"
                    options={clients.map(client => ({ value: client.id, label: client.name }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Serviço *</Label>
                  <Input
                    id="name"
                    placeholder="Nome do serviço"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <SafeSelect
                    value={formData.status}
                    onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    placeholder="Selecione o status"
                    options={[
                      { value: "Orçamento", label: "Orçamento" },
                      { value: "Aprovado", label: "Aprovado" },
                      { value: "Em produção", label: "Em Produção" },
                      { value: "Concluído", label: "Concluído" }
                    ]}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Entrega</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Descrição do serviço"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Materials */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Materiais</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addMaterialItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Material
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-6 gap-2 items-end p-3 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs">Material</Label>
                        <SafeSelect
                          value={item.material_id || ''}
                          onChange={(value) => updateMaterialItem(index, 'material_id', value)}
                          placeholder="Selecionar"
                          options={materials.map(material => ({ 
                            value: material.id, 
                            label: `${material.name} (${material.unit})` 
                          }))}
                          className="h-8"
                        />
                      </div>

                      {item.unit === 'm' ? (
                        <div className="space-y-1">
                          <Label className="text-xs">Metros</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8"
                            value={item.meters || 0}
                            onChange={(e) => updateMaterialItem(index, 'meters', Number(e.target.value))}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Largura (m)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-8"
                              value={item.width || 0}
                              onChange={(e) => updateMaterialItem(index, 'width', Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Altura (m)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-8"
                              value={item.height || 0}
                              onChange={(e) => updateMaterialItem(index, 'height', Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Qtd</Label>
                            <Input
                              type="number"
                              min="1"
                              className="h-8"
                              value={item.quantity || 1}
                              onChange={(e) => updateMaterialItem(index, 'quantity', Number(e.target.value))}
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs">Custo/Un</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-8"
                          value={item.unit_cost_snapshot || 0}
                          onChange={(e) => updateMaterialItem(index, 'unit_cost_snapshot', Number(e.target.value))}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => removeMaterialItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Inks */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Tintas</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addInkItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Tinta
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.inks.map((ink, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-end p-3 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs">Tinta</Label>
                        <SafeSelect
                          value={ink.ink_id || ''}
                          onChange={(value) => updateInkItem(index, 'ink_id', value)}
                          placeholder="Selecionar"
                          options={inks.map(inkItem => ({ value: inkItem.id, label: inkItem.name }))}
                          className="h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">ML Usados</Label>
                        <Input
                          type="number"
                          min="0"
                          className="h-8"
                          value={ink.ml || 0}
                          onChange={(e) => updateInkItem(index, 'ml', Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Custo/L</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-8"
                          value={ink.cost_per_liter_snapshot || 0}
                          onChange={(e) => updateInkItem(index, 'cost_per_liter_snapshot', Number(e.target.value))}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => removeInkItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Precificação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="labor_hours">Horas de Trabalho</Label>
                      <Input
                        id="labor_hours"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.labor_hours || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, labor_hours: Number(e.target.value) }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="labor_rate">Valor por Hora</Label>
                      <Input
                        id="labor_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.labor_rate || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, labor_rate: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="markup">Margem de Lucro (%)</Label>
                      <Input
                        id="markup"
                        type="number"
                        step="0.1"
                        min="0"
                        max="1000"
                        value={formData.markup || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, markup: Number(e.target.value) }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="manual_price">Preço Manual (opcional)</Label>
                      <Input
                        id="manual_price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Deixe vazio para cálculo automático"
                        value={formData.manual_price || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, manual_price: e.target.value ? Number(e.target.value) : undefined }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingService ? 'Atualizar' : 'Criar'} Serviço
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Serviços</CardTitle>
              <CardDescription>
                {filteredServices.length} serviço{filteredServices.length !== 1 ? 's' : ''} encontrado{filteredServices.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <SafeSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "Todos" },
                  { value: "Orçamento", label: "Orçamento" },
                  { value: "Aprovado", label: "Aprovado" },
                  { value: "Em produção", label: "Em Produção" },
                  { value: "Concluído", label: "Concluído" }
                ]}
                className="w-40"
              />
              
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar serviços..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum serviço encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' ? 'Tente ajustar seus filtros.' : 'Comece adicionando seu primeiro serviço.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={handleNewService}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Serviço
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {getClientName(service.client_id)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{service.name}</div>
                        {service.description && (
                          <div className="text-xs text-muted-foreground">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.status === 'Concluído' ? 'default' : 'secondary'}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {service.due_date ? new Date(service.due_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o serviço "{service.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}