'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
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
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { serviceOrderSchema, type ServiceOrderFormData } from '@/lib/validations'
import { formatDate, getPlanLimits, getStatusColor, getStatusText, calculateServiceCosts, calculateServicePrice, generateUUID } from '@/lib/utils-app'
import { Plus, Search, Edit, Trash2, FileText, Lock, Crown, X, Calculator, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceOrder, Client, Material, Ink } from '@/lib/types'
import { 
  getServiceOrders, 
  createServiceOrder, 
  updateServiceOrder, 
  deleteServiceOrder,
  getClients,
  getMaterials,
  getInks,
  calculateServiceOrder
} from '@/lib/database'
import { toArr, low, str, num } from '@/lib/safe'
import { ensureId, ensureNestedIds, uuid } from '@/lib/ids'
import { formatCurrency } from '@/hooks/useTranslation'

export default function ServicesPage() {
  const { user, currency, locale, settings } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceOrder | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados com arrays defensivos
  const [rawServices, setRawServices] = useState<any>([])
  const [rawClients, setRawClients] = useState<any>([])
  const [rawMaterials, setRawMaterials] = useState<any>([])
  const [rawInks, setRawInks] = useState<any>([])

  // Normalização defensiva dos dados com IDs garantidos
  const services = toArr<ServiceOrder>(rawServices).map(ensureNestedIds)
  const clients = toArr<Client>(rawClients).map(ensureId)
  const materials = toArr<Material>(rawMaterials).map(ensureId)
  const inks = toArr<Ink>(rawInks).map(ensureId)

  const form = useForm<ServiceOrderFormData>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: {
      client_id: '',
      name: '',
      description: '',
      status: 'quote',
      delivery_date: '',
      material_items: [],
      ink_items: [],
      labor_items: [],
      extra_items: [],
      discount_items: [],
      markup_percentage: 0,
      manual_price: null,
    },
  })

  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control: form.control,
    name: 'material_items',
  })

  const { fields: inkFields, append: appendInk, remove: removeInk } = useFieldArray({
    control: form.control,
    name: 'ink_items',
  })

  const { fields: laborFields, append: appendLabor, remove: removeLabor } = useFieldArray({
    control: form.control,
    name: 'labor_items',
  })

  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({
    control: form.control,
    name: 'extra_items',
  })

  const { fields: discountFields, append: appendDiscount, remove: removeDiscount } = useFieldArray({
    control: form.control,
    name: 'discount_items',
  })

  // Watch for material changes to update snapshots
  const watchedMaterials = useWatch({
    control: form.control,
    name: 'material_items'
  })

  const watchedInks = useWatch({
    control: form.control,
    name: 'ink_items'
  })

  // Update material snapshots when material selection changes
  useEffect(() => {
    const materialItems = toArr(watchedMaterials)
    materialItems.forEach((item, index) => {
      if (item.material_id) {
        const material = materials.find(m => m.id === item.material_id)
        if (material && item.cost_per_unit_snapshot !== material.custoPorUnidade) {
          form.setValue(`material_items.${index}.cost_per_unit_snapshot`, material.custoPorUnidade, { shouldValidate: true, shouldDirty: true })
          form.setValue(`material_items.${index}.material_name`, material.nome)
          form.setValue(`material_items.${index}.unit`, material.unidade)
        }
      }
    })
  }, [watchedMaterials, materials, form])

  // Update ink snapshots when ink selection changes
  useEffect(() => {
    const inkItems = toArr(watchedInks)
    inkItems.forEach((item, index) => {
      if (item.ink_id) {
        const ink = inks.find(i => i.id === item.ink_id)
        if (ink && item.cost_per_liter_snapshot !== ink.custoPorLitro) {
          form.setValue(`ink_items.${index}.cost_per_liter_snapshot`, ink.custoPorLitro, { shouldValidate: true, shouldDirty: true })
          form.setValue(`ink_items.${index}.ink_name`, ink.nome)
        }
      }
    })
  }, [watchedInks, inks, form])

  const planLimits = getPlanLimits(user?.plan || 'free')
  const canAddMore = services.length < planLimits.services

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [servicesData, clientsData, materialsData, inksData] = await Promise.all([
        getServiceOrders(),
        getClients(),
        getMaterials(),
        getInks()
      ])
      
      // Armazenar dados brutos para normalização defensiva
      setRawServices(servicesData)
      setRawClients(clientsData)
      setRawMaterials(materialsData)
      setRawInks(inksData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
      // Em caso de erro, garantir arrays vazios
      setRawServices([])
      setRawClients([])
      setRawMaterials([])
      setRawInks([])
    } finally {
      setLoading(false)
    }
  }

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Cliente não encontrado'
    const client = clients.find(c => c.id === clientId)
    return str(client?.nome) || 'Cliente não encontrado'
  }

  // Filtros seguros com useMemo
  const filteredServices = useMemo(() => {
    const searchTermLower = low(searchTerm)
    const statusFilterValue = str(statusFilter)
    
    return services.filter(service => {
      const serviceName = low(service?.nome)
      const clientName = low(getClientName(service?.clienteId))
      
      const matchesSearch = serviceName.includes(searchTermLower) || clientName.includes(searchTermLower)
      const matchesStatus = statusFilterValue === 'all' || str(service?.status) === statusFilterValue
      
      return matchesSearch && matchesStatus
    })
  }, [services, searchTerm, statusFilter, clients])

  const handleNewService = () => {
    if (!canAddMore) {
      toast.error(`Limite de ${planLimits.services} serviços atingido. Faça upgrade para o plano Pro.`)
      return
    }
    
    setEditingService(null)
    form.reset({
      client_id: '',
      name: '',
      description: '',
      status: 'quote',
      delivery_date: '',
      material_items: [],
      ink_items: [],
      labor_items: [],
      extra_items: [],
      discount_items: [],
      markup_percentage: 0,
      manual_price: null,
    })
    setIsDialogOpen(true)
  }

  const handleEditService = (service: ServiceOrder) => {
    setEditingService(service)
    
    // Normalização defensiva dos itens do serviço
    const serviceItems = toArr(service.itens)
    const serviceExtras = toArr(service.extras)
    const serviceDiscounts = toArr(service.descontos)
    
    form.reset({
      client_id: str(service.clienteId),
      name: str(service.nome),
      description: str(service.descricao),
      status: str(service.status),
      delivery_date: service.dataEntrega ? new Date(service.dataEntrega).toISOString().split('T')[0] : '',
      material_items: serviceItems.filter(item => item.tipo === 'material').map(item => ({
        id: str(item.id) || uuid(),
        material_id: str(item.materialId),
        material_name: str(item.nome),
        unit: str(item.unidade),
        meters: num(item.metros, 0),
        width: num(item.largura, 0),
        height: num(item.altura, 0),
        quantity: num(item.quantidade, 1),
        cost_per_unit_snapshot: num(item.custoPorUnidadeSnapshot, 0),
      })),
      ink_items: serviceItems.filter(item => item.tipo === 'tinta').map(item => ({
        id: str(item.id) || uuid(),
        ink_id: str(item.tintaId),
        ink_name: str(item.nome),
        ml_used: num(item.mlUsados, 0),
        cost_per_liter_snapshot: num(item.custoPorLitroSnapshot, 0),
      })),
      labor_items: serviceItems.filter(item => item.tipo === 'maoDeObra').map(item => ({
        id: str(item.id) || uuid(),
        description: str(item.nome),
        hours: num(item.horas, 0),
        hourly_rate: num(item.valorPorHora, 0),
      })),
      extra_items: serviceExtras.map(extra => ({
        id: str(extra.id) || uuid(),
        description: str(extra.descricao),
        value: num(extra.valor, 0),
      })),
      discount_items: serviceDiscounts.map(discount => ({
        id: str(discount.id) || uuid(),
        description: str(discount.descricao),
        value: num(discount.valor, 0),
      })),
      markup_percentage: num(service.margemLucro, 0),
      manual_price: service.precoManual ? num(service.precoManual) : null,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: ServiceOrderFormData) => {
    try {
      const serviceData = {
        id: editingService?.id || uuid(),
        clienteId: data.client_id,
        nome: data.name,
        descricao: data.description,
        status: data.status,
        dataEntrega: data.delivery_date ? new Date(data.delivery_date) : null,
        itens: [
          ...toArr(data.material_items).map(item => ({
            id: item.id || uuid(),
            tipo: 'material' as const,
            materialId: item.material_id,
            nome: item.material_name,
            unidade: item.unit,
            metros: item.unit === 'm' ? item.meters : undefined,
            largura: item.unit === 'm2' ? item.width : undefined,
            altura: item.unit === 'm2' ? item.height : undefined,
            quantidade: item.unit === 'm2' ? item.quantity : 1,
            custoPorUnidadeSnapshot: item.cost_per_unit_snapshot,
          })),
          ...toArr(data.ink_items).map(item => ({
            id: item.id || uuid(),
            tipo: 'tinta' as const,
            tintaId: item.ink_id,
            nome: item.ink_name,
            mlUsados: item.ml_used,
            custoPorLitroSnapshot: item.cost_per_liter_snapshot,
          })),
          ...toArr(data.labor_items).map(item => ({
            id: item.id || uuid(),
            tipo: 'maoDeObra' as const,
            nome: item.description,
            horas: item.hours,
            valorPorHora: item.hourly_rate,
          })),
        ],
        extras: toArr(data.extra_items).map(item => ({
          id: item.id || uuid(),
          descricao: item.description,
          valor: item.value,
        })),
        descontos: toArr(data.discount_items).map(item => ({
          id: item.id || uuid(),
          descricao: item.description,
          valor: item.value,
        })),
        margemLucro: data.markup_percentage,
        precoManual: data.manual_price,
        createdAt: editingService?.createdAt || new Date(),
        updatedAt: new Date(),
      }

      // Calculate costs and price
      const calculated = calculateServiceOrder(serviceData)
      const finalService = { ...serviceData, calc: calculated }

      if (editingService) {
        await updateServiceOrder(finalService)
        toast.success('Serviço atualizado com sucesso!')
      } else {
        await createServiceOrder(finalService)
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
      await deleteServiceOrder(id)
      toast.success('Serviço excluído com sucesso!')
      loadData()
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
      toast.error('Erro ao excluir serviço')
    }
  }

  const addMaterialItem = () => {
    appendMaterial({
      id: uuid(),
      material_id: '',
      material_name: '',
      unit: 'm',
      meters: 0,
      width: 0,
      height: 0,
      quantity: 1,
      cost_per_unit_snapshot: 0,
    })
  }

  const addInkItem = () => {
    appendInk({
      id: uuid(),
      ink_id: '',
      ink_name: '',
      ml_used: 0,
      cost_per_liter_snapshot: 0,
    })
  }

  const addLaborItem = () => {
    appendLabor({
      id: uuid(),
      description: '',
      hours: 0,
      hourly_rate: 0,
    })
  }

  const addExtra = () => {
    appendExtra({
      id: uuid(),
      description: '',
      value: 0,
    })
  }

  const addDiscount = () => {
    appendDiscount({
      id: uuid(),
      description: '',
      value: 0,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie seus serviços ({services.length}/{planLimits.services === Infinity ? '∞' : planLimits.services})
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
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente *</Label>
                  <Controller
                    name="client_id"
                    control={form.control}
                    render={({ field }) => (
                      <SafeSelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Selecione o cliente"
                        options={clients.map(client => ({ value: client.id, label: client.nome }))}
                      />
                    )}
                  />
                  {form.formState.errors.client_id && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.client_id.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Serviço *</Label>
                  <Input
                    id="name"
                    placeholder="Nome do serviço"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field }) => (
                      <SafeSelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Selecione o status"
                        options={[
                          { value: "quote", label: "Orçamento" },
                          { value: "approved", label: "Aprovado" },
                          { value: "production", label: "Em Produção" },
                          { value: "completed", label: "Concluído" }
                        ]}
                      />
                    )}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Data de Entrega</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    {...form.register('delivery_date')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Descrição do serviço"
                    {...form.register('description')}
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
                  {materialFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-6 gap-2 items-end p-3 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs">Material</Label>
                        <Controller
                          name={`material_items.${index}.material_id`}
                          control={form.control}
                          render={({ field }) => (
                            <SafeSelect
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              placeholder="Selecionar"
                              options={materials.map(material => ({ 
                                value: material.id, 
                                label: `${material.nome} (${material.unidade})` 
                              }))}
                              className="h-8"
                            />
                          )}
                        />
                      </div>

                      {form.watch(`material_items.${index}.unit`) === 'm' ? (
                        <div className="space-y-1">
                          <Label className="text-xs">Metros</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8"
                            {...form.register(`material_items.${index}.meters`, { valueAsNumber: true })}
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
                              {...form.register(`material_items.${index}.width`, { valueAsNumber: true })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Altura (m)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-8"
                              {...form.register(`material_items.${index}.height`, { valueAsNumber: true })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Qtd</Label>
                            <Input
                              type="number"
                              min="1"
                              className="h-8"
                              {...form.register(`material_items.${index}.quantity`, { valueAsNumber: true })}
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
                          {...form.register(`material_items.${index}.cost_per_unit_snapshot`, { valueAsNumber: true })}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => removeMaterial(index)}
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
                  {inkFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-4 gap-2 items-end p-3 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs">Tinta</Label>
                        <Controller
                          name={`ink_items.${index}.ink_id`}
                          control={form.control}
                          render={({ field }) => (
                            <SafeSelect
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              placeholder="Selecionar"
                              options={inks.map(ink => ({ value: ink.id, label: ink.nome }))}
                              className="h-8"
                            />
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">ML Usados</Label>
                        <Input
                          type="number"
                          min="0"
                          className="h-8"
                          {...form.register(`ink_items.${index}.ml_used`, { valueAsNumber: true })}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Custo/L</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-8"
                          {...form.register(`ink_items.${index}.cost_per_liter_snapshot`, { valueAsNumber: true })}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => removeInk(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Labor */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Mão de Obra</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addLaborItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Mão de Obra
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {laborFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-4 gap-2 items-end p-3 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs">Descrição</Label>
                        <Input
                          placeholder="Ex: Impressão, Instalação"
                          className="h-8"
                          {...form.register(`labor_items.${index}.description`)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Horas</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          className="h-8"
                          {...form.register(`labor_items.${index}.hours`, { valueAsNumber: true })}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Valor/Hora</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-8"
                          {...form.register(`labor_items.${index}.hourly_rate`, { valueAsNumber: true })}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => removeLabor(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Extras and Discounts */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Extras</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addExtra}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {extraFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-3 gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Descrição</Label>
                          <Input
                            placeholder="Ex: Frete"
                            className="h-8"
                            {...form.register(`extra_items.${index}.description`)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8"
                            {...form.register(`extra_items.${index}.value`, { valueAsNumber: true })}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => removeExtra(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Descontos</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addDiscount}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {discountFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-3 gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Descrição</Label>
                          <Input
                            placeholder="Ex: Desconto cliente"
                            className="h-8"
                            {...form.register(`discount_items.${index}.description`)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8"
                            {...form.register(`discount_items.${index}.value`, { valueAsNumber: true })}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => removeDiscount(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

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
                      <Label htmlFor="markup_percentage">Margem de Lucro (%)</Label>
                      <Input
                        id="markup_percentage"
                        type="number"
                        step="0.1"
                        min="0"
                        max="1000"
                        {...form.register('markup_percentage', { valueAsNumber: true })}
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
                        {...form.register('manual_price', { valueAsNumber: true })}
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

      {/* Plan Limit Warning */}
      {!canAddMore && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Lock className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="font-medium text-amber-500">Limite de serviços atingido</p>
              <p className="text-sm text-muted-foreground">
                Você atingiu o limite de {planLimits.services} serviços do plano gratuito.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Pro
            </Button>
          </CardContent>
        </Card>
      )}

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
              {!searchTerm && statusFilter === 'all' && canAddMore && (
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
                  <TableHead>Custo</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {getClientName(service.clienteId)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{str(service.nome)}</div>
                        {/* Materiais do serviço com keys únicas */}
                        {toArr(service.itens).filter(item => item.tipo === 'material').length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Materiais: {toArr(service.itens)
                              .filter(item => item.tipo === 'material')
                              .map((item, idx) => (
                                <span key={`material-${service.id}-${item.id || idx}`}>
                                  {str(item.nome)}{idx < toArr(service.itens).filter(i => i.tipo === 'material').length - 1 ? ', ' : ''}
                                </span>
                              ))}
                          </div>
                        )}
                        {/* Tintas do serviço com keys únicas */}
                        {toArr(service.itens).filter(item => item.tipo === 'tinta').length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Tintas: {toArr(service.itens)
                              .filter(item => item.tipo === 'tinta')
                              .map((item, idx) => (
                                <span key={`ink-${service.id}-${item.id || idx}`}>
                                  {str(item.nome)}{idx < toArr(service.itens).filter(i => i.tipo === 'tinta').length - 1 ? ', ' : ''}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(service.status)}>
                        {getStatusText(service.status, locale)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {service.dataEntrega ? formatDate(service.dataEntrega, locale) : '-'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(num(service.calc?.custo, 0), currency, locale)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(num(service.calc?.preco, 0), currency, locale)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(num(service.calc?.lucro, 0), currency, locale)}
                    </TableCell>
                    <TableCell>
                      {(num(service.calc?.margem, 0) * 100).toFixed(1)}%
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
                                Tem certeza que deseja excluir o serviço "{str(service.nome)}"? Esta ação não pode ser desfeita.
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