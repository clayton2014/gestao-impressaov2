/**
 * Helpers defensivos para garantir que dados sejam sempre arrays válidos
 * e evitar erros como "services.filter is not a function"
 */

export function toArr<T>(v: any): T[] {
  // Se já é array, retorna como está
  if (Array.isArray(v)) return v as T[];
  
  // Se é objeto com propriedade items (formato comum de APIs)
  if (v && typeof v === "object") {
    if (Array.isArray((v as any).items)) return (v as any).items as T[];
    
    // Se veio como mapa/record {id: {...}, id2: {...}}
    const vals = Object.values(v as Record<string, T>);
    if (vals.length && typeof vals[0] === "object") return vals as T[];
  }
  
  // Se é string JSON, tenta fazer parse
  try {
    if (typeof v === "string") {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    }
  } catch (_) {
    // Ignora erro de parse
  }
  
  // Fallback: array vazio
  return [];
}

export const str = (x: any): string => (typeof x === "string" ? x : x == null ? "" : String(x));

export const low = (x: any): string => str(x).toLowerCase();

export const num = (x: any, defaultValue = 0): number => (Number.isFinite(Number(x)) ? Number(x) : defaultValue);

export const bool = (x: any): boolean => Boolean(x);

export const safe = (fn: () => any, fallback: any = null) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};