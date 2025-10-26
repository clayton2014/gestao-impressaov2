import { supabase } from "./supa";

export async function signUp({name,email,phone,password}:{name:string;email:string;phone:string;password:string}){
  const { data, error } = await supabase.auth.signUp({ 
    email: email.toLowerCase(), 
    password, 
    options:{ data:{ name, phone } }
  });
  
  if(error) throw error; 
  const user = data.user; 
  if(!user) throw new Error("Signup falhou");
  
  await supabase.from("profiles").upsert({ 
    id: user.id, 
    name, 
    email: email.toLowerCase(), 
    phone 
  });
  
  await supabase.from("settings").upsert({ user_id: user.id });
  
  return user;
}

export async function signIn({identifier,password}:{identifier:string;password:string}){
  const isPhone = !identifier.includes("@");
  
  if(isPhone){
    const { data, error } = await supabase.auth.signInWithPassword({ 
      phone: identifier.replace(/\D/g,""), 
      password 
    });
    if(!error) return data.user;
    throw new Error("Login por telefone indisponível neste projeto. Use seu e-mail.");
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: identifier.toLowerCase(), 
      password 
    });
    if(error) throw error; 
    return data.user;
  }
}

export async function signOut(){ 
  await supabase.auth.signOut(); 
}

export async function getUser(){ 
  return (await supabase.auth.getUser()).data.user; 
}