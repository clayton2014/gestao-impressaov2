import { supabase } from "@/lib/supa";

const uid = async()=> (await supabase.auth.getUser()).data.user?.id;

export async function getCounts(){
  const tables = ["clients","materials","inks","service_orders"];
  const out:any = {};
  for (const t of tables){
    const { count, error } = await supabase.from(t).select("*",{ count:"exact", head:true });
    out[t] = error ? `erro: ${error.message}` : (count ?? 0);
  }
  console.info("[diagnóstico]", out);
  return out;
}

export async function seedSupabase(){
  const user_id = await uid(); if(!user_id) throw new Error("Não autenticado");
  // 1) básicos
  const { data: client } = await supabase.from("clients").insert([{
    user_id, name:"Cliente Exemplo", email:"exemplo@cliente.com", phone:"+5511999999999"
  }]).select().single();

  const { data: mat } = await supabase.from("materials").insert([{
    user_id, name:"Vinil Fosco 1,06m", unit:"m", cost_per_unit: 18.5
  }]).select().single();

  const { data: ink } = await supabase.from("inks").insert([{
    user_id, name:"CMYK EcoSolv", cost_per_liter: 120.0
  }]).select().single();

  // 2) serviço com item e tinta
  const { data: so } = await supabase.from("service_orders").insert([{
    user_id, client_id: client?.id ?? null, name:"Faixa Promocional", status:"Aprovado",
    labor_hours: 1.5, labor_rate: 60, markup: 40
  }]).select().single();

  if (so) {
    await supabase.from("service_items").insert([{
      service_id: so.id, material_id: mat?.id ?? null, unit:"m", meters: 5, quantity:1, unit_cost_snapshot: mat?.cost_per_unit ?? 0
    }]);
    await supabase.from("service_inks").insert([{
      service_id: so.id, ink_id: ink?.id ?? null, ml: 120, cost_per_liter_snapshot: ink?.cost_per_liter ?? 0
    }]);
  }
}

export async function migrateFromLocalStorage(){
  // importa dados locais comuns (se existirem) e grava com user_id
  const user_id = await uid(); if(!user_id) throw new Error("Não autenticado");
  if (typeof window === "undefined") return { moved:false };

  const read = (k:string)=> {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : []; } catch { return []; }
  };

  const clients = read("clients");
  const materials = read("materials");
  const inks = read("inks");
  const services = read("service_orders") || read("services") || [];

  if (clients.length) await supabase.from("clients").insert(clients.map((c:any)=>({ ...c, id:undefined, user_id })));
  if (materials.length) await supabase.from("materials").insert(materials.map((m:any)=>({ ...m, id:undefined, user_id })));
  if (inks.length) await supabase.from("inks").insert(inks.map((i:any)=>({ ...i, id:undefined, user_id })));

  // serviços: insere só cabeçalho; relacionamentos exigem re-mapeamento (opcional)
  if (services.length){
    for (const s of services){
      const { items = [], inks: sin = [], ...rest } = s;
      const { data: so } = await supabase.from("service_orders").insert([{ ...rest, id:undefined, user_id }]).select().single();
      if (so) {
        if (Array.isArray(items) && items.length){
          await supabase.from("service_items").insert(items.map((it:any)=>({ ...it, id:undefined, service_id: so.id })));
        }
        if (Array.isArray(sin) && sin.length){
          await supabase.from("service_inks").insert(sin.map((ik:any)=>({ ...ik, id:undefined, service_id: so.id })));
        }
      }
    }
  }
  return { moved:true };
}