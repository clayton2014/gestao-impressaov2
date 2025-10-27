export type SupaErr = { message?: string; details?: string; hint?: string; code?: string; status?: number } | any;

export function supaMessage(err: SupaErr): string {
  if (!err) return "Erro desconhecido";
  if (typeof err === "string") return err;
  if (err.message) return [err.message, err.details, err.hint].filter(Boolean).join(" — ");
  if (err.error?.message) return [err.error.message, err.error.details, err.error.hint].filter(Boolean).join(" — ");
  try { const txt = JSON.stringify(err); return txt === "{}" ? String(err) : txt; } catch { return String(err); }
}

export function logSupa(where: string, err: SupaErr) {
  const msg = supaMessage(err);
  // imprime legível no console
  console.error(`[${where}]`, msg, err?.code ? { code: err.code, status: err.status } : err);
  return msg;
}