import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Banknote,
  Building2,
  Receipt,
  ChevronRight,
  Wallet,
  ShoppingBag,
  Package,
  TrendingUp,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    orders,
    expenses,
    products,
    variants,
    accountingStats,
    dashboardStats,
    searchQuery,
    setIsPaymentModalOpen,
    setTargetOrderForPayment,
    setIsExpenseModalOpen,
    setSelectedOrderId,
    markOrderAsPaid,
    deletePaymentPermanently,
    archiveExpense,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'payments' | 'cashbook'>('orders');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [confirmDeletePaymentId, setConfirmDeletePaymentId] = useState<string | null>(null);

  // Strictly active, non-archived, non-cancelled orders
  const activeOrders = useMemo(
    () => orders.filter(o => !o.archivedAt && o.status !== 'ANNULEE'),
    [orders]
  );

  const activeOrderIds = useMemo(
    () => new Set(activeOrders.map(o => o.id)),
    [activeOrders]
  );

  // Strictly real payments belonging to active non-cancelled orders
  const activePayments = useMemo(
    () => payments.filter(p => activeOrderIds.has(p.orderId)),
    [payments, activeOrderIds]
  );

  // Strictly active expenses
  const activeExpenses = useMemo(
    () => expenses.filter(e => !e.archivedAt),
    [expenses]
  );

  // Real financial calculations for the Atelier
  const totalEncaisse = useMemo(
    () => activeOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0),
    [activeOrders]
  );

  const totalCash = useMemo(
    () =>
      activePayments
        .filter(p => p.paymentMethod === 'ESPECES')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [activePayments]
  );

  const totalTransfer = useMemo(
    () =>
      activePayments
        .filter(p => p.paymentMethod === 'VIREMENT')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [activePayments]
  );

  const totalCard = useMemo(
    () =>
      activePayments
        .filter(p => p.paymentMethod === 'CARTE' || p.paymentMethod === 'AUTRE')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [activePayments]
  );

  const totalRemainingToCollect = useMemo(
    () => activeOrders.reduce((sum, o) => sum + (Number(o.remainingAmount) || 0), 0),
    [activeOrders]
  );

  const unpaidOrdersCount = useMemo(
    () => activeOrders.filter(o => o.remainingAmount > 0).length,
    [activeOrders]
  );

  // Trésorerie disponible en caisse = Total Encaissé - Charges d'exploitation - Coût d'achat des vêtements vendus
  const tresorerieApresCharges = totalEncaisse - accountingStats.totalCharges;
  const soldeCaisseNetAtelier =
    totalEncaisse - accountingStats.totalAchatsVendus - accountingStats.totalCharges;

  // Filtered Orders for Tab 1
  const filteredOrders = useMemo(() => {
    return activeOrders
      .filter(o => {
        if (orderPaymentFilter === 'UNPAID') return o.remainingAmount > 0;
        if (orderPaymentFilter === 'PAID') return o.remainingAmount === 0;
        return true;
      })
      .filter(o => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.customerPhone || '').toLowerCase().includes(q)
        );
      });
  }, [activeOrders, orderPaymentFilter, searchQuery]);

  // Filtered Payments for Tab 2
  const filteredPayments = useMemo(() => {
    return activePayments
      .filter(p => {
        if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (p.orderNumber || '').toLowerCase().includes(q) ||
          (p.customerName || '').toLowerCase().includes(q) ||
          (p.paymentMethod || '').toLowerCase().includes(q) ||
          (p.note || '').toLowerCase().includes(q)
        );
      });
  }, [activePayments, methodFilter, searchQuery]);

  // Combined chronological Cashbook (Entrées Règlements + Sorties Charges) for Tab 3
  const cashbookEntries = useMemo(() => {
    const entries: {
      id: string;
      date: string;
      createdAt: string;
      type: 'IN_PAYMENT' | 'OUT_EXPENSE';
      title: string;
      subtitle: string;
      methodOrCat: string;
      amount: number;
      orderId?: string;
    }[] = [];

    activePayments.forEach(p => {
      entries.push({
        id: `IN-${p.id}`,
        date: p.date,
        createdAt: p.createdAt,
        type: 'IN_PAYMENT',
        title: `Encaissement ${p.orderNumber} — ${p.customerName}`,
        subtitle: p.note || 'Règlement client',
        methodOrCat: p.paymentMethod,
        amount: Number(p.amount) || 0,
        orderId: p.orderId,
      });
    });

    activeExpenses.forEach(e => {
      entries.push({
        id: `OUT-${e.id}`,
        date: e.date,
        createdAt: e.createdAt,
        type: 'OUT_EXPENSE',
        title: `Charge Atelier — ${e.title}`,
        subtitle: e.note || 'Dépense d’exploitation',
        methodOrCat: e.category,
        amount: -(Number(e.amount) || 0),
      });
    });

    return entries.sort(
      (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );
  }, [activePayments, activeExpenses]);

  const getOrderCost = (order: any) => {
    return (order.items || []).reduce((sum: number, it: any) => {
      const prod = products.find(p => p.id === it.productId);
      const unitCost = Number(it.costPrice ?? prod?.costPrice ?? 0);
      return sum + unitCost * (Number(it.quantity) || 0);
    }, 0);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Paiements & Caisse Atelier
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Trésorerie 100 % réelle calculée à partir de vos commandes actives, encaissements clients, charges d'exploitation et stocks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold py-2 px-3 rounded-lg shadow-xs transition cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Enregistrer une dépense</span>
          </button>
          <button
            onClick={() => {
              setTargetOrderForPayment(null);
              setIsPaymentModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Encaisser un règlement</span>
          </button>
        </div>
      </div>

      {/* 5 Real-Time Atelier Treasury KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Encaissé */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              <span>Total Encaissé</span>
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {totalEncaisse.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Espèces : {totalCash} DH</span>
            <span>·</span>
            <span>Vir. : {totalTransfer} DH</span>
          </div>
        </div>

        {/* KPI 2: Reste à Encaisser */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              <span>Reste à Encaisser</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
              {totalRemainingToCollect.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{unpaidOrdersCount} commande(s) en attente</span>
            <span className="font-mono">CA: {accountingStats.chiffreAffaires} DH</span>
          </div>
        </div>

        {/* KPI 3: Charges & Dépenses Atelier */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              <span>Charges Atelier</span>
              <Receipt className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
              {accountingStats.totalCharges.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{activeExpenses.length} dépense(s) saisie(s)</span>
            <span>Achats vendus : {accountingStats.totalAchatsVendus} DH</span>
          </div>
        </div>

        {/* KPI 4: Valeur du Stock Atelier */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              <span>Valeur Stock Atelier</span>
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
              {accountingStats.totalAchatsStockGlobal.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{dashboardStats.stock.totalStockPieces} pièces en stock</span>
            <span>{dashboardStats.stock.totalProducts} modèle(s)</span>
          </div>
        </div>

        {/* KPI 5: Solde Net Caisse Atelier */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              <span>Solde Net Caisse</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div
              className={`text-2xl font-bold font-mono ${
                soldeCaisseNetAtelier >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {soldeCaisseNetAtelier.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Caisse brute : {tresorerieApresCharges} DH</span>
            <span>Bénéf. : {accountingStats.beneficeNet} DH</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeSubTab === 'orders'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Règlements par Commande ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('payments')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeSubTab === 'payments'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Historique des Encaissements ({activePayments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('cashbook')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeSubTab === 'cashbook'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Livre de Caisse Entrées / Sorties ({cashbookEntries.length})
          </button>
        </div>

        {activeSubTab === 'orders' && (
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: `Toutes (${activeOrders.length})` },
              { id: 'UNPAID', label: `À encaisser (${unpaidOrdersCount})` },
              { id: 'PAID', label: `Soldées (${activeOrders.length - unpaidOrdersCount})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setOrderPaymentFilter(f.id as any)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  orderPaymentFilter === f.id
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {activeSubTab === 'payments' && (
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Tous les modes' },
              { id: 'ESPECES', label: 'Espèces' },
              { id: 'VIREMENT', label: 'Virement' },
              { id: 'CARTE', label: 'Carte' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMethodFilter(m.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  methodFilter === m.id
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: SUIVI DES RÈGLEMENTS PAR COMMANDE ACTIVE */}
      {activeSubTab === 'orders' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">N° Commande</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Articles</th>
                  <th className="py-3 px-4 text-right">Coût Achat</th>
                  <th className="py-3 px-4 text-right">Total Vente</th>
                  <th className="py-3 px-4 text-right">Encaissé</th>
                  <th className="py-3 px-4 text-right">Reste à Payer</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions Caisse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400 text-xs">
                      Aucune commande active à afficher dans cette vue.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const orderCost = getOrderCost(order);
                    const isPaid = order.remainingAmount <= 0;
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-white">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-zinc-900 dark:text-white">
                            {order.customerName}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {order.customerPhone}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 max-w-xs truncate">
                          {order.items
                            .map(it => `${it.quantity}× ${it.productName} (${it.color} ${it.size})`)
                            .join(', ')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-zinc-500 dark:text-zinc-400">
                          {orderCost} DH
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                          {order.totalAmount} DH
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {order.paidAmount} DH
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {order.remainingAmount > 0 ? (
                            <span className="text-amber-700 dark:text-amber-400">
                              {order.remainingAmount} DH
                            </span>
                          ) : (
                            <span className="text-zinc-400">0 DH</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Payé
                            </span>
                          ) : order.paidAmount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold">
                              Partiel
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-[11px] font-semibold">
                              Non payé
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {!isPaid && (
                              <>
                                <button
                                  onClick={() => {
                                    setTargetOrderForPayment(order);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded transition cursor-pointer"
                                >
                                  + Encaisser
                                </button>
                                <button
                                  onClick={() => markOrderAsPaid(order.id, 'ESPECES')}
                                  className="px-2 py-1 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded transition cursor-pointer"
                                  title="Solder le reste en espèces en 1 clic"
                                >
                                  Solder
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setSelectedOrderId(order.id)}
                              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                              title="Ouvrir la commande"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIQUE DES ENCAISSEMENTS CLIENTS */}
      {activeSubTab === 'payments' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">N° Commande</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Mode de Paiement</th>
                  <th className="py-3 px-4">Note / Référence</th>
                  <th className="py-3 px-4 text-right">Montant Encaissé</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs">
                      Aucun encaissement enregistré pour vos commandes actives.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(p => (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                        {p.date}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-white">
                        {p.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                        {p.customerName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                        {p.note || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                        +{p.amount} DH
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrderId(p.orderId)}
                            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-medium text-[11px] cursor-pointer inline-flex items-center gap-0.5"
                          >
                            Commande <ChevronRight className="w-3 h-3" />
                          </button>
                          {confirmDeletePaymentId === p.id ? (
                            <button
                              onClick={() => {
                                deletePaymentPermanently(p.id);
                                setConfirmDeletePaymentId(null);
                              }}
                              className="px-2 py-0.5 text-[11px] bg-red-600 text-white rounded font-semibold cursor-pointer"
                            >
                              Confirmer
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDeletePaymentId(p.id)}
                              className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                              title="Supprimer ce règlement et recalculer le solde de la commande"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LIVRE DE CAISSE COMPLET (ENTRÉES CLIENTS & SORTIES CHARGES ATELIER) */}
      {activeSubTab === 'cashbook' && (
        <div className="space-y-6">
          {/* Synthèse par poste */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
                Détail des Entrées par Mode
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Espèces (Caisse liquide)
                </span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{totalCash} DH</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> Virement bancaire
                </span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{totalTransfer} DH</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Carte / Autre
                </span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{totalCard} DH</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
                Coûts & Sorties Atelier
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Coût d'achat vêtements vendus</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">
                  -{accountingStats.totalAchatsVendus} DH
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Charges d'exploitation saisies</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  -{accountingStats.totalCharges} DH
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Valeur d'achat du stock restant</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  {accountingStats.totalAchatsStockGlobal} DH
                </span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
                Équilibre de Caisse & Résultat
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Trésorerie après charges</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  {tresorerieApresCharges} DH
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Trésorerie nette après achats</span>
                <span
                  className={`font-mono font-bold ${
                    soldeCaisseNetAtelier >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {soldeCaisseNetAtelier} DH
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Bénéfice Net Global (CA inclus)</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {accountingStats.beneficeNet} DH
                </span>
              </div>
            </div>
          </div>

          {/* Table des flux */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Nature du Flux</th>
                    <th className="py-3 px-4">Libellé / Opération</th>
                    <th className="py-3 px-4">Mode / Catégorie</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {cashbookEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-400 text-xs">
                        Aucun mouvement de caisse (ni encaissement, ni dépense) enregistré.
                      </td>
                    </tr>
                  ) : (
                    cashbookEntries.map(entry => {
                      const isPositive = entry.type === 'IN_PAYMENT';
                      return (
                        <tr
                          key={entry.id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                            {entry.date}
                          </td>
                          <td className="py-3 px-4">
                            {isPositive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                                <ArrowUpRight className="w-3 h-3" /> Entrée client
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold text-[11px]">
                                <ArrowDownRight className="w-3 h-3" /> Sortie charge
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-zinc-900 dark:text-white">
                              {entry.title}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {entry.subtitle}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-[11px]">
                              {entry.methodOrCat}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                              isPositive
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {isPositive ? `+${entry.amount}` : entry.amount} DH
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
