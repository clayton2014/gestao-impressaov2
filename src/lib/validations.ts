import { z } from 'zod';

// Service Order validation
export const serviceOrderSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  name: z.string().min(1, 'Nome do serviço é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['quote', 'approved', 'production', 'completed']),
  delivery_date: z.string().optional(),
  material_items: z.array(z.object({
    id: z.string(),
    material_id: z.string(),
    material_name: z.string(),
    unit: z.enum(['m', 'm2']),
    meters: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    quantity: z.number().optional(),
    cost_per_unit_snapshot: z.number().min(0)
  })).default([]),
  ink_items: z.array(z.object({
    id: z.string(),
    ink_id: z.string(),
    ink_name: z.string(),
    ml_consumed: z.number().min(0),
    cost_per_liter_snapshot: z.number().min(0)
  })).default([]),
  labor_hours: z.number().min(0).optional(),
  labor_rate: z.number().min(0).optional(),
  extras: z.array(z.object({
    id: z.string(),
    description: z.string(),
    value: z.number()
  })).default([]),
  discounts: z.array(z.object({
    id: z.string(),
    description: z.string(),
    value: z.number()
  })).default([]),
  markup_percent: z.number().min(0).optional(),
  sale_price: z.number().min(0).optional(),
  payments: z.array(z.object({
    id: z.string(),
    date: z.string(),
    value: z.number(),
    method: z.string(),
    notes: z.string().optional()
  })).default([]),
  comments: z.string().optional()
});

export type ServiceOrderFormData = z.infer<typeof serviceOrderSchema>;

// Settings validation
export const settingsSchema = z.object({
  company_name: z.string().min(1, 'Nome da empresa é obrigatório'),
  company_logo: z.string().optional(),
  default_markup: z.number().min(0, 'Markup deve ser positivo'),
  default_unit: z.enum(['m', 'm2']),
  tax_percent: z.number().min(0).max(100, 'Taxa deve estar entre 0 e 100%'),
  dashboard_cards: z.array(z.string()).default([]),
  theme: z.enum(['light', 'dark'])
});

export type SettingsFormData = z.infer<typeof settingsSchema>;