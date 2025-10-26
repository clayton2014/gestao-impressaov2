import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          plan: 'free' | 'pro'
          locale: string
          currency: string
          company_name?: string
          company_logo?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          plan?: 'free' | 'pro'
          locale?: string
          currency?: string
          company_name?: string
          company_logo?: string
        }
        Update: {
          name?: string
          plan?: 'free' | 'pro'
          locale?: string
          currency?: string
          company_name?: string
          company_logo?: string
        }
      }
      clients: {
        Row: {
          id: string
          owner_id: string
          name: string
          document: string
          email?: string
          phone?: string
          address?: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          owner_id: string
          name: string
          document: string
          email?: string
          phone?: string
          address?: string
          notes?: string
        }
        Update: {
          name?: string
          document?: string
          email?: string
          phone?: string
          address?: string
          notes?: string
        }
      }
      materials: {
        Row: {
          id: string
          owner_id: string
          name: string
          unit: 'm' | 'm2'
          cost_per_unit: number
          supplier?: string
          stock?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          owner_id: string
          name: string
          unit: 'm' | 'm2'
          cost_per_unit: number
          supplier?: string
          stock?: number
        }
        Update: {
          name?: string
          unit?: 'm' | 'm2'
          cost_per_unit?: number
          supplier?: string
          stock?: number
        }
      }
      inks: {
        Row: {
          id: string
          owner_id: string
          name: string
          cost_per_liter: number
          supplier?: string
          stock_ml?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          owner_id: string
          name: string
          cost_per_liter: number
          supplier?: string
          stock_ml?: number
        }
        Update: {
          name?: string
          cost_per_liter?: number
          supplier?: string
          stock_ml?: number
        }
      }
      service_orders: {
        Row: {
          id: string
          owner_id: string
          client_id: string
          name: string
          description?: string
          status: 'quote' | 'approved' | 'production' | 'completed'
          delivery_date?: string
          material_items: any[]
          ink_items: any[]
          labor_hours?: number
          labor_rate?: number
          extras?: any[]
          discounts?: any[]
          markup_percent?: number
          sale_price?: number
          calculations: {
            material_cost: number
            ink_cost: number
            labor_cost: number
            extras_total: number
            discounts_total: number
            total_cost: number
            sale_price: number
            profit: number
            margin_percent: number
          }
          payments?: any[]
          attachments?: any[]
          comments?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          owner_id: string
          client_id: string
          name: string
          description?: string
          status?: 'quote' | 'approved' | 'production' | 'completed'
          delivery_date?: string
          material_items?: any[]
          ink_items?: any[]
          labor_hours?: number
          labor_rate?: number
          extras?: any[]
          discounts?: any[]
          markup_percent?: number
          sale_price?: number
          calculations?: any
          payments?: any[]
          attachments?: any[]
          comments?: string
        }
        Update: {
          client_id?: string
          name?: string
          description?: string
          status?: 'quote' | 'approved' | 'production' | 'completed'
          delivery_date?: string
          material_items?: any[]
          ink_items?: any[]
          labor_hours?: number
          labor_rate?: number
          extras?: any[]
          discounts?: any[]
          markup_percent?: number
          sale_price?: number
          calculations?: any
          payments?: any[]
          attachments?: any[]
          comments?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          action: 'create' | 'update' | 'delete'
          before_data?: any
          after_data?: any
          created_at: string
        }
        Insert: {
          user_id: string
          entity_type: string
          entity_id: string
          action: 'create' | 'update' | 'delete'
          before_data?: any
          after_data?: any
        }
        Update: never
      }
    }
  }
}