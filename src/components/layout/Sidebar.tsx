import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Palette,
  CreditCard,
  History,
  Archive,
  Plus,
  Scissors,
  AlertTriangle,
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    orders,
    dashboardStats,
    setIsOrderModalOpen,
    theme,
    toggleTheme,
  } = useApp();

  const activeOrdersCount = orders.filter(
    o => !o.archivedAt && (o.status === 'EN_ATTENTE' || o.status === 'EN_PRODUCTION')
  ).length;

  const lowStockAlerts = dashboardStats.stock.lowStockVariantsCount + dashboardStats.stock.outOfStockVariantsCount;

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      id: 'orders',
      label: 'Commandes',
      icon: ShoppingBag,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    {
      id: 'stock',
      label: 'Stock & Vêtements',
      icon: Package,
      alertBadge: lowStockAlerts > 0 ? lowStockAlerts : undefined,
    },
    {
      id: 'accounting',
      label: 'Comptabilité & Bilan',
      icon: TrendingUp,
    },
    {
      id: 'customers',
      label: 'Clients',
      icon: Users,
    },
    {
      id: 'designs',
      label: 'Designs & Galerie',
      icon: Palette,
    },
    {
      id: 'payments',
      label: 'Paiements & Caisse',
      icon: CreditCard,
    },
    {
      id: 'movements',
      label: 'Historique Stock',
      icon: History,
    },
    {
      id: 'archives',
      label: 'Archives',
      icon: Archive,
    },
  ];

  return (
    <aside className="w-64 bg-zinc-900 text-zinc-100 flex flex-col border-r border-zinc-800 shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
            <Scissors className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              ATELIER CUSTOM
            </h1>
            <p className="text-xs text-zinc-400 font-mono">Administration</p>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="p-4 pb-2">
        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs py-2.5 px-3 rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nouvelle commande</span>
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Menu Principal
        </div>
        {navigationItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && (
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-200">
                    {item.badge}
                  </span>
                )}
                {item.alertBadge !== undefined && (
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {item.alertBadge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Theme toggle */}
      <div className="p-4 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
        <div>
          <div className="text-zinc-300 font-medium text-[11px]">Atelier v1.3</div>
          <div className="text-[10px] text-zinc-400">Devise : DH (Maroc)</div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer flex items-center gap-1"
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </aside>
  );
};
