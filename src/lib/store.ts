"use client";
import { useState, useEffect, useCallback } from 'react';
import type { 
  User, 
  AuthUser,
  Client, 
  Material, 
  Ink, 
  ServiceOrder, 
  DashboardMetrics,
  Locale,
  Currency 
} from './types';
import { hashPassword, verifyPassword } from './auth';

interface Settings {
  company_name: string;
  company_logo?: string;
  default_markup: number;
  default_unit: 'm' | 'm2';
  tax_percent: number;
  dashboard_cards: string[];
}

interface AppState {
  // User & Settings
  user: User | null;
  settings: Settings;
  locale: Locale;
  currency: Currency;
  theme: 'light' | 'dark';
  
  // Auth
  users: AuthUser[];
  auth: { userId: string | null };
  
  // Data
  clients: Client[];
  materials: Material[];
  inks: Ink[];
  services: ServiceOrder[];
  
  // UI State
  sidebarOpen: boolean;
  currentPage: string;
}

// Simple UUID generator
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Default state
const defaultState: AppState = {
  user: null,
  settings: {
    company_name: 'Gráfica Digital Pro',
    default_markup: 30,
    default_unit: 'm2' as const,
    tax_percent: 0,
    dashboard_cards: ['revenue', 'cost', 'profit', 'margin', 'production', 'quotes']
  },
  locale: 'pt-BR' as Locale,
  currency: 'BRL' as Currency,
  theme: 'dark' as const,
  users: [],
  auth: { userId: null },
  clients: [],
  materials: [],
  inks: [],
  services: [],
  sidebarOpen: true,
  currentPage: 'dashboard'
};

// Simple store implementation without zustand
let globalState = { ...defaultState };
const listeners = new Set<() => void>();

// Load from localStorage on client
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('gp-app-store');
    if (stored) {
      const parsed = JSON.parse(stored);
      globalState = { ...defaultState, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
  }
}

// Save to localStorage
const saveToStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('gp-app-store', JSON.stringify(globalState));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }
};

// Update state and notify listeners
const updateState = (updater: (state: typeof globalState) => typeof globalState) => {
  globalState = updater(globalState);
  saveToStorage();
  listeners.forEach(listener => listener());
};

// Detect browser language safely (only on client)
const detectLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return 'pt-BR';
  }
  const browserLang = navigator.language;
  return browserLang.startsWith('pt') ? 'pt-BR' : 'en';
};

// Auto currency based on locale
const getCurrencyFromLocale = (locale: Locale): Currency => {
  return locale === 'pt-BR' ? 'BRL' : 'USD';
};

// Detect theme preference
const detectTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Export functions for non-React usage
export function getState(): AppState {
  return { ...globalState };
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const update = typeof patch === 'function' ? patch(globalState) : patch;
  updateState(state => ({ ...state, ...update }));
}

// Hook to use the store with selector
export function useAppStore<T = AppState>(selector?: (state: AppState) => T): T {
  const [state, setLocalState] = useState(() => selector ? selector(globalState) : globalState as T);

  useEffect(() => {
    const listener = () => {
      const newState = selector ? selector(globalState) : globalState as T;
      setLocalState(newState);
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, [selector]);

  return state;
}

// Actions object for easier usage
export const actions = {
  setUser: (user: User | null) => {
    updateState(state => ({ ...state, user }));
  },
  
  patchSettings: (newSettings: Partial<Settings>) => {
    updateState(state => ({
      ...state,
      settings: { ...state.settings, ...newSettings }
    }));
  },
  
  setClients: (clients: Client[]) => {
    updateState(state => ({ ...state, clients }));
  },
  
  setMaterials: (materials: Material[]) => {
    updateState(state => ({ ...state, materials }));
  },
  
  setInks: (inks: Ink[]) => {
    updateState(state => ({ ...state, inks }));
  },
  
  setServices: (services: ServiceOrder[]) => {
    updateState(state => ({ ...state, services }));
  },
  
  setLocale: (locale: Locale) => {
    const currency = getCurrencyFromLocale(locale);
    updateState(state => ({ ...state, locale, currency }));
  },
  
  setCurrency: (currency: Currency) => {
    updateState(state => ({ ...state, currency }));
  },
  
  setTheme: (theme: 'light' | 'dark') => {
    updateState(state => ({ ...state, theme }));
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },
  
  setSidebarOpen: (open: boolean) => {
    updateState(state => ({ ...state, sidebarOpen: open }));
  },
  
  setCurrentPage: (page: string) => {
    updateState(state => ({ ...state, currentPage: page }));
  },

  // Auth actions
  async registerUser(input: { nome: string; email: string; telefone: string; senha: string }) {
    const s = getState();
    const email = input.email.trim().toLowerCase();
    const telefone = input.telefone.replace(/\D/g, "");
    
    if (s.users.some(u => u.email === email)) {
      throw new Error("E-mail já cadastrado");
    }
    if (s.users.some(u => u.telefone === telefone)) {
      throw new Error("Telefone já cadastrado");
    }
    
    const { salt, hash } = await hashPassword(input.senha);
    const user: AuthUser = { 
      id: generateId(), 
      nome: input.nome.trim(), 
      email, 
      telefone, 
      passHash: hash, 
      passSalt: salt, 
      createdAt: new Date().toISOString() 
    };
    
    updateState(state => ({ 
      ...state, 
      users: [...state.users, user], 
      auth: { userId: user.id } 
    }));
    
    return user;
  },

  async login(input: { ident: string; senha: string }) {
    const s = getState();
    const ident = input.ident.trim().toLowerCase();
    const isPhone = /\d/.test(ident) && !ident.includes("@");
    const normalizedPhone = ident.replace(/\D/g, "");
    
    const user = s.users.find(u => 
      isPhone ? u.telefone === normalizedPhone : u.email === ident
    );
    
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    
    const ok = await verifyPassword(input.senha, user.passSalt, user.passHash);
    if (!ok) {
      throw new Error("Senha inválida");
    }
    
    updateState(state => ({ ...state, auth: { userId: user.id } }));
    return user;
  },

  logout() { 
    updateState(state => ({ ...state, auth: { userId: null } }));
  },

  getCurrentUser(): AuthUser | null { 
    const s = getState(); 
    return s.users.find(u => u.id === s.auth.userId) ?? null; 
  }
};

// Hook with actions (legacy compatibility)
export const useAppStoreWithActions = () => {
  const state = useAppStore();
  
  return {
    ...state,
    setUser: actions.setUser,
    setLocale: actions.setLocale,
    setCurrency: actions.setCurrency,
    setTheme: actions.setTheme,
    setSidebarOpen: actions.setSidebarOpen,
    setCurrentPage: actions.setCurrentPage,
    updateSettings: actions.patchSettings
  };
};

// Default export
export default useAppStore;

// Initialize locale detection and theme after hydration
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const detectedLocale = detectLocale();
    const detectedTheme = detectTheme();
    
    // Only update if different from defaults and not already set by user
    if (globalState.locale === 'pt-BR' && detectedLocale !== 'pt-BR') {
      updateState(state => ({
        ...state,
        locale: detectedLocale,
        currency: getCurrencyFromLocale(detectedLocale)
      }));
    }
    
    // Apply theme to document
    document.documentElement.classList.toggle('dark', globalState.theme === 'dark');
  }, 100);
}