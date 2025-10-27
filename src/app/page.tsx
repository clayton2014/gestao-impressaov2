"use client";

// src/app/page.tsx (logo após "use client")
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supa';
import { getUser } from '@/lib/auth-client';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import AuthModal from '@/components/AuthModal';
import { 
  ClientsPage,
  MaterialsPage,
  InksPage,
  ServicesPage,
  ReportsPage,
  PlansPage,
  SettingsPage
} from '@/components/pages';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import { useAppStore } from '@/lib/store';

const routes: Record<string, React.ReactNode> = {
  "dashboard": <Dashboard />,
  "clients": <ClientsPage />,
  "materials": <MaterialsPage />,
  "inks": <InksPage />,
  "services": <ServicesPage />,
  "reports": <ReportsPage />,
  "plans": <PlansPage />,
  "settings": <SettingsPage />,
};

export default function Home() {
  const currentPage = useAppStore(s => s.currentPage) || "dashboard";
  const sidebarOpen = useAppStore(s => s.sidebarOpen);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Verificar usuário atual
        const currentUser = await getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostrar tela de autenticação
  if (!user) {
    return <AuthModal />;
  }

  const View = routes[currentPage] ?? <Dashboard />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "ml-64" : "ml-16"
      )}>
        <Header />
        <main className="p-6">
          {View}
        </main>
      </div>
    </div>
  );
}