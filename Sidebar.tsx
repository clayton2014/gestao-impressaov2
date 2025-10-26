'use client';

import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Palette, 
  BarChart3, 
  CreditCard, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const menuItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { key: 'services', icon: FileText, path: 'services' },
  { key: 'clients', icon: Users, path: 'clients' },
  { key: 'materials', icon: Package, path: 'materials' },
  { key: 'inks', icon: Palette, path: 'inks' },
  { key: 'reports', icon: BarChart3, path: 'reports' },
  { key: 'plans', icon: CreditCard, path: 'plans' },
  { key: 'settings', icon: Settings, path: 'settings' },
];

export default function Sidebar() {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    currentPage, 
    setCurrentPage,
    currentLocale 
  } = useAppStore();
  
  const { t } = useTranslation(currentLocale);

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 transition-all duration-300 z-40",
      sidebarOpen ? "w-64" : "w-16"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {sidebarOpen && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="text-white font-semibold">Print Manager</span>
          </div>
        )}
        
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.path;
          
          return (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.path)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg" 
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              )}
            >
              <Icon size={20} />
              {sidebarOpen && (
                <span className="font-medium">{t(`nav.${item.key}`)}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <div className="text-xs text-slate-400 mb-1">Plano Gratuito</div>
            <div className="text-sm text-white font-medium">50 serviços restantes</div>
            <button className="mt-2 w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs py-1.5 rounded-md hover:opacity-90 transition-opacity">
              Upgrade para Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}