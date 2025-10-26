'use client';

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
import { useAppStore } from '@/lib/store';
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

export default function Header() {
  const { 
    sidebarOpen,
    setSidebarOpen,
    currentLocale, 
    currentCurrency,
    theme,
    setLocale,
    setCurrency,
    setTheme,
    user,
    currentPage
  } = useAppStore();
  
  const { t } = useTranslation();

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return t('nav.dashboard');
      case 'services': return t('nav.services');
      case 'clients': return t('nav.clients');
      case 'materials': return t('nav.materials');
      case 'inks': return t('nav.inks');
      case 'reports': return t('nav.reports');
      case 'settings': return t('nav.settings');
      case 'plans': return t('nav.plans');
      case 'profile': return t('nav.profile');
      default: return t('nav.dashboard');
    }
  };

  const handleLogout = () => {
    // Clear user data and redirect to login
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex items-center space-x-2">
            {/* Language Selector */}
            <SafeSelect
              value={currentLocale}
              onChange={setLocale}
              options={[
                { value: "pt-BR", label: "🇧🇷 PT" },
                { value: "en-US", label: "🇺🇸 EN" },
                { value: "es-ES", label: "🇪🇸 ES" }
              ]}
              className="w-20"
            />

            {/* Currency Selector */}
            <SafeSelect
              value={currentCurrency}
              onChange={setCurrency}
              options={[
                { value: "BRL", label: "R$" },
                { value: "USD", label: "$" },
                { value: "EUR", label: "€" }
              ]}
              className="w-16"
            />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.nome || 'Usuário'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'usuario@exemplo.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('nav.profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('auth.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}