"use client";
import { useState, useEffect } from 'react';
import type { 
  Locale,
  Currency 
} from './types';

interface AppState {
  // UI State only - data comes from Supabase
  locale: Locale;
  currency: Currency;
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  currentPage: string;
}

// Default state
const defaultState: AppState = {
  locale: 'pt-BR' as Locale,
  currency: 'BRL' as Currency,
  theme: 'system' as const,
  sidebarOpen: true,
  currentPage: 'dashboard'
};

// Simple store implementation
let globalState = { ...defaultState };
const listeners = new Set<() => void>();

// Load from localStorage on client (UI preferences only)
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('gp-ui-preferences');
    if (stored) {
      const parsed = JSON.parse(stored);
      globalState = { ...defaultState, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load UI preferences from localStorage:', error);
  }
}

// Save to localStorage (UI preferences only)
const saveToStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('gp-ui-preferences', JSON.stringify(globalState));
    } catch (error) {
      console.warn('Failed to save UI preferences to localStorage:', error);
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
const detectTheme = (): 'light' | 'dark' | 'system' => {
  if (typeof window === 'undefined') {
    return 'system';
  }
  return 'system'; // Always default to system
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

// Actions object for UI state management
export const actions = {
  setLocale: (locale: Locale) => {
    const currency = getCurrencyFromLocale(locale);
    updateState(state => ({ ...state, locale, currency }));
  },
  
  setCurrency: (currency: Currency) => {
    updateState(state => ({ ...state, currency }));
  },
  
  setTheme: (theme: 'light' | 'dark' | 'system') => {
    updateState(state => ({ ...state, theme }));
    if (typeof window !== 'undefined') {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      } else {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
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
    setLocale: actions.setLocale,
    setCurrency: actions.setCurrency,
    setTheme: actions.setTheme,
    setSidebarOpen: actions.setSidebarOpen,
    setCurrentPage: actions.setCurrentPage
  };
};

// Default export
export default useAppStore;

// Initialize locale detection and theme after hydration
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const detectedLocale = detectLocale();
    
    // Only update if different from defaults and not already set by user
    if (globalState.locale === 'pt-BR' && detectedLocale !== 'pt-BR') {
      updateState(state => ({
        ...state,
        locale: detectedLocale,
        currency: getCurrencyFromLocale(detectedLocale)
      }));
    }
    
    // Apply theme to document
    const currentTheme = globalState.theme;
    if (currentTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    }
  }, 100);
}