"use client";
import React from "react";
import { useRouter } from "next/navigation";
import useAppStore, { actions } from "@/lib/store";
import useTranslation from "@/hooks/useTranslation";
import { SunMoon, Globe, DollarSign, User as UserIcon, ChevronDown, Bot } from "lucide-react";

async function saveSettings(patch: any) {
  actions.patchSettings(patch);
  try {
    const { SettingsDAO } = await import("@/lib/dao"); await SettingsDAO.upsert(patch);
  } catch {}
  if (patch.theme) {
    try {
      const { setTheme } = await import("next-themes/dist/index"); setTheme(patch.theme);
    } catch {
      if (patch.theme === "dark") document.documentElement.classList.add("dark");
      if (patch.theme === "light") document.documentElement.classList.remove("dark");
    }
  }
}

function Dropdown({button, children}:{button: React.ReactNode; children: React.ReactNode}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(()=>{
    const onDoc = (e: MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return ()=> document.removeEventListener("mousedown", onDoc);
  },[]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={()=>setOpen(o=>!o)}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted"
      >
        {button}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-popover shadow-lg p-1 z-50">
          {children}
        </div>
      )}
    </div>
  );
}
function Item({active, onClick, children}:{active?:boolean; onClick?:()=>void; children:React.ReactNode}) {
  return (
    <button onClick={onClick} className={`w-full text-left px-3 py-2 rounded-lg hover:bg-muted ${active ? "bg-muted" : ""}`}>
      {children}
    </button>
  );
}

// Busca nome real do Supabase (profiles) com fallbacks
function useDisplayUser() {
  const local = useAppStore((s:any)=>{
    const arr = Array.isArray(s.users) ? s.users : [];
    const uid = s?.auth?.userId;
    return uid ? arr.find((u:any)=>u?.id===uid) ?? null : null;
  });

  const [sbUser, setSbUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supa");
        const cur = await supabase.auth.getUser();
        if (alive) setSbUser(cur.data.user ?? null);

        // assina sessão
        const sub = supabase.auth.onAuthStateChange((_e, sess) => {
          if (alive) setSbUser(sess?.user ?? null);
        });

        // carrega perfil quando tiver user
        if (cur.data.user?.id) {
          const { data, error } = await supabase
            .from("profiles")
            .select("name,email,phone")
            .eq("id", cur.data.user.id)
            .maybeSingle();
          if (!error && alive) setProfile(data ?? null);
        }

        return () => sub.data.subscription?.unsubscribe?.();
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const name =
    profile?.name ||
    local?.nome ||
    local?.name ||
    sbUser?.user_metadata?.name ||
    sbUser?.email ||
    "Usuário";

  return { name };
}

export default function Header() {
  const router = useRouter();
  const { t } = useTranslation();
  const { name } = useDisplayUser();

  const settings = useAppStore((s:any)=> s?.settings ?? {});
  const currency = settings.currency ?? "BRL";
  const locale = settings.locale ?? "pt-BR";
  const theme = settings.theme ?? "system";

  async function onLogout(){
    try {
      const { supabase } = await import("@/lib/supa");
      await supabase.auth.signOut();
    } catch {}
    router.replace("/login");
  }

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="flex items-center gap-3">
        <Bot className="h-5 w-5 text-primary" />
        <span className="font-medium">GraphPrint</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Tema */}
        <Dropdown button={<><SunMoon className="h-4 w-4"/><span>{t("Tema")}:</span><strong>{theme}</strong></>}>
          <Item active={theme==="system"} onClick={()=>saveSettings({theme:"system"})}>{t("Sistema")}</Item>
          <Item active={theme==="light"} onClick={()=>saveSettings({theme:"light"})}>{t("Claro")}</Item>
          <Item active={theme==="dark"} onClick={()=>saveSettings({theme:"dark"})}>{t("Escuro")}</Item>
        </Dropdown>

        {/* Moeda */}
        <Dropdown button={<><DollarSign className="h-4 w-4"/><span>{t("Moeda")}:</span><strong>{currency}</strong></>}>
          <Item active={currency==="BRL"} onClick={()=>saveSettings({currency:"BRL"})}>BRL — Real</Item>
          <Item active={currency==="USD"} onClick={()=>saveSettings({currency:"USD"})}>USD — Dollar</Item>
        </Dropdown>

        {/* Idioma */}
        <Dropdown button={<><Globe className="h-4 w-4"/><span>{t("Idioma")}:</span><strong>{locale}</strong></>}>
          <Item active={locale==="pt-BR"} onClick={()=>saveSettings({locale:"pt-BR", currency:"BRL"})}>Português (BR)</Item>
          <Item active={locale==="en-US"} onClick={()=>saveSettings({locale:"en-US", currency:"USD"})}>English (US)</Item>
        </Dropdown>

        {/* Conta */}
        <Dropdown button={<><UserIcon className="h-4 w-4"/><span>{name}</span></>}>
          <Item onClick={()=>router.push("/settings")}>{t("Minha conta")}</Item>
          <hr className="my-1 border-border" />
          <Item onClick={onLogout}>{t("Sair")}</Item>
        </Dropdown>
      </div>
    </header>
  );
}