"use client";

import { useMemo } from "react";
import useAppStore from "@/lib/store"; // nosso hook da store (client-only)

const LOCALE_FALLBACK = "pt-BR";
const CURRENCY_SET = new Set(["BRL", "USD"]);

function mapLocale(locale?: string): "pt-BR" | "en-US" {
  if (!locale) return "pt-BR";
  return locale.toLowerCase().startsWith("pt") ? "pt-BR" : "en-US";
}

function normalizeCurrency(curr?: string, locale?: string): "BRL" | "USD" {
  const loc = mapLocale(locale);
  const fallback = loc === "pt-BR" ? "BRL" : "USD";
  if (!curr) return fallback;
  const up = curr.toUpperCase();
  return (CURRENCY_SET.has(up) ? (up as "BRL" | "USD") : fallback);
}

/**
 * Função standalone, SSR-safe.
 * Pode ser usada fora de componentes React (ex.: libs, utils, PDFs).
 */
export function formatCurrency(
  value: number,
  currency?: string,
  locale?: string
): string {
  const loc = mapLocale(locale);
  const curr = normalizeCurrency(currency, loc);
  const n = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(loc, { style: "currency", currency: curr }).format(n);
  } catch {
    // Fallback ultra-seguro
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  }
}

// Dicionários (adicione suas chaves se já usar i18n)
const dict: Record<string, Record<string, string>> = {
  "pt-BR": {},
  "en-US": {},
};

/**
 * Hook de tradução + formatação.
 * Lê locale/currency do store (client) e expõe t() e formatCurrency().
 */
export function useTranslation() {
  const localeFromStore = useAppStore((s) => s.locale);
  const currencyFromStore = useAppStore((s) => s.currency);

  const locale = useMemo(() => mapLocale(localeFromStore), [localeFromStore]);
  const currency = useMemo(
    () => normalizeCurrency(currencyFromStore, locale),
    [currencyFromStore, locale]
  );

  const t = useMemo(() => {
    const table = dict[locale] || {};
    return (key: string, fallback?: string) => table[key] ?? fallback ?? key;
  }, [locale]);

  // versão ligada ao locale atual do app
  const formatCurrencyBound = (value: number, overrideCurrency?: string) =>
    formatCurrency(value, overrideCurrency ?? currency, locale);

  return { t, locale, currency, formatCurrency: formatCurrencyBound };
}

export default useTranslation;

// NO FINAL do arquivo - reexports das funções de data
export { formatDate, formatDateTime } from "@/lib/datetime";