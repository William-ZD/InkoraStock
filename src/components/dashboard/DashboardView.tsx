import React from 'react';
import {
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Receipt,
  Palette,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DashboardView: React.FC = () => {
  const {
    dashboardStats,
    accountingStats,
    orders,
    products,
    variants,
    designs,
    setActiveTab,
    setSelectedOrderId,
    setIsOrderModalOpen,
    setIsCustomerModalOpen,
    setIsStockMovementModalOpen,
    setIsDesignModalOpen,
    setEditingDesign,
    setIsExpenseModalOpen,
  } = useApp();

  const activeOrders = orders.filter(o => !o.archivedAt);
  const recentOrders = activeOrders.slice(0, 6);
  const activeDesignsCount = designs.filter(d => !d.archivedAt).length;

  // Find variants belonging to active products with low or out of stock
  const criticalStockVariants = variants
    .filter(v => {
      const prod = products.find(p => p.id === v.productId && !p.archivedAt);
      if (!prod) return false;
      return v.quantity <= prod.minimumStock;
    })
    .slice(0, 6);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_PRODUCTION':
        return 'En production';
      case 'PRETE':
        return 'Prête';
      case 'LIVREE':
        return 'Livrée';
      case 'ANNULEE':
        return 'Annulée';
      default:
        return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'PAYE':
        return 'Payé';
      case 'PARTIELLEMENT_PAYE':
        return 'Partiel';
      case 'NON_PAYE':
        return 'Non payé';
      default:
        return status;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Tableau de Bord Atelier
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Données 100 % réelles calculées en temps réel à partir de vos commandes, stocks, paiements et charges.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold py-2 px-3 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nouvelle commande</span>
          </button>
          <button
            onClick={() => {
              setEditingDesign(null);
              setIsDesignModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium py-2 px-3 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Design</span>
          </button>
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium py-2 px-3 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            <span>+ Client</span>
          </button>
          <button
            onClick={() => setIsStockMovementModalOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium py-2 px-3 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-zinc-500" />
            <span>+ Stock</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium py-2 px-3 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Charge</span>
          </button>
        </div>
      </div>

      {/* 5 Real-Data KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: COMMANDES */}
        <div
          onClick={() => setActiveTab('orders')}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
        >
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Commandes Actives
              </span>
              <ShoppingBag className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
              {dashboardStats.orders.total}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
              <Clock className="w-3 h-3" />
              {dashboardStats.orders.pending} att.
            </span>
            <span>·</span>
            <span className="text-blue-700 dark:text-blue-400 font-medium">
              {dashboardStats.orders.inProduction} prod.
            </span>
            <span>·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              {dashboardStats.orders.ready + dashboardStats.orders.delivered} finies
            </span>
          </div>
        </div>

        {/* KPI 2: CA & CAISSE */}
        <div
          onClick={() => setActiveTab('payments')}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
        >
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Encaissé Caisse
              </span>
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 font-mono">
              {dashboardStats.payments.totalPaid.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
            <span>CA : {accountingStats.chiffreAffaires} DH</span>
            <span className="text-amber-700 dark:text-amber-400 font-semibold">
              Reste : {dashboardStats.payments.totalRemaining} DH
            </span>
          </div>
        </div>

        {/* KPI 3: BÉNÉFICE NET & COMPTABILITÉ */}
        <div
          onClick={() => setActiveTab('accounting')}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
        >
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Bénéfice Net
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div
              className={`text-2xl font-bold tracking-tight font-mono ${
                accountingStats.beneficeNet >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {accountingStats.beneficeNet.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
            <span>Achats : {accountingStats.totalAchatsVendus} DH</span>
            <span>Charges : {accountingStats.totalCharges} DH</span>
          </div>
        </div>

        {/* KPI 4: STOCK DISPONIBLE */}
        <div
          onClick={() => setActiveTab('stock')}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
        >
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Stock Disponible
              </span>
              <Package className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
              {dashboardStats.stock.totalStockPieces}{' '}
              <span className="text-xs font-normal text-zinc-500">pièces</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 dark:text-zinc-400">
              Valeur : {accountingStats.totalAchatsStockGlobal} DH
            </span>
            {dashboardStats.stock.outOfStockVariantsCount > 0 ? (
              <span className="text-red-700 dark:text-red-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {dashboardStats.stock.outOfStockVariantsCount} rupt.
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {dashboardStats.stock.totalProducts} mod.
              </span>
            )}
          </div>
        </div>

        {/* KPI 5: CLIENTS & DESIGNS */}
        <div
          onClick={() => setActiveTab('customers')}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
        >
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Clients & Designs
              </span>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
              {dashboardStats.customers.total}{' '}
              <span className="text-xs font-normal text-zinc-500">client(s)</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
            <span>{activeDesignsCount} design(s) actif(s)</span>
            <span className="text-zinc-900 dark:text-white font-medium flex items-center gap-0.5">
              Voir <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                Dernières Commandes Enregistrées
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Suivi de la production atelier et de l'état réel des règlements.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs text-zinc-700 dark:text-zinc-300 font-medium hover:text-zinc-950 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              Toutes les commandes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 text-xs space-y-2">
              <p>Aucune commande active enregistrée pour le moment.</p>
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-amber-500 text-white dark:text-zinc-950 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Créer une commande
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentOrders.map(order => {
                const totalQty = order.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                const isCancelled = order.status === 'ANNULEE';
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`py-3.5 px-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg flex items-center justify-between gap-4 transition-colors cursor-pointer group ${
                      isCancelled ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700">
                        {order.orderNumber.replace('CMD-', '#')}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span>{order.customerName}</span>
                          <span className="text-zinc-300 dark:text-zinc-700">·</span>
                          <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                            {order.customerPhone || order.customerLocation || 'Client'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                          <span>{totalQty} pièce(s)</span>
                          <span>·</span>
                          <span className="truncate max-w-[200px]">
                            {order.items
                              .map(it => `${it.productName} (${it.color} ${it.size})`)
                              .join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs font-mono font-semibold text-zinc-900 dark:text-white">
                          {order.totalAmount} DH
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {order.remainingAmount > 0 ? (
                            <span className="text-amber-700 dark:text-amber-400">
                              Reste {order.remainingAmount} DH
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400">Soldé</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <div
                          className={`font-medium ${
                            isCancelled
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {getStatusText(order.status)}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {getPaymentStatusText(order.paymentStatus)}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Critical Stock Alerts */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  Alertes de Stock Réel
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('stock')}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium cursor-pointer"
              >
                Gérer
              </button>
            </div>

            {dashboardStats.stock.totalProducts === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
                <Package className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-1" />
                <p>Aucun vêtement actif dans le stock.</p>
                <button
                  onClick={() => setActiveTab('stock')}
                  className="text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                >
                  Ajouter des vêtements au stock →
                </button>
              </div>
            ) : criticalStockVariants.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                Tous vos vêtements actifs ont un niveau de stock confortable.
              </div>
            ) : (
              <div className="space-y-3">
                {criticalStockVariants.map(variant => {
                  const product = products.find(p => p.id === variant.productId);
                  const isZero = variant.quantity === 0;
                  return (
                    <div
                      key={variant.id}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                        isZero
                          ? 'border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-950 dark:text-red-200'
                          : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{product?.name}</div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                          {variant.color} · Taille {variant.size}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-mono font-bold ${
                            isZero
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {isZero ? 'RUPTURE' : `${variant.quantity} restante(s)`}
                        </div>
                        <button
                          onClick={() => setIsStockMovementModalOpen(true)}
                          className="text-[10px] text-zinc-700 dark:text-zinc-300 hover:underline mt-0.5 cursor-pointer font-medium"
                        >
                          + Réapprovisionner
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setIsStockMovementModalOpen(true)}
              className="w-full py-2 px-3 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium rounded-lg transition text-center cursor-pointer"
            >
              Enregistrer une entrée ou sortie de stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
