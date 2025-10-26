"use client";
import { useState, useEffect, useCallback } from 'react';
import type { 
  User, 
  Client, 
  Material, 
  Ink, 
  ServiceOrder, 
  DashboardMetrics,
  Locale,
  Currency 
} from './types';

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
  
  // Data
  clients: Client[];
  materials: Material[];
  inks: Ink[];
  services: ServiceOrder[];
  
  // UI State
  sidebarOpen: boolean;
  currentPage: string;
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