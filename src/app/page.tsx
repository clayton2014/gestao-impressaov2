"use client";

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
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
import { seedDatabase } from '@/lib/database';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await seedDatabase();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
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