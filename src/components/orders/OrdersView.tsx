import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CreditCard,
  ChevronRight,
  Eye,
  Ban,
  Archive,
  RotateCcw,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OrderStatus, PaymentStatus } from '../../types';

export const OrdersView: React.FC = () => {
  const {
    orders,
    searchQuery,
    setSelectedOrderId,
    setIsOrderModalOpen,
    setTargetOrderForPayment,
    setIsPaymentModalOpen,
    setCancellingOrder,
    archiveOrder,
    restoreOrder,
    deleteOrderPermanently,
  } = useApp();

  // Active or Archived view
  const [viewScope, setViewScope] = useState<'active' | 'archived'>('active');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Local filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'>('date-desc');

  const activeOrdersCount = orders.filter(o => !o.archivedAt).length;
  const archivedOrdersCount = orders.filter(o => o.archivedAt).length;

  // Filtered & sorted orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => (viewScope === 'active' ? !o.archivedAt : Boolean(o.archivedAt)))
      .filter(order => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNumber = order.orderNumber.toLowerCase().includes(q);
          const matchClient = order.customerName.toLowerCase().includes(q);
          const matchPhone = (order.customerPhone || '').toLowerCase().includes(q);
          const matchItem = order.items.some(
            it =>
              it.productName.toLowerCase().includes(q) ||
              it.color.toLowerCase().includes(q) ||
              it.size.toLowerCase().includes(q)
          );
          if (!matchNumber && !matchClient && !matchPhone && !matchItem) return false;
        }

        // Production status filter
        if (statusFilter !== 'ALL' && order.status !== statusFilter) {
          return false;
        }

        // Payment status filter
        if (paymentFilter !== 'ALL' && order.paymentStatus !== paymentFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'total-desc') {
          return b.totalAmount - a.totalAmount;
        }
        if (sortBy === 'total-asc') {
          return a.totalAmount - b.totalAmount;
        }
        return 0;
      });
  }, [orders, viewScope, searchQuery, statusFilter, paymentFilter, sortBy]);

  const getStatusLabel = (status: OrderStatus) => {
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

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAYE':
        return <span className="text-emerald-700 dark:text-emerald-400 font-medium">Payé</span>;
      case 'PARTIELLEMENT_PAYE':
        return <span className="text-amber-700 dark:text-amber-400 font-medium">Partiel</span>;
      case 'NON_PAYE':
        return <span className="text-zinc-500 dark:text-zinc-400 font-medium">Non payé</span>;
      default:
        return status;
    }
  };

  const handleCancelOrder = (e: React.MouseEvent, order: any) => {
    e.stopPropagation();
    setCancellingOrder(order);
  };

  const handleArchiveOrder = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    archiveOrder(orderId);
  };

  const handleRestoreOrder = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    restoreOrder(orderId);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Gestion des Commandes
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Suivi atelier, annulations avec retour de stock, règlements et archivage.
          </p>
        </div>

        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold py-2 px-3 rounded-lg shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Nouvelle commande</span>
        </button>
      </div>

      {/* Scope Switcher: Actives vs Archivées */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewScope('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              viewScope === 'active'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Commandes Actives ({activeOrdersCount})
          </button>
          <button
            onClick={() => setViewScope('archived')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              viewScope === 'archived'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archives ({archivedOrdersCount})</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
        {/* Production status filter */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs font-semibold text-zinc-400 mr-1 hidden sm:inline">Statut :</span>
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'EN_ATTENTE', label: 'En attente' },
            { id: 'EN_PRODUCTION', label: 'En production' },
            { id: 'PRETE', label: 'Prête' },
            { id: 'LIVREE', label: 'Livrée' },
            { id: 'ANNULEE', label: 'Annulées' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Payment & Sort */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 font-medium">Paiement :</span>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="ALL">Tous</option>
              <option value="PAYE">Payé</option>
              <option value="PARTIELLEMENT_PAYE">Partiel</option>
              <option value="NON_PAYE">Non payé</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="date-desc">Plus récentes</option>
              <option value="date-asc">Plus anciennes</option>
              <option value="total-desc">Montant décroissant</option>
              <option value="total-asc">Montant croissant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Commande</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Article & Détails</th>
                <th className="py-3 px-4 text-center">Qté</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Payé</th>
                <th className="py-3 px-4 text-right">Reste</th>
                <th className="py-3 px-4">Statut Atelier</th>
                <th className="py-3 px-4">Paiement</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-400 text-xs">
                    {viewScope === 'active'
                      ? 'Aucune commande trouvée selon vos critères.'
                      : 'Aucune commande archivée pour le moment.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const totalQty = order.items.reduce((sum, it) => sum + it.quantity, 0);
                  const firstItem = order.items[0];
                  const isCancelled = order.status === 'ANNULEE';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group ${
                        isCancelled ? 'opacity-65 bg-zinc-50/50 dark:bg-zinc-900/40' : ''
                      }`}
                    >
                      {/* Commande ID */}
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-white">
                        {order.orderNumber}
                        <div className="text-[10px] text-zinc-400 font-normal">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{order.customerName}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {order.customerPhone || order.customerLocation || 'Client'}
                        </div>
                      </td>

                      {/* Article & Details */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-zinc-900 dark:text-zinc-200 truncate">
                          {firstItem?.productName || 'Article'}
                          {order.items.length > 1 ? ` (+${order.items.length - 1} autre)` : ''}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {firstItem?.color} · Taille {firstItem?.size} · P.Vente : {firstItem?.unitPrice} DH
                        </div>
                      </td>

                      {/* Quantite */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-zinc-900 dark:text-white">
                        {totalQty}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                        {order.totalAmount} DH
                      </td>

                      {/* Paye */}
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        {order.paidAmount} DH
                      </td>

                      {/* Reste */}
                      <td className="py-3 px-4 text-right font-mono">
                        {order.remainingAmount > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-bold">{order.remainingAmount} DH</span>
                        ) : (
                          <span className="text-zinc-400">0 DH</span>
                        )}
                      </td>

                      {/* Statut Production */}
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${
                          isCancelled ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200'
                        }`}>
                          {getStatusLabel(order.status)}
                        </span>
                        {isCancelled && (
                          <div className="text-[10px] text-zinc-400 font-normal">Stock réintégré</div>
                        )}
                      </td>

                      {/* Statut Paiement */}
                      <td className="py-3 px-4">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Payment Button */}
                          {!isCancelled && order.remainingAmount > 0 && (
                            <button
                              onClick={() => {
                                setTargetOrderForPayment(order);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-2 py-1 text-[11px] bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-medium rounded transition cursor-pointer"
                              title="Encaisser un versement"
                            >
                              + Payer
                            </button>
                          )}

                          {/* Quick Cancel Button (Restores Stock) */}
                          {viewScope === 'active' && !isCancelled && (
                            <button
                              onClick={e => handleCancelOrder(e, order)}
                              className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                              title="Annuler la commande (Restitue automatiquement le stock)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Archive / Restore / Delete Permanently Button */}
                          {viewScope === 'active' ? (
                            <button
                              onClick={e => handleArchiveOrder(e, order.id)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
                              title="Archiver cette commande"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={e => handleRestoreOrder(e, order.id)}
                                className="px-2 py-1 text-[11px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold rounded flex items-center gap-1 transition cursor-pointer"
                                title="Restaurer la commande des archives"
                              >
                                <RotateCcw className="w-3 h-3" /> Restaurer
                              </button>
                              {confirmDeleteId === order.id ? (
                                <button
                                  onClick={() => {
                                    deleteOrderPermanently(order.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 text-[11px] bg-red-600 text-white font-semibold rounded transition cursor-pointer"
                                  title="Confirmer suppression définitive"
                                >
                                  Confirmer
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(order.id)}
                                  className="px-2 py-1 text-[11px] bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-semibold rounded flex items-center gap-1 transition cursor-pointer"
                                  title="Supprimer définitivement la commande"
                                >
                                  <Trash2 className="w-3 h-3" /> Supprimer
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => setSelectedOrderId(order.id)}
                            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                            title="Ouvrir la fiche"
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
    </div>
  );
};
