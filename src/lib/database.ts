// Local Storage Database Implementation
import { toast } from 'sonner'
import type { 
  Client, 
  Material, 
  Ink, 
  ServiceOrder, 
  User,
  DashboardMetrics,
  AuditLog 
} from '@/lib/types'

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Current user ID (simulated)
const CURRENT_USER_ID = 'u1'

// Storage keys
const getStorageKey = (collection: string) => `gp:${CURRENT_USER_ID}:${collection}`

// Generic storage functions
class LocalDatabase {
  private async get<T>(collection: string): Promise<T[]> {
    try {
      const key = getStorageKey(collection)
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Error reading ${collection}:`, error)
      return []
    }
  }

  private async set<T>(collection: string, data: T[]): Promise<void> {
    try {
      const key = getStorageKey(collection)
      localStorage.setItem(key, JSON.stringify(data))
      
      // Broadcast change to other tabs
      window.dispatchEvent(new CustomEvent(`storage-${collection}`, { detail: data }))
    } catch (error) {
      console.error(`Error writing ${collection}:`, error)
      throw error
    }
  }

  async add<T extends { id?: string }>(collection: string, item: T): Promise<T> {
    const items = await this.get<T>(collection)
    const newItem = { ...item, id: item.id || generateUUID() } as T
    items.push(newItem)
    await this.set(collection, items)
    return newItem
  }

  async update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T> {
    const items = await this.get<T>(collection)
    const index = items.findIndex(item => item.id === id)
    if (index === -1) throw new Error('Item not found')
    
    const updatedItem = { ...items[index], ...updates }
    items[index] = updatedItem
    await this.set(collection, items)
    return updatedItem
  }

  async remove(collection: string, id: string): Promise<void> {
    const items = await this.get(collection)
    const filtered = items.filter((item: any) => item.id !== id)
    await this.set(collection, filtered)
  }

  async count(collection: string): Promise<number> {
    const items = await this.get(collection)
    return items.length
  }

  async find<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.get<T>(collection)
    return items.filter(predicate)
  }

  async findById<T extends { id: string }>(collection: string, id: string): Promise<T | undefined> {
    const items = await this.get<T>(collection)
    return items.find(item => item.id === id)
  }

  // Pagination and filtering
  async paginate<T>(
    collection: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    orderBy: string = 'createdAt',
    filters: Record<string, any> = {}
  ): Promise<{ data: T[], count: number, totalPages: number }> {
    let items = await this.get<T>(collection)
    
    // Apply filters
    if (search) {
      items = items.filter((item: any) => {
        const searchFields = ['nome', 'name', 'email', 'doc', 'document', 'fornecedor', 'supplier']
        return searchFields.some(field => 
          item[field]?.toString().toLowerCase().includes(search.toLowerCase())
        )
      })
    }

    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        items = items.filter((item: any) => item[key] === value)
      }
    })

    // Sort
    items.sort((a: any, b: any) => {
      const aVal = a[orderBy] || a.createdAt || ''
      const bVal = b[orderBy] || b.createdAt || ''
      return bVal.localeCompare(aVal)
    })

    const count = items.length
    const totalPages = Math.ceil(count / limit)
    const offset = (page - 1) * limit
    const data = items.slice(offset, offset + limit)

    return { data, count, totalPages }
  }
}

const db = new LocalDatabase()

// Initialize metadata
async function initializeMeta() {
  const metaKey = getStorageKey('meta')
  const meta = localStorage.getItem(metaKey)
  if (!meta) {
    const initialMeta = {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      lastBackupAt: null
    }
    localStorage.setItem(metaKey, JSON.stringify(initialMeta))
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  initializeMeta()
}

// ============= CLIENTS =============
export async function getClients(page = 1, limit = 10, search = '', orderBy = 'createdAt') {
  try {
    const result = await db.paginate<Client>('clients', page, limit, search, orderBy)
    return result
  } catch (error: any) {
    console.error('Erro ao buscar clientes:', error)
    toast.error('Erro ao carregar clientes: ' + error.message)
    return { data: [], count: 0, totalPages: 0 }
  }
}

export async function createClient(client: Omit<Client, 'id' | 'createdAt'>) {
  try {
    // Check plan limits
    const { canCreate } = await checkPlanLimits('clients')
    if (!canCreate) {
      toast.error('Limite do plano gratuito atingido (50 clientes). Faça upgrade para Pro!')
      throw new Error('Plan limit reached')
    }

    const newClient: Client = {
      ...client,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    }

    const result = await db.add('clients', newClient)
    
    // Audit log
    await createAuditLog('client', result.id, 'create', null, result)
    
    toast.success('Cliente criado com sucesso!')
    return result
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error)
    if (!error.message.includes('Plan limit')) {
      toast.error('Erro ao criar cliente: ' + error.message)
    }
    throw error
  }
}

export async function updateClient(id: string, client: Partial<Client>) {
  try {
    const before = await db.findById<Client>('clients', id)
    const result = await db.update('clients', id, client)
    
    // Audit log
    await createAuditLog('client', id, 'update', before, result)
    
    toast.success('Cliente atualizado com sucesso!')
    return result
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error)
    toast.error('Erro ao atualizar cliente: ' + error.message)
    throw error
  }
}

export async function deleteClient(id: string) {
  try {
    const before = await db.findById<Client>('clients', id)
    await db.remove('clients', id)
    
    // Audit log
    await createAuditLog('client', id, 'delete', before, null)
    
    toast.success('Cliente excluído com sucesso!')
  } catch (error: any) {
    console.error('Erro ao excluir cliente:', error)
    toast.error('Erro ao excluir cliente: ' + error.message)
    throw error
  }
}

export async function getClientById(id: string): Promise<Client | undefined> {
  return await db.findById<Client>('clients', id)
}

// ============= MATERIALS =============
export async function getMaterials(page = 1, limit = 10, search = '', orderBy = 'createdAt') {
  try {
    const result = await db.paginate<Material>('materials', page, limit, search, orderBy)
    return result
  } catch (error: any) {
    console.error('Erro ao buscar materiais:', error)
    toast.error('Erro ao carregar materiais: ' + error.message)
    return { data: [], count: 0, totalPages: 0 }
  }
}

export async function createMaterial(material: Omit<Material, 'id' | 'createdAt'>) {
  try {
    // Check plan limits
    const { canCreate } = await checkPlanLimits('materials')
    if (!canCreate) {
      toast.error('Limite do plano gratuito atingido (10 materiais). Faça upgrade para Pro!')
      throw new Error('Plan limit reached')
    }

    const newMaterial: Material = {
      ...material,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    }

    const result = await db.add('materials', newMaterial)
    
    // Audit log
    await createAuditLog('material', result.id, 'create', null, result)
    
    toast.success('Material criado com sucesso!')
    return result
  } catch (error: any) {
    console.error('Erro ao criar material:', error)
    if (!error.message.includes('Plan limit')) {
      toast.error('Erro ao criar material: ' + error.message)
    }
    throw error
  }
}

export async function updateMaterial(id: string, material: Partial<Material>) {
  try {
    const before = await db.findById<Material>('materials', id)
    const result = await db.update('materials', id, material)
    
    // Audit log
    await createAuditLog('material', id, 'update', before, result)
    
    toast.success('Material atualizado com sucesso!')
    return result
  } catch (error: any) {
    console.error('Erro ao atualizar material:', error)
    toast.error('Erro ao atualizar material: ' + error.message)
    throw error
  }
}

export async function deleteMaterial(id: string) {
  try {
    const before = await db.findById<Material>('materials', id)
    await db.remove('materials', id)
    
    // Audit log
    await createAuditLog('material', id, 'delete', before, null)
    
    toast.success('Material excluído com sucesso!')
  } catch (error: any) {
    console.error('Erro ao excluir material:', error)
    toast.error('Erro ao excluir material: ' + error.message)
    throw error
  }
}

export async function getMaterialById(id: string): Promise<Material | undefined> {
  return await db.findById<Material>('materials', id)
}

// ============= INKS =============
export async function getInks(page = 1, limit = 10, search = '', orderBy = 'createdAt') {
  try {
    const result = await db.paginate<Ink>('inks', page, limit, search, orderBy)
    return result
  } catch (error: any) {
    console.error('Erro ao buscar tintas:', error)
    toast.error('Erro ao carregar tintas: ' + error.message)
    return { data: [], count: 0, totalPages: 0 }
  }
}

export async function createInk(ink: Omit<Ink, 'id' | 'createdAt'>) {
  try {
    // Check plan limits
    const { canCreate } = await checkPlanLimits('inks')
    if (!canCreate) {
      toast.error('Limite do plano gratuito atingido (10 tintas). Faça upgrade para Pro!')
      throw new Error('Plan limit reached')
    }

    const newInk: Ink = {
      ...ink,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    }

    const result = await db.add('inks', newInk)
    
    // Audit log
    await createAuditLog('ink', result.id, 'create', null, result)
    
    toast.success('Tinta criada com sucesso!')
    return result
  } catch (error: any) {
    console.error('Erro ao criar tinta:', error)
    if (!error.message.includes('Plan limit')) {
      toast.error('Erro ao criar tinta: ' + error.message)
    }
    throw error
  }
}

export async function updateInk(id: string, ink: Partial<Ink>) {
  try {
    const before = await db.findById<Ink>('inks', id)
    const result = await db.update('inks', id, ink)
    
    // Audit log
    await createAuditLog('ink', id, 'update', before, result)
    
    toast.success('Tinta atualizada com sucesso!')
    return result
  } catch (error: any) {
    console.error('Erro ao atualizar tinta:', error)
    toast.error('Erro ao atualizar tinta: ' + error.message)
    throw error
  }
}

export async function deleteInk(id: string) {
  try {
    const before = await db.findById<Ink>('inks', id)
    await db.remove('inks', id)
    
    // Audit log
    await createAuditLog('ink', id, 'delete', before, null)
    
    toast.success('Tinta excluída com sucesso!')
  } catch (error: any) {
    console.error('Erro ao excluir tinta:', error)
    toast.error('Erro ao excluir tinta: ' + error.message)
    throw error
  }
}

export async function getInkById(id: string): Promise<Ink | undefined> {
  return await db.findById<Ink>('inks', id)
}

// ============= SERVICE ORDERS =============
export async function getServiceOrders(page = 1, limit = 10, search = '', status = '', orderBy = 'createdAt') {
  try {
    const filters = status ? { status } : {}
    const result = await db.paginate<ServiceOrder>('service_orders', page, limit, search, orderBy, filters)
    return result
  } catch (error: any) {
    console.error('Erro ao buscar ordens de serviço:', error)
    toast.error('Erro ao carregar ordens de serviço: ' + error.message)
    return { data: [], count: 0, totalPages: 0 }
  }
}

export async function createServiceOrder(serviceOrder: Omit<ServiceOrder, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Check plan limits
    const { canCreate } = await checkPlanLimits('service_orders')
    if (!canCreate) {
      toast.error('Limite do plano gratuito atingido (50 serviços). Faça upgrade para Pro!')
      throw new Error('Plan limit reached')
    }

    const newServiceOrder: ServiceOrder = {
      ...serviceOrder,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await db.add('service_orders', newServiceOrder)
    
    // Audit log
    await createAuditLog('service_order', result.id, 'create', null, result)
    
    toast.success('Ordem de serviço criada com sucesso!')
    return result
  } catch (error: any) {
    console.error('Erro ao criar ordem de serviço:', error)
    if (!error.message.includes('Plan limit')) {
      toast.error('Erro ao criar ordem de serviço: ' + error.message)
    }
    throw error
  }
}

export async function updateServiceOrder(id: string, serviceOrder: Partial<ServiceOrder>) {
  try {
    const before = await db.findById<ServiceOrder>('service_orders', id)
    const updates = {
      ...serviceOrder,
      updatedAt: new Date().toISOString()
    }
    const result = await db.update('service_orders', id, updates)
    
    // Audit log
    await createAuditLog('service_order', id, 'update', before, result)
    
    toast.success('Ordem de serviço atualizada com sucesso!')
    return result
  } catch (error: any) {
    console.error('Erro ao atualizar ordem de serviço:', error)
    toast.error('Erro ao atualizar ordem de serviço: ' + error.message)
    throw error
  }
}

export async function deleteServiceOrder(id: string) {
  try {
    const before = await db.findById<ServiceOrder>('service_orders', id)
    await db.remove('service_orders', id)
    
    // Audit log
    await createAuditLog('service_order', id, 'delete', before, null)
    
    toast.success('Ordem de serviço excluída com sucesso!')
  } catch (error: any) {
    console.error('Erro ao excluir ordem de serviço:', error)
    toast.error('Erro ao excluir ordem de serviço: ' + error.message)
    throw error
  }
}

export async function getServiceOrderById(id: string): Promise<ServiceOrder | undefined> {
  return await db.findById<ServiceOrder>('service_orders', id)
}

// ============= DASHBOARD METRICS =============
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const serviceOrders = await db.get<ServiceOrder>('service_orders')
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const thisMonthOrders = serviceOrders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate.getMonth() === currentMonth && 
             orderDate.getFullYear() === currentYear
    })
    
    const receitaMes = thisMonthOrders
      .filter(o => o.status === 'Concluído')
      .reduce((sum, o) => sum + (o.calc?.preco || 0), 0)
      
    const custoMes = thisMonthOrders
      .filter(o => o.status === 'Concluído')
      .reduce((sum, o) => sum + (o.calc?.custoTotal || 0), 0)
      
    const lucroMes = receitaMes - custoMes
    const margemMes = receitaMes > 0 ? (lucroMes / receitaMes) * 100 : 0
    
    const pedidosProducao = serviceOrders
      .filter(o => o.status === 'Em produção').length
      
    const orcamentosPendentes = serviceOrders
      .filter(o => o.status === 'Orçamento').length
    
    return {
      receitaMes,
      custoMes,
      lucroMes,
      margemMes,
      pedidosProducao,
      orcamentosPendentes
    }
  } catch (error: any) {
    console.error('Erro ao buscar métricas do dashboard:', error)
    return {
      receitaMes: 0,
      custoMes: 0,
      lucroMes: 0,
      margemMes: 0,
      pedidosProducao: 0,
      orcamentosPendentes: 0
    }
  }
}

// ============= AUDIT LOGS =============
export async function createAuditLog(
  entidade: 'client' | 'material' | 'ink' | 'service_order',
  entidadeId: string,
  acao: 'create' | 'update' | 'delete' | 'status',
  before: any,
  after: any
) {
  try {
    const auditLog: AuditLog = {
      id: generateUUID(),
      entidade,
      entidadeId,
      acao,
      before,
      after,
      createdAt: new Date().toISOString(),
      userId: CURRENT_USER_ID
    }

    await db.add('audit_logs', auditLog)
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error)
  }
}

export async function getAuditLogs(page = 1, limit = 10) {
  try {
    const result = await db.paginate<AuditLog>('audit_logs', page, limit, '', 'createdAt')
    return result
  } catch (error: any) {
    console.error('Erro ao buscar logs de auditoria:', error)
    return { data: [], count: 0, totalPages: 0 }
  }
}

// ============= PLAN LIMITS =============
export async function checkPlanLimits(entityType: 'clients' | 'materials' | 'inks' | 'service_orders') {
  try {
    // Get user plan from localStorage
    const userPlan = localStorage.getItem('userPlan') || 'free'

    if (userPlan === 'pro') {
      return { canCreate: true, limit: Infinity, current: 0 }
    }

    // Free plan limits
    const limits = {
      clients: 50,
      materials: 10,
      inks: 10,
      service_orders: 50
    }

    const current = await db.count(entityType)
    const limit = limits[entityType]
    const canCreate = current < limit

    return { canCreate, limit, current }
  } catch (error: any) {
    console.error('Erro ao verificar limites do plano:', error)
    return { canCreate: false, limit: 0, current: 0 }
  }
}

// ============= BACKUP/RESTORE =============
export async function exportData() {
  try {
    const data = {
      meta: JSON.parse(localStorage.getItem(getStorageKey('meta')) || '{}'),
      clients: await db.get('clients'),
      materials: await db.get('materials'),
      inks: await db.get('inks'),
      service_orders: await db.get('service_orders'),
      audit_logs: await db.get('audit_logs')
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gp-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Update last backup date
    const meta = JSON.parse(localStorage.getItem(getStorageKey('meta')) || '{}')
    meta.lastBackupAt = new Date().toISOString()
    localStorage.setItem(getStorageKey('meta'), JSON.stringify(meta))

    toast.success('Backup exportado com sucesso!')
  } catch (error: any) {
    console.error('Erro ao exportar backup:', error)
    toast.error('Erro ao exportar backup: ' + error.message)
  }
}

export async function importData(file: File) {
  try {
    const text = await file.text()
    const data = JSON.parse(text)

    // Validate structure
    if (!data.meta || !data.clients || !data.materials || !data.inks || !data.service_orders) {
      throw new Error('Arquivo de backup inválido')
    }

    // Import data
    await db.set('clients', data.clients)
    await db.set('materials', data.materials)
    await db.set('inks', data.inks)
    await db.set('service_orders', data.service_orders)
    if (data.audit_logs) {
      await db.set('audit_logs', data.audit_logs)
    }

    // Update meta
    localStorage.setItem(getStorageKey('meta'), JSON.stringify(data.meta))

    toast.success('Backup importado com sucesso!')
    
    // Reload page to reflect changes
    window.location.reload()
  } catch (error: any) {
    console.error('Erro ao importar backup:', error)
    toast.error('Erro ao importar backup: ' + error.message)
  }
}

// ============= SEED DATA =============
export async function seedDatabase() {
  try {
    // Check if data already exists
    const clientsCount = await db.count('clients')
    if (clientsCount > 0) {
      toast.info('Dados de exemplo já existem!')
      return false
    }

    // Create sample clients
    const clients = [
      { nome: 'Empresa ABC Ltda', doc: '12.345.678/0001-90', email: 'contato@abc.com', telefone: '(11) 99999-9999', endereco: 'Rua das Flores, 123 - São Paulo, SP' },
      { nome: 'João Silva', doc: '123.456.789-00', email: 'joao@email.com', telefone: '(11) 88888-8888', endereco: 'Av. Principal, 456 - São Paulo, SP' },
      { nome: 'Maria Santos', doc: '987.654.321-00', email: 'maria@email.com', telefone: '(11) 77777-7777', endereco: 'Rua Comercial, 789 - São Paulo, SP' },
      { nome: 'Comércio XYZ', doc: '98.765.432/0001-10', email: 'contato@xyz.com', telefone: '(11) 66666-6666', endereco: 'Av. Central, 321 - São Paulo, SP' },
      { nome: 'Pedro Costa', doc: '456.789.123-00', email: 'pedro@email.com', telefone: '(11) 55555-5555', endereco: 'Rua Nova, 654 - São Paulo, SP' }
    ]

    for (const client of clients) {
      await createClient(client)
    }

    // Create sample materials
    const materials = [
      { nome: 'Vinil Adesivo', unidade: 'm2' as const, custoPorUnidade: 15.50, fornecedor: 'Fornecedor A', estoque: 100 },
      { nome: 'Lona Vinílica', unidade: 'm2' as const, custoPorUnidade: 8.90, fornecedor: 'Fornecedor B', estoque: 50 },
      { nome: 'Papel Fotográfico', unidade: 'm2' as const, custoPorUnidade: 25.00, fornecedor: 'Fornecedor A', estoque: 30 },
      { nome: 'Adesivo Transparente', unidade: 'm2' as const, custoPorUnidade: 18.75, fornecedor: 'Fornecedor C', estoque: 75 },
      { nome: 'Tecido Sublimação', unidade: 'm' as const, custoPorUnidade: 12.30, fornecedor: 'Fornecedor B', estoque: 200 }
    ]

    for (const material of materials) {
      await createMaterial(material)
    }

    // Create sample inks
    const inks = [
      { nome: 'Tinta Eco-Solvente Cyan', custoPorLitro: 45.00, fornecedor: 'Fornecedor A', estoqueMl: 2000 },
      { nome: 'Tinta Eco-Solvente Magenta', custoPorLitro: 45.00, fornecedor: 'Fornecedor A', estoqueMl: 1800 },
      { nome: 'Tinta Eco-Solvente Yellow', custoPorLitro: 45.00, fornecedor: 'Fornecedor A', estoqueMl: 1500 },
      { nome: 'Tinta Eco-Solvente Black', custoPorLitro: 42.00, fornecedor: 'Fornecedor A', estoqueMl: 2200 }
    ]

    for (const ink of inks) {
      await createInk(ink)
    }

    // Get created data for service orders
    const createdClients = await db.get<Client>('clients')
    const createdMaterials = await db.get<Material>('materials')
    const createdInks = await db.get<Ink>('inks')

    // Create sample service orders
    const serviceOrders = [
      {
        clienteId: createdClients[0].id,
        nome: 'Banner Promocional',
        descricao: 'Banner para promoção de verão',
        status: 'Em produção' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        itens: [{
          id: generateUUID(),
          materialId: createdMaterials[1].id,
          unidade: 'm2' as const,
          largura: 3,
          altura: 2,
          quantidade: 1,
          custoPorUnidadeSnapshot: createdMaterials[1].custoPorUnidade
        }],
        tintas: [{
          id: generateUUID(),
          inkId: createdInks[0].id,
          ml: 150,
          custoPorLitroSnapshot: createdInks[0].custoPorLitro
        }],
        laborHours: 2,
        laborRate: 25.00,
        markup: 30,
        calc: {
          custoMaterial: 53.40,
          custoTinta: 6.75,
          maoDeObra: 50.00,
          extras: 0,
          descontos: 0,
          custoTotal: 110.15,
          preco: 143.20,
          lucro: 33.05,
          margem: 23.08
        }
      },
      {
        clienteId: createdClients[1].id,
        nome: 'Adesivos Personalizados',
        descricao: 'Adesivos para produtos',
        status: 'Concluído' as const,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        itens: [{
          id: generateUUID(),
          materialId: createdMaterials[0].id,
          unidade: 'm2' as const,
          largura: 1,
          altura: 1,
          quantidade: 10,
          custoPorUnidadeSnapshot: createdMaterials[0].custoPorUnidade
        }],
        tintas: [{
          id: generateUUID(),
          inkId: createdInks[1].id,
          ml: 200,
          custoPorLitroSnapshot: createdInks[1].custoPorLitro
        }],
        laborHours: 1.5,
        laborRate: 25.00,
        markup: 40,
        calc: {
          custoMaterial: 155.00,
          custoTinta: 9.00,
          maoDeObra: 37.50,
          extras: 0,
          descontos: 0,
          custoTotal: 201.50,
          preco: 282.10,
          lucro: 80.60,
          margem: 28.57
        }
      }
    ]

    for (const serviceOrder of serviceOrders) {
      await createServiceOrder(serviceOrder)
    }

    toast.success('Dados de exemplo criados com sucesso!')
    return true
  } catch (error: any) {
    console.error('Erro ao criar dados de exemplo:', error)
    toast.error('Erro ao criar dados de exemplo: ' + error.message)
    return false
  }
}

// ============= CALCULATIONS =============
export function calculateServiceOrder(
  itens: ServiceOrder['itens'],
  tintas: ServiceOrder['tintas'],
  laborHours?: number,
  laborRate?: number,
  extras?: { id: string; descricao: string; valor: number }[],
  descontos?: { id: string; descricao: string; valor: number }[],
  markup?: number,
  precoManual?: number
) {
  // Calculate material cost
  const custoMaterial = itens.reduce((sum, item) => {
    if (item.unidade === 'm') {
      return sum + (item.custoPorUnidadeSnapshot * (item.metros || 0))
    } else {
      // m²
      const area = (item.largura || 0) * (item.altura || 0) * (item.quantidade || 1)
      return sum + (item.custoPorUnidadeSnapshot * area)
    }
  }, 0)

  // Calculate ink cost
  const custoTinta = tintas.reduce((sum, tinta) => {
    return sum + (tinta.custoPorLitroSnapshot * (tinta.ml / 1000))
  }, 0)

  // Calculate labor cost
  const maoDeObra = (laborHours || 0) * (laborRate || 0)

  // Calculate extras and discounts
  const extrasTotal = extras?.reduce((sum, extra) => sum + extra.valor, 0) || 0
  const descontosTotal = descontos?.reduce((sum, desconto) => sum + desconto.valor, 0) || 0

  // Calculate total cost
  const custoTotal = custoMaterial + custoTinta + maoDeObra + extrasTotal - descontosTotal

  // Calculate price
  let preco: number
  if (precoManual !== undefined) {
    preco = precoManual
  } else if (markup !== undefined) {
    preco = custoTotal * (1 + markup / 100)
  } else {
    preco = custoTotal
  }

  // Calculate profit and margin
  const lucro = preco - custoTotal
  const margem = preco > 0 ? (lucro / preco) * 100 : 0

  return {
    custoMaterial: Number(custoMaterial.toFixed(2)),
    custoTinta: Number(custoTinta.toFixed(2)),
    maoDeObra: Number(maoDeObra.toFixed(2)),
    extras: Number(extrasTotal.toFixed(2)),
    descontos: Number(descontosTotal.toFixed(2)),
    custoTotal: Number(custoTotal.toFixed(2)),
    preco: Number(preco.toFixed(2)),
    lucro: Number(lucro.toFixed(2)),
    margem: Number(margem.toFixed(2))
  }
}

// ============= UTILS =============
export function getCurrentUser() {
  return {
    id: CURRENT_USER_ID,
    nome: 'Usuário Local',
    email: 'usuario@local.com',
    plano: localStorage.getItem('userPlan') || 'free'
  }
}

export function setUserPlan(plan: 'free' | 'pro') {
  localStorage.setItem('userPlan', plan)
  toast.success(`Plano alterado para ${plan === 'pro' ? 'Pro' : 'Gratuito'}!`)
}