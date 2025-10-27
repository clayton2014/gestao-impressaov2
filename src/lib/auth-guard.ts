import { supabase } from "./supa";

export async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Não autenticado");
  return id;
}