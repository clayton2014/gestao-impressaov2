/**
 * Sistema de configurações com defaults seguros para moeda e locale
 * Evita erros "Currency code is required with currency style"
 */

import { normalizeCurrency } from '@/hooks/useTranslation';

export interface AppSettings {
  locale: string;
  currency: string;
  impostosPct: number;
  markupPadraoPct: number;
  unidadePadrao: string;
  theme: string;
  empresa: {
    nome: string;
    logoUrl: string;
  };
}

export function defaultSettings(): AppSettings {
  const loc = (typeof navigator !== "undefined" ? navigator.language : "pt-BR") || "pt-BR";
  const cur = normalizeCurrency(undefined, loc);
  
  return {
    locale: loc,
    currency: cur,
    impostosPct: 0,
    markupPadraoPct: 40,
    unidadePadrao: "m",
    theme: "system",
    empresa: { 
      nome: "", 
      logoUrl: "" 
    }
  };
}

export async function loadSettings(storage: any): Promise<AppSettings> {
  try {
    const loaded = await storage.get("settings");
    const settings = { ...defaultSettings(), ...(loaded || {}) };
    
    // Garantir que currency seja sempre válida
    settings.currency = normalizeCurrency(settings.currency, settings.locale);
    
    // Persistir configurações normalizadas
    await storage.set("settings", settings);
    
    return settings;
  } catch (error) {
    console.warn('Erro ao carregar configurações, usando defaults:', error);
    return defaultSettings();
  }
}

export async function saveSettings(storage: any, settings: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const current = await loadSettings(storage);
    const updated = { ...current, ...settings };
    
    // Garantir que currency seja sempre válida
    updated.currency = normalizeCurrency(updated.currency, updated.locale);
    
    await storage.set("settings", updated);
    return updated;
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    throw error;
  }
}