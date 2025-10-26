// src/lib/datetime.ts
const LOCALE_FALLBACK = "pt-BR" as const;

export type AppLocale = "pt-BR" | "en-US";

export function mapLocale(locale?: string): AppLocale {
  if (!locale) return "pt-BR";
  return locale.toLowerCase().startsWith("pt") ? "pt-BR" : "en-US";
}

export function parseDateInput(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date && !isNaN(+input)) return input;
  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(+d) ? null : d;
  }
  if (typeof input === "string") {
    // tenta ISO, yyyy-mm-dd, etc.
    const d = new Date(input);
    if (!isNaN(+d)) return d;
    // dd/mm/yyyy
    const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const [_, dd, mm, yyyy] = m;
      const d2 = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      return isNaN(+d2) ? null : d2;
    }
  }
  return null;
}

export function formatDate(
  value: any,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = parseDateInput(value);
  if (!d) return "-";
  const loc = mapLocale(locale || (typeof navigator !== "undefined" ? navigator.language : LOCALE_FALLBACK));
  const opts: Intl.DateTimeFormatOptions = options ?? { year: "numeric", month: "2-digit", day: "2-digit" };
  try {
    return new Intl.DateTimeFormat(loc, opts).format(d);
  } catch {
    return new Intl.DateTimeFormat("pt-BR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  }
}

export function formatDateTime(
  value: any,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = parseDateInput(value);
  if (!d) return "-";
  const loc = mapLocale(locale || (typeof navigator !== "undefined" ? navigator.language : LOCALE_FALLBACK));
  const opts: Intl.DateTimeFormatOptions =
    options ?? { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
  try {
    return new Intl.DateTimeFormat(loc, opts).format(d);
  } catch {
    return new Intl.DateTimeFormat("pt-BR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
  }
}