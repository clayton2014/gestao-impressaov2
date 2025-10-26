import type { Locale, Currency } from './types';
import { formatDate as formatDateUtil } from './datetime';

// Format currency
export function formatCurrency(value: number, currency: Currency, locale: Locale): string {
  const localeCode = locale === 'pt-BR' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Format date - usando a função estável do datetime.ts
export function formatDate(date: string | Date, locale?: Locale): string {
  return formatDateUtil(date, locale);
}

// Generate UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Plan limits
export function getPlanLimits(plan: 'free' | 'pro') {
  if (plan === 'pro') {
    return {
      services: Infinity,
      clients: Infinity,
      materials: Infinity,
      inks: Infinity,
      users: 5
    };
  }
  
  return {
    services: 50,
    clients: 50,
    materials: 10,
    inks: 10,
    users: 1
  };
}

// Check if feature is available
export function isFeatureAvailable(feature: string, plan: 'free' | 'pro'): boolean {
  if (plan === 'pro') return true;
  
  const freeFeatures = [
    'basicReports',
    'basicPdf',
    'localBackup'
  ];
  
  return freeFeatures.includes(feature);
}

// Status colors
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Orçamento':
    case 'quote':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'Aprovado':
    case 'approved':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'Em produção':
    case 'production':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    case 'Concluído':
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

// Status text
export function getStatusText(status: string, locale: Locale): string {
  if (locale === 'en') {
    switch (status) {
      case 'Orçamento':
      case 'quote':
        return 'Quote';
      case 'Aprovado':
      case 'approved':
        return 'Approved';
      case 'Em produção':
      case 'production':
        return 'In Production';
      case 'Concluído':
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  }
  
  // Portuguese
  switch (status) {
    case 'quote':
      return 'Orçamento';
    case 'approved':
      return 'Aprovado';
    case 'production':
      return 'Em produção';
    case 'completed':
      return 'Concluído';
    default:
      return status;
  }
}

// Calculate service costs
export function calculateServiceCosts(
  materialItems: any[],
  inkItems: any[],
  laborHours?: number,
  laborRate?: number,
  extras?: any[],
  discounts?: any[]
) {
  // Calculate material cost
  const material_cost = materialItems.reduce((sum, item) => {
    if (item.unit === 'm') {
      return sum + (item.cost_per_unit_snapshot * (item.meters || 0));
    } else {
      // m²
      const area = (item.width || 0) * (item.height || 0) * (item.quantity || 1);
      return sum + (item.cost_per_unit_snapshot * area);
    }
  }, 0);

  // Calculate ink cost
  const ink_cost = inkItems.reduce((sum, item) => {
    return sum + (item.cost_per_liter_snapshot * (item.ml_consumed / 1000));
  }, 0);

  // Calculate labor cost
  const labor_cost = (laborHours || 0) * (laborRate || 0);

  // Calculate extras and discounts
  const extras_total = extras?.reduce((sum, extra) => sum + (extra.value || 0), 0) || 0;
  const discounts_total = discounts?.reduce((sum, discount) => sum + (discount.value || 0), 0) || 0;

  // Calculate total cost
  const total_cost = material_cost + ink_cost + labor_cost + extras_total - discounts_total;

  return {
    material_cost: Number(material_cost.toFixed(2)),
    ink_cost: Number(ink_cost.toFixed(2)),
    labor_cost: Number(labor_cost.toFixed(2)),
    extras_total: Number(extras_total.toFixed(2)),
    discounts_total: Number(discounts_total.toFixed(2)),
    total_cost: Number(total_cost.toFixed(2))
  };
}

// Calculate service price
export function calculateServicePrice(
  totalCost: number,
  markupPercent?: number,
  manualPrice?: number
) {
  let sale_price: number;
  
  if (manualPrice !== undefined && manualPrice > 0) {
    sale_price = manualPrice;
  } else if (markupPercent !== undefined && markupPercent > 0) {
    sale_price = totalCost * (1 + markupPercent / 100);
  } else {
    sale_price = totalCost;
  }

  const profit = sale_price - totalCost;
  const margin_percent = sale_price > 0 ? (profit / sale_price) * 100 : 0;

  return {
    sale_price: Number(sale_price.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    margin_percent: Number(margin_percent.toFixed(2))
  };
}

// Export to CSV
export function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}