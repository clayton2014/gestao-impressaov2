export interface User {
  id: string;
  nome: string;
  email: string;
  plano: 'free' | 'pro';
  locale: 'pt-BR' | 'en';
  currency: 'BRL' | 'USD';
  empresa?: string;
  logoUrl?: string;
}

export interface Client {
  id: string;
  nome: string;
  doc?: string;
  contato?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  notas?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  nome: string;
  unidade: 'm' | 'm2';
  custoPorUnidade: number;
  fornecedor?: string;
  estoque?: number;
  createdAt: string;
}

export interface Ink {
  id: string;
  nome: string;
  custoPorLitro: number;
  fornecedor?: string;
  estoqueMl?: number;
  createdAt: string;
}

export interface ServiceOrderItem {
  id: string;
  materialId: string;
  unidade: 'm' | 'm2';
  metros?: number;
  largura?: number;
  altura?: number;
  quantidade?: number;
  custoPorUnidadeSnapshot: number;
}

export interface ServiceOrderInk {
  id: string;
  inkId: string;
  ml: number;
  custoPorLitroSnapshot: number;
}

export interface ServiceOrderExtra {
  id: string;
  descricao: string;
  valor: number;
}

export interface ServiceOrderDesconto {
  id: string;
  descricao: string;
  valor: number;
}

export interface ServiceOrderPagamento {
  id: string;
  dataISO: string;
  valor: number;
  metodo: string;
  obs?: string;
}

export interface ServiceOrderAnexo {
  id: string;
  nome: string;
  urlLocal: string;
}

export interface ServiceOrderComentario {
  id: string;
  autor: string;
  texto: string;
  createdAt: string;
}

export interface ServiceOrderCalc {
  custoMaterial: number;
  custoTinta: number;
  maoDeObra: number;
  extras: number;
  descontos: number;
  custoTotal: number;
  preco: number;
  lucro: number;
  margem: number;
}

export interface ServiceOrder {
  id: string;
  clienteId: string;
  nome: string;
  descricao?: string;
  status: 'Orçamento' | 'Aprovado' | 'Em produção' | 'Concluído';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  itens: ServiceOrderItem[];
  tintas: ServiceOrderInk[];
  laborHours?: number;
  laborRate?: number;
  extras?: ServiceOrderExtra[];
  descontos?: ServiceOrderDesconto[];
  precoManual?: number;
  markup?: number;
  calc: ServiceOrderCalc;
  pagamentos?: ServiceOrderPagamento[];
  anexos?: ServiceOrderAnexo[];
  comentarios?: ServiceOrderComentario[];
}

export interface AuditLog {
  id: string;
  entidade: 'client' | 'material' | 'ink' | 'service_order';
  entidadeId: string;
  acao: 'create' | 'update' | 'delete' | 'status';
  before?: any;
  after?: any;
  createdAt: string;
  userId: string;
}

export interface DashboardMetrics {
  receitaMes: number;
  custoMes: number;
  lucroMes: number;
  margemMes: number;
  pedidosProducao: number;
  orcamentosPendentes: number;
}

export type Locale = 'pt-BR' | 'en';
export type Currency = 'BRL' | 'USD';