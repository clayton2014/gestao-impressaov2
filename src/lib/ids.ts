/**
 * Sistema de IDs únicos e estáveis para eliminar warnings de keys
 * e garantir identificação consistente de entidades
 */

import { toArr } from '@/lib/safe';

export const uuid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback para ambientes sem crypto.randomUUID
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

export function ensureId<T extends { id?: string }>(obj: T): T & { id: string } {
  return { ...obj, id: obj.id ?? uuid() };
}

export function ensureNestedIds(serviceOrder: any): any {
  // Garantir que o próprio service order tenha ID
  const so = ensureId(serviceOrder);
  
  // Garantir IDs em todas as listas aninhadas
  so.itens = toArr(so.itens).map(ensureId);
  so.tintas = toArr(so.tintas).map(ensureId);
  so.extras = toArr(so.extras).map(ensureId);
  so.descontos = toArr(so.descontos).map(ensureId);
  so.pagamentos = toArr(so.pagamentos).map(ensureId);
  so.comentarios = toArr(so.comentarios).map(ensureId);
  
  return so;
}