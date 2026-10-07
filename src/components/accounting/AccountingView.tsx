import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  DollarSign,
  Plus,
  Archive,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar,
  Layers,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseModal } from './ExpenseModal';

export const AccountingView: React.FC = () => {
  const {
    accountingStats,
    expenses,
    orders,
    setIsExpenseModalOpen,
    archiveExpense,
    restoreExpense,
    deleteExpensePermanently,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'orders-margin'>('overview');
  const [expenseScope, setExpenseScope] = useState<'active' | 'archived'>('active');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeExpenses = useMemo(() => {
    return expenses.filter(e => !e.archivedAt);
  }, [expenses]);

  const archivedExpenses = useMemo(() => {
    return expenses.filter(e => Boolean(e.archivedAt));
  }, [expenses]);

  const displayedExpenses = expenseScope === 'active' ? activeExpenses : archivedExpenses;

  const activeOrders = useMemo(() => {
    return orders.filter(o => !o.archivedAt && o.status !== 'ANNULEE');
  }, [orders]);

  // Margin rate
  const marginPercentage = accountingStats.chiffreAffaires > 0
    ? Math.round((accountingStats.beneficeNet / accountingStats.chiffreAffaires) * 100)
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Comptabilité & Analyse Financière
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Bénéfices réels, chiffre d'affaires, total des achats textiles et suivi des charges d'exploitation.
          </p>
        </div>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-amber-500 text-white dark:text-zinc-950 text-xs font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-zinc-800 dark:hover:bg-amber-400 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Ajouter une charge</span>
        </button>
      </div>

      {/* 5 MAIN FINANCIAL METRICS AS REQUESTED IN USER PROMPT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1: BÉNÉFICE TOTAL */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Bénéfice Net</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className={`text-2xl font-bold font-mono tracking-tight ${
              accountingStats.beneficeNet >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {accountingStats.beneficeNet.toLocaleString('fr-FR')} <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Taux de marge :</span>
            <strong className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{marginPercentage}%</strong>
          </div>
        </div>

        {/* 2: TOTAL DÉPENSÉ POUR LES CHARGES */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Charges & Frais</span>
              <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              {accountingStats.totalCharges.toLocaleString('fr-FR')} <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{activeExpenses.length} charge(s) atelier</span>
            <button
              onClick={() => setActiveTab('expenses')}
              className="text-zinc-800 dark:text-zinc-200 font-medium hover:underline cursor-pointer"
            >
              Détails
            </button>
          </div>
        </div>

        {/* 3: TOTAL DES ACHATS */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Achats</span>
              <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              {accountingStats.totalAchatsVendus.toLocaleString('fr-FR')} <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Stock actuel en réserve :</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">{accountingStats.totalAchatsStockGlobal} DH</span>
          </div>
        </div>

        {/* 4: CHIFFRE D'AFFAIRES */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Chiffre d'Affaires</span>
              <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              {accountingStats.chiffreAffaires.toLocaleString('fr-FR')} <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{activeOrders.length} commande(s) active(s)</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Facturées</span>
          </div>
        </div>

        {/* 5: MONTANT RESTANT À RECEVOIR */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Reste à Recevoir</span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-amber-700 dark:text-amber-400">
              {accountingStats.resteARecevoir.toLocaleString('fr-FR')} <span className="text-xs font-normal text-zinc-500">DH</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Créances en attente</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">À encaisser</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Structure du Résultat & Calcul de Rentabilité
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Journal des Charges ({activeExpenses.length})
        </button>
        <button
          onClick={() => setActiveTab('orders-margin')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === 'orders-margin'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Marges par Commande ({activeOrders.length})
        </button>
      </div>

      {/* VIEW 1: STRUCTURE DE RÉSULTAT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Breakdown waterfall card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Décomposition du Compte de Résultat
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Du chiffre d'affaires brut jusqu'au bénéfice net en déduisant les coûts d'achat et les charges d'exploitation.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  (+) Chiffre d'Affaires Brut (Ventes)
                </span>
                <span className="font-mono font-bold text-sm text-zinc-900 dark:text-white">
                  {accountingStats.chiffreAffaires.toLocaleString('fr-FR')} DH
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 text-red-600 dark:text-red-400">
                <span>(-) Coût d'achat des vêtements vendus</span>
                <span className="font-mono font-semibold">
                  -{accountingStats.totalAchatsVendus.toLocaleString('fr-FR')} DH
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 px-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg font-semibold text-zinc-900 dark:text-white">
                <span>(=) Marge Brute Commerciale</span>
                <span className="font-mono font-bold text-sm">
                  {accountingStats.beneficeBrut.toLocaleString('fr-FR')} DH
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 text-amber-700 dark:text-amber-400">
                <span>(-) Charges d'exploitation & Frais généraux</span>
                <span className="font-mono font-semibold">
                  -{accountingStats.totalCharges.toLocaleString('fr-FR')} DH
                </span>
              </div>

              <div className="flex justify-between items-center py-3 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-950 dark:text-emerald-200 font-bold text-sm">
                <span>(=) BÉNÉFICE NET ATELIER</span>
                <span className="font-mono font-black text-base text-emerald-800 dark:text-emerald-300">
                  {accountingStats.beneficeNet.toLocaleString('fr-FR')} DH
                </span>
              </div>
            </div>
          </div>

          {/* Charges categories breakdown */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                Répartition des Charges
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium cursor-pointer"
              >
                + Ajouter
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              {[
                { cat: 'LOYER', label: 'Loyer & Local atelier' },
                { cat: 'CONSOMMABLES', label: 'Consommables & Encres' },
                { cat: 'ELECTRICITE_EAU', label: 'Électricité & Eau' },
                { cat: 'TRANSPORT', label: 'Transport & Livraisons' },
                { cat: 'MATERIEL', label: 'Matériel & Machines' },
                { cat: 'MARKETING', label: 'Marketing & Pub' },
                { cat: 'AUTRE', label: 'Autres frais' },
              ].map(item => {
                const amount = activeExpenses
                  .filter(e => e.category === item.cat)
                  .reduce((sum, e) => sum + e.amount, 0);
                if (amount === 0) return null;
                const percentage = accountingStats.totalCharges > 0
                  ? Math.round((amount / accountingStats.totalCharges) * 100)
                  : 0;

                return (
                  <div key={item.cat} className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-700 dark:text-zinc-300">
                      <span>{item.label}</span>
                      <span className="font-mono font-semibold">{amount} DH ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: JOURNAL DES CHARGES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpenseScope('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                expenseScope === 'active'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Charges Actives ({activeExpenses.length})
            </button>
            <button
              onClick={() => setExpenseScope('archived')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                expenseScope === 'archived'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Charges Archivées ({archivedExpenses.length})</span>
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Libellé de la Dépense</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Note / Justificatif</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {displayedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400 text-xs">
                        {expenseScope === 'active'
                          ? 'Aucune dépense active enregistrée.'
                          : 'Aucune dépense archivée.'}
                      </td>
                    </tr>
                  ) : (
                    displayedExpenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-mono">
                          {expense.date}
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                          {expense.title}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-[11px]">
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                          {expense.note || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white text-sm">
                          {expense.amount} DH
                        </td>
                        <td className="py-3 px-4 text-right">
                          {expenseScope === 'active' ? (
                            <button
                              onClick={() => archiveExpense(expense.id)}
                              className="p-1 text-zinc-400 hover:text-red-600 transition cursor-pointer"
                              title="Archiver cette dépense"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                onClick={() => restoreExpense(expense.id)}
                                className="px-2 py-1 text-[11px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold rounded flex items-center gap-1 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" /> Restaurer
                              </button>
                              {confirmDeleteId === expense.id ? (
                                <button
                                  onClick={() => {
                                    deleteExpensePermanently(expense.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 text-[11px] bg-red-600 text-white font-semibold rounded transition cursor-pointer"
                                >
                                  Confirmer
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(expense.id)}
                                  className="px-2 py-1 text-[11px] bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-semibold rounded flex items-center gap-1 transition cursor-pointer"
                                  title="Supprimer définitivement cette dépense"
                                >
                                  <Trash2 className="w-3 h-3" /> Supprimer
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MARGES PAR COMMANDE */}
      {activeTab === 'orders-margin' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Commande</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Articles</th>
                  <th className="py-3 px-4 text-right">Prix de Vente (CA)</th>
                  <th className="py-3 px-4 text-right">Coût d'Achat</th>
                  <th className="py-3 px-4 text-right">Marge Brute</th>
                  <th className="py-3 px-4 text-right">Marge %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {activeOrders.map(order => {
                  let orderCost = 0;
                  order.items.forEach(it => {
                    orderCost += (it.costPrice || 0) * it.quantity;
                  });
                  const margin = order.totalAmount - orderCost;
                  const marginPct = order.totalAmount > 0 ? Math.round((margin / order.totalAmount) * 100) : 0;

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-white">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {order.customerName}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {order.items.map(it => `${it.quantity}× ${it.productName}`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                        {order.totalAmount} DH
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-500 dark:text-zinc-400">
                        {orderCost} DH
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        +{margin} DH
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        {marginPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
