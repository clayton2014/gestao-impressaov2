'use client';

// src/components/Header.tsx (no topo: remova qualquer import de "next-themes" ou "next-themes/dist/index")
// ...mantenha seus outros imports

async function saveSettings(patch: any) {
  // atualiza store/DB como você já faz…
  try {
    const { SettingsDAO } = await import("@/lib/dao");
    await SettingsDAO.upsert(patch);
  } catch {}

  // aplicar tema local, sem next-themes
  if (typeof document !== "undefined" && patch.theme) {
    const root = document.documentElement;
    if (patch.theme === "dark") root.classList.add("dark");
    if (patch.theme === "light") root.classList.remove("dark");
    if (patch.theme === "system") {
      // opcional: seguir o sistema
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }
}


import { 
  Bell, 
  Globe, 
  User, 
  LogOut,
  Menu,
  DollarSign,
  Sun,
  Moon
} from 'lucide-react';
import useAppStore, { actions } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { SafeSelect } from '@/components/ui/safe-select';
import UserMenu from '@/components/UserMenu';

export default function Header() {
  const sidebarOpen = useAppStore(s => s.sidebarOpen);
  const currentPage = useAppStore(s => s.currentPage);
  const locale = useAppStore(s => s.locale);
  const currency = useAppStore(s => s.currency);
  const theme = useAppStore(s => s.theme);
  const user = useAppStore(s => s.users.find(u => u.id === s.auth.userId) ?? null);
  
  const { t } = useTranslation();

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard';
      case 'services': return 'Serviços';
      case 'clients': return 'Clientes';
      case 'materials': return 'Materiais';
      case 'inks': return 'Tintas';
      case 'reports': return 'Relatórios';
      case 'settings': return 'Configurações';
      case 'plans': return 'Planos';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.setSidebarOpen(!sidebarOpen)}
            className="mr-2"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex items-center space-x-2">
            {/* Language Selector */}
            <SafeSelect
              value={locale}
              onChange={actions.setLocale}
              options={[
                { value: "pt-BR", label: "🇧🇷 PT" },
                { value: "en", label: "🇺🇸 EN" }
              ]}
              className="w-20"
            />

            {/* Currency Selector */}
            <SafeSelect
              value={currency}
              onChange={actions.setCurrency}
              options={[
                { value: "BRL", label: "R$" },
                { value: "USD", label: "$" }
              ]}
              className="w-16"
            />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Menu */}
            <UserMenu />
          </nav>
        </div>
      </div>
    </header>
  );
}