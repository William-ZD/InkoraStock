import React, { useState } from 'react';
import {
  Search,
  Plus,
  Users,
  Package,
  Palette,
  RotateCcw,
  Download,
  CheckCircle2,
  Sun,
  Moon,
  Receipt,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    setIsCustomerModalOpen,
    setIsProductModalOpen,
    setIsStockMovementModalOpen,
    setIsDesignModalOpen,
    setIsExpenseModalOpen,
    resetToSampleData,
    exportDataJson,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const json = exportDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atelier-custom-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    resetToSampleData();
    setConfirmReset(false);
  };

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20 flex items-center justify-between px-6 transition-colors">
      {/* Global Search Bar */}
      <div className="flex items-center gap-3 w-80 md:w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher client, commande, article, design..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80 focus:bg-white dark:focus:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 dark:focus:ring-zinc-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Buttons & Helpers */}
      <div className="flex items-center gap-2">
        {/* Quick create shortcuts */}
        <button
          onClick={() => setIsCustomerModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer"
          title="Ajouter un nouveau client"
        >
          <Users className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span>+ Client</span>
        </button>

        <button
          onClick={() => setIsProductModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer"
          title="Créer un nouveau vêtement"
        >
          <Package className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span>+ Vêtement</span>
        </button>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer"
          title="Ajouter une charge ou dépense atelier"
        >
          <Receipt className="w-3.5 h-3.5 text-amber-500" />
          <span>+ Charge</span>
        </button>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* DARK / LIGHT THEME TOGGLE BUTTON */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1 text-xs"
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-600" />
          )}
        </button>

        {/* Data export & reset */}
        <button
          onClick={handleExport}
          className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
          title="Sauvegarder / Exporter les données (JSON)"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
        </button>

        {confirmReset ? (
          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-2 py-1 rounded-md text-[11px]">
            <span className="text-red-800 dark:text-red-300 font-medium">Réinitialiser ?</span>
            <button
              onClick={handleReset}
              className="font-bold text-red-700 dark:text-red-300 hover:underline px-1 cursor-pointer"
            >
              Oui
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-1 cursor-pointer"
            >
              Non
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Réinitialiser avec les données exemples"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
