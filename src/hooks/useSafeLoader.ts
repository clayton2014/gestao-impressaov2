"use client";
import { useEffect, useState } from "react";
import { logSupa } from "@/lib/error";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";

export function useSafeLoader<T>(loadFn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // garante auth: se não logado, manda para /login
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) { router.replace("/login"); return; }

        const res = await loadFn();
        if (alive) setData(res);
      } catch (err: any) {
        const msg = logSupa("page.load", err);
        if (alive) setErrorMsg(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, errorMsg, reload: () => setLoading(true) };
}