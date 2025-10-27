// Utilitários de cálculo para serviços

export interface ServiceItem {
  unit: 'm' | 'm2';
  quantity?: number;
  meters?: number;
  width?: number;
  height?: number;
  unit_cost_snapshot?: number;
}

export interface ServiceInk {
  ml?: number;
  cost_per_liter_snapshot?: number;
}

export interface ServiceTotalsInput {
  items?: ServiceItem[];
  inks?: ServiceInk[];
  labor_hours?: number;
  labor_rate?: number;
  extras?: number[];
  discounts?: number[];
  markup?: number;
  manual_price?: number;
}

export interface ServiceTotals {
  custo_total: number;
  preco: number;
  lucro: number;
  margem: number;
}

/**
 * Calcula quantidade de material baseado na unidade
 */
export function materialQty(item: ServiceItem): number {
  const qty = item.quantity || 1;
  
  if (item.unit === 'm') {
    return qty * (item.meters || 0);
  } else if (item.unit === 'm2') {
    return qty * (item.width || 0) * (item.height || 0);
  }
  
  return 0;
}

/**
 * Calcula custo de um material
 */
export function materialCost(item: ServiceItem): number {
  const qty = materialQty(item);
  const unitCost = item.unit_cost_snapshot || 0;
  return qty * unitCost;
}

/**
 * Calcula custo de uma tinta
 */
export function inkCost(ink: ServiceInk): number {
  const ml = ink.ml || 0;
  const costPerLiter = ink.cost_per_liter_snapshot || 0;
  return (ml / 1000) * costPerLiter;
}

/**
 * Calcula totais do serviço
 */
export function serviceTotals(input: ServiceTotalsInput): ServiceTotals {
  const items = input.items || [];
  const inks = input.inks || [];
  const laborHours = input.labor_hours || 0;
  const laborRate = input.labor_rate || 0;
  const extras = input.extras || [];
  const discounts = input.discounts || [];
  const markup = input.markup || 40;
  const manualPrice = input.manual_price;

  // Custo dos materiais
  const materialsCost = items.reduce((sum, item) => sum + materialCost(item), 0);
  
  // Custo das tintas
  const inksCost = inks.reduce((sum, ink) => sum + inkCost(ink), 0);
  
  // Custo da mão de obra
  const laborCost = laborHours * laborRate;
  
  // Extras e descontos
  const extrasCost = extras.reduce((sum, extra) => sum + (extra || 0), 0);
  const discountsCost = discounts.reduce((sum, discount) => sum + (discount || 0), 0);
  
  // Custo total
  const custo_total = materialsCost + inksCost + laborCost + extrasCost - discountsCost;
  
  // Preço (manual ou com markup)
  const preco = manualPrice ?? custo_total * (1 + markup / 100);
  
  // Lucro e margem
  const lucro = preco - custo_total;
  const margem = preco > 0 ? lucro / preco : 0;

  return {
    custo_total,
    preco,
    lucro,
    margem
  };
}