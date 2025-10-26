"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Dict = Record<string, any>;
type Ctx = {
  locale: string;
  setLocale: (l: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
  currency: string;
  setCurrency: (c: string) => void;
  formatCurrency: (v: number, c?: string) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

const PT: Dict = {
  nav: { 
    dashboard: "Dashboard", 
    services: "Serviços", 
    clients: "Clientes", 
    materials: "Materiais", 
    inks: "Tintas", 
    reports: "Relatórios", 
    plans: "Planos", 
    settings: "Configurações" 
  },
  dashboard: {
    monthRevenue: "Receita do mês", 
    monthCost: "Custo do mês", 
    monthProfit: "Lucro do mês",
    marginPercent: "Margem", 
    inProduction: "Em produção", 
    pendingQuotes: "Orçamentos pendentes",
    revenueVsCost: "Receita x Custo", 
    topMaterials: "Materiais mais usados",
    noDataTitle: "Sem dados no período", 
    noDataSubtitle: "Crie alguns serviços para ver materiais mais usados"
  },
  common: { 
    upgrade: "Upgrade para Pro", 
    remaining: "{n} serviços restantes" 
  }
};

const EN: Dict = {
  nav: { 
    dashboard: "Dashboard", 
    services: "Services", 
    clients: "Clients", 
    materials: "Materials", 
    inks: "Inks", 
    reports: "Reports", 
    plans: "Plans", 
    settings: "Settings" 
  },
  dashboard: {
    monthRevenue: "Monthly revenue", 
    monthCost: "Monthly cost", 
    monthProfit: "Monthly profit",
    marginPercent: "Margin", 
    inProduction: "In production", 
    pendingQuotes: "Pending quotes",
    revenueVsCost: "Revenue vs Cost", 
    topMaterials: "Top materials",
    noDataTitle: "No data in period", 
    noDataSubtitle: "Create some jobs to see top materials"
  },
  common: { 
    upgrade: "Upgrade to Pro", 
    remaining: "{n} jobs remaining" 
  }
};

function get(dict: Dict, path: string) {
  return path.split(".").reduce((a: any, k) => (a && k in a ? a[k] : undefined), dict);
}

function humanize(key: string) {
  const last = key.split(".").pop() || key;
  return last
    .replace(/[_\-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, m => m.toUpperCase())
    .trim();
}

function interpolate(s: string, params?: Record<string, any>) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

const ALLOWED = new Set(["BRL", "USD"]);

function normalizeCurrency(c?: string, locale?: string) {
  const fallback = (locale || "pt-BR").startsWith("pt") ? "BRL" : "USD";
  if (!c) return fallback;
  const up = c.toUpperCase();
  return ALLOWED.has(up) ? up : fallback;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const detected = typeof navigator !== "undefined" ? navigator.language : "pt-BR";
  const [locale, setLocale] = useState<string>(detected || "pt-BR");
  const [currency, setCurrency] = useState<string>(normalizeCurrency(undefined, detected));

  useEffect(() => {
    const savedL = localStorage.getItem("pm:locale");
    const savedC = localStorage.getItem("pm:currency");
    if (savedL) setLocale(savedL);
    if (savedC) setCurrency(normalizeCurrency(savedC, savedL || locale));
  }, []);

  useEffect(() => localStorage.setItem("pm:locale", locale), [locale]);
  useEffect(() => localStorage.setItem("pm:currency", currency), [currency]);

  const dict = locale.startsWith("pt") ? PT : EN;

  const t = (key: string, params?: Record<string, any>) => {
    const v = get(dict, key);
    if (typeof v === "string") return interpolate(v, params);
    // fallback legível:
    return humanize(key);
  };

  const formatCurrency = (value: number, cur?: string) => {
    const c = normalizeCurrency(cur || currency, locale);
    const n = Number.isFinite(Number(value)) ? Number(value) : 0;
    try { 
      return new Intl.NumberFormat(locale, { style: "currency", currency: c }).format(n); 
    } catch { 
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n); 
    }
  };

  const v = useMemo<Ctx>(() => ({ locale, setLocale, t, currency, setCurrency, formatCurrency }), [locale, currency, dict]);

  return <I18nCtx.Provider value={v}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("I18nProvider ausente");
  return ctx;
}