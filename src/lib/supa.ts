// src/lib/supa.ts
let _supabase: any = null;

export const SUPA_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function getSupabase() {
  if (_supabase) return _supabase;

  if (!SUPA_URL || !SUPA_ANON) {
    console.warn("[supa] Env ausente no build; usando cliente no-op para evitar crash");
    _supabase = {
      auth: {
        getUser: async () => ({ data: { user: null } }),
        getSession: async () => ({ data: { session: null } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: async () => ({ data: null, error: new Error("supabase env missing") }),
        insert: async () => ({ data: null, error: new Error("supabase env missing") }),
        update: async () => ({ data: null, error: new Error("supabase env missing") }),
        delete: async () => ({ data: null, error: new Error("supabase env missing") }),
      }),
      channel: () => ({ on(){return this}, subscribe(){return {}} }),
      removeChannel: () => {},
    };
    return _supabase;
  }

  const { createClient } = require("@supabase/supabase-js");
  _supabase = createClient(SUPA_URL, SUPA_ANON, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _supabase;
}

export const supabase = getSupabase();


import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);