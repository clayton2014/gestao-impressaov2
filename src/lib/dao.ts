import { TABLE } from "@/lib/tables";
import { supabase } from "./supa";
import { logSupa } from "./error";
import { requireUserId } from "./auth-guard";

const ok = <T>(data: T, error: any, where: string): T => {
  if (error) { const m = logSupa(where, error); throw new Error(m); }
  // @ts-ignore
  return data ?? [];
};

function isRelErr(e:any){
  const m = (e?.message || "").toLowerCase();
  return m.includes("could not find a relationship") || m.includes("schema cache");
}

export const ClientsDAO = {
  async list() {
    const { data, error } = await supabase.from(TABLE.CLIENTS).select("*").order("created_at",{ascending:false});
    return ok(data, error, "clients.list");
  },
  async create(input: any) {
    const user_id = await requireUserId();
    const { data, error } = await supabase.from(TABLE.CLIENTS).insert({ ...input, user_id }).select().single();
    return ok(data, error, "clients.create");
  },
  async update(id: string, patch: any) {
    const { data, error } = await supabase.from(TABLE.CLIENTS).update(patch).eq("id", id).select().single();
    return ok(data, error, "clients.update");
  },
  async remove(id: string) {
    const { error } = await supabase.from(TABLE.CLIENTS).delete().eq("id", id);
    ok(null, error, "clients.remove");
  },
};

export const MaterialsDAO = {
  async list() {
    const { data, error } = await supabase.from(TABLE.MATERIALS).select("*").order("created_at",{ascending:false});
    return ok(data, error, "materials.list");
  },
  async create(input: any) {
    const user_id = await requireUserId();
    const { data, error } = await supabase.from(TABLE.MATERIALS).insert({ ...input, user_id }).select().single();
    return ok(data, error, "materials.create");
  },
  async update(id: string, patch: any) {
    const { data, error } = await supabase.from(TABLE.MATERIALS).update(patch).eq("id", id).select().single();
    return ok(data, error, "materials.update");
  },
  async remove(id: string) {
    const { error } = await supabase.from(TABLE.MATERIALS).delete().eq("id", id);
    ok(null, error, "materials.remove");
  },
};

export const InksDAO = {
  async list() {
    const { data, error } = await supabase.from(TABLE.INKS).select("*").order("created_at",{ascending:false});
    return ok(data, error, "inks.list");
  },
  async create(input: any) {
    const user_id = await requireUserId();
    const { data, error } = await supabase.from(TABLE.INKS).insert({ ...input, user_id }).select().single();
    return ok(data, error, "inks.create");
  },
  async update(id: string, patch: any) {
    const { data, error } = await supabase.from(TABLE.INKS).update(patch).eq("id", id).select().single();
    return ok(data, error, "inks.update");
  },
  async remove(id: string) {
    const { error } = await supabase.from(TABLE.INKS).delete().eq("id", id);
    ok(null, error, "inks.remove");
  },
};

export const ServicesDAO = {
  async list(){
    // 1ª tentativa: embed pelo FK nomeado
    let { data, error } = await supabase
      .from(TABLE.SERVICE_ORDERS)
      .select(`
        *,
        client:${TABLE.CLIENTS}!service_orders_client_id_fkey(*),
        items:${TABLE.SERVICE_ITEMS}(*),
        inks:${TABLE.SERVICE_INKS}(*),
        extras:${TABLE.SERVICE_EXTRAS}(*),
        discounts:${TABLE.SERVICE_DISCOUNTS}(*),
        payments:${TABLE.SERVICE_PAYMENTS}(*),
        comments:${TABLE.SERVICE_COMMENTS}(*)
      `)
      .order("created_at",{ascending:false});

    if (!error) return data ?? [];

    // Fallback: sem embed + buscar clients e mesclar
    if (isRelErr(error)) {
      const { data: rows, error: e1 } = await supabase
        .from(TABLE.SERVICE_ORDERS)
        .select("*")
        .order("created_at",{ascending:false});
      if (e1) { logSupa("service_orders.list.base", e1); throw new Error(e1.message || "Falha list base"); }

      const ids = [...new Set(rows.map(r => r.client_id).filter(Boolean))];
      let map:any = {};
      if (ids.length) {
        const { data: cls, error: e2 } = await supabase
          .from(TABLE.CLIENTS)
          .select("*")
          .in("id", ids);
        if (e2) { logSupa("service_orders.list.clients", e2); }
        if (cls) map = Object.fromEntries(cls.map(c => [c.id, c]));
      }

      // Itens/inks (opcional no fallback; se precisar, carregar e agrupar)
      const merge = rows.map(r => ({ ...r, client: map[r.client_id] ?? null }));
      return merge;
    }

    const msg = logSupa("service_orders.list", error);
    throw new Error(msg);
  },

  async get(id:string){
    // 1ª tentativa: embed com hint
    let { data, error } = await supabase
      .from(TABLE.SERVICE_ORDERS)
      .select(`
        *,
        client:${TABLE.CLIENTS}!service_orders_client_id_fkey(*),
        items:${TABLE.SERVICE_ITEMS}(*),
        inks:${TABLE.SERVICE_INKS}(*),
        extras:${TABLE.SERVICE_EXTRAS}(*),
        discounts:${TABLE.SERVICE_DISCOUNTS}(*),
        payments:${TABLE.SERVICE_PAYMENTS}(*),
        comments:${TABLE.SERVICE_COMMENTS}(*)
      `)
      .eq("id", id)
      .single();

    if (!error) return data;

    // Fallback: sem embed + fetch client/items/inks
    if (isRelErr(error)) {
      const { data: so, error: e1 } = await supabase.from(TABLE.SERVICE_ORDERS).select("*").eq("id", id).single();
      if (e1) { logSupa("service_orders.get.base", e1); throw new Error(e1.message || "Falha get base"); }

      let client = null, items:any[] = [], inks:any[] = [];
      if (so?.client_id) {
        const { data: c } = await supabase.from(TABLE.CLIENTS).select("*").eq("id", so.client_id).maybeSingle();
        client = c ?? null;
      }
      const i1 = await supabase.from(TABLE.SERVICE_ITEMS).select("*").eq("service_id", id);
      if (!i1.error) items = i1.data ?? [];
      const i2 = await supabase.from(TABLE.SERVICE_INKS).select("*").eq("service_id", id);
      if (!i2.error) inks = i2.data ?? [];

      return { ...so, client, items, inks };
    }

    const msg = logSupa("service_orders.get", error);
    throw new Error(msg);
  },

  async create(input: any) {
    const user_id = await requireUserId();
    const { data, error } = await supabase.from(TABLE.SERVICE_ORDERS).insert({ ...input, user_id }).select().single();
    return ok(data, error, "service_orders.create");
  },

  async update(id: string, patch: any) {
    const { data, error } = await supabase.from(TABLE.SERVICE_ORDERS).update(patch).eq("id", id).select().single();
    return ok(data, error, "service_orders.update");
  },

  async remove(id: string) {
    const { error } = await supabase.from(TABLE.SERVICE_ORDERS).delete().eq("id", id);
    ok(null, error, "service_orders.remove");
  },
};

export const SettingsDAO = {
  async get() {
    const user_id = await requireUserId();
    const { data, error } = await supabase.from(TABLE.SETTINGS).select("*").eq("user_id", user_id).single();
    return ok(data, error, "settings.get");
  },
  async upsert(input: any) {
    const user_id = await requireUserId();
    const { data, error } = await supabase.from(TABLE.SETTINGS).upsert({ ...input, user_id }).select().single();
    return ok(data, error, "settings.upsert");
  },
};