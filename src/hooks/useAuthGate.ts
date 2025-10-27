"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuthGate() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [logged, setLogged] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supa");
        const { data } = await supabase.auth.getUser();
        if (!alive) return;
        const user = data.user ?? null;
        setLogged(!!user);
        // se não logado e não estamos já na rota de auth, ir para /login
        const here = typeof window !== "undefined" ? location.pathname : "/";
        if (!user && here !== "/login" && here !== "/register") {
          router.replace("/login");
        }
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => { alive = false; };
  }, [router]);

  return { checking, logged };
}