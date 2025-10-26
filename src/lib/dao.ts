import { supabase } from "./supa";
const uid = async()=> (await supabase.auth.getUser()).data.user?.id;

export const ClientsDAO={
  async list(){ const {data,error}=await supabase.from("clients").select("*").order("created_at",{ascending:false}); if(error) throw error; return data??[]; },
  async create(input:any){ const user_id=await uid(); if(!user_id) throw new Error("unauth"); const {data,error}=await supabase.from("clients").insert({ ...input, user_id }).select().single(); if(error) throw error; return data; },
  async update(id:string, patch:any){ const {data,error}=await supabase.from("clients").update(patch).eq("id",id).select().single(); if(error) throw error; return data; },
  async remove(id:string){ const {error}=await supabase.from("clients").delete().eq("id",id); if(error) throw error; }
};

export const MaterialsDAO={
  async list(){ const {data,error}=await supabase.from("materials").select("*").order("created_at",{ascending:false}); if(error) throw error; return data??[]; },
  async create(input:any){ const user_id=await uid(); if(!user_id) throw new Error("unauth"); const {data,error}=await supabase.from("materials").insert({ ...input, user_id }).select().single(); if(error) throw error; return data; },
  async update(id:string, patch:any){ const {data,error}=await supabase.from("materials").update(patch).eq("id",id).select().single(); if(error) throw error; return data; },
  async remove(id:string){ const {error}=await supabase.from("materials").delete().eq("id",id); if(error) throw error; }
};

export const InksDAO={
  async list(){ const {data,error}=await supabase.from("inks").select("*").order("created_at",{ascending:false}); if(error) throw error; return data??[]; },
  async create(input:any){ const user_id=await uid(); if(!user_id) throw new Error("unauth"); const {data,error}=await supabase.from("inks").insert({ ...input, user_id }).select().single(); if(error) throw error; return data; },
  async update(id:string, patch:any){ const {data,error}=await supabase.from("inks").update(patch).eq("id",id).select().single(); if(error) throw error; return data; },
  async remove(id:string){ const {error}=await supabase.from("inks").delete().eq("id",id); if(error) throw error; }
};

export const ServicesDAO={
  async list(){
    const {data,error}=await supabase.from("service_orders").select(`
      *, client:clients(*),
      items:service_items(*), inks:service_inks(*)
    `).order("created_at",{ascending:false});
    if(error) throw error; return data??[];
  },
  async create(input:any){
    const user_id=await uid(); if(!user_id) throw new Error("unauth");
    const {items=[],inks=[],...rest}=input;
    const {data:so,error}=await supabase.from("service_orders").insert({ ...rest, user_id }).select().single();
    if(error) throw error; const sid=so.id;
    const ins=async(tbl:string,rows:any[])=> rows.length && await supabase.from(tbl).insert(rows.map(r=>({...r,service_id:sid})));
    await ins("service_items",items); await ins("service_inks",inks);
    return await this.get(sid);
  },
  async get(id:string){
    const {data,error}=await supabase.from("service_orders").select(`
      *, client:clients(*),
      items:service_items(*), inks:service_inks(*)
    `).eq("id",id).single(); if(error) throw error; return data;
  },
  async update(id:string,patch:any){
    const {items,inks,...rest}=patch;
    if(Object.keys(rest).length){ const {error}=await supabase.from("service_orders").update(rest).eq("id",id); if(error) throw error; }
    const rep=async(tbl:string,rows:any[])=>{ await supabase.from(tbl).delete().eq("service_id",id); if(rows) rows.length&&await supabase.from(tbl).insert(rows.map((r:any)=>({...r,service_id:id}))); };
    if(items) await rep("service_items",items);
    if(inks) await rep("service_inks",inks);
    return await this.get(id);
  },
  async remove(id:string){ const {error}=await supabase.from("service_orders").delete().eq("id",id); if(error) throw error; }
};

export const SettingsDAO={
  async get(){ const u=await uid(); if(!u) throw new Error("unauth"); const {data,error}=await supabase.from("settings").select("*").eq("user_id",u).maybeSingle(); if(error) throw error; return data; },
  async upsert(patch:any){ const u=await uid(); if(!u) throw new Error("unauth"); const {data,error}=await supabase.from("settings").upsert({ user_id:u, ...patch }).select().single(); if(error) throw error; return data; }
};