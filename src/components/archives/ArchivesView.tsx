import React, { useState } from 'react';
import {
  Archive,
  RotateCcw,
  ShoppingBag,
  Package,
  Users,
  Palette,
  Receipt,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ArchivesView: React.FC = () => {
  const {
    orders,
    products,
    customers,
    designs,
    expenses,
    restoreOrder,
    restoreProduct,
    restoreCustomer,
    restoreDesign,
    restoreExpense,
    deleteOrderPermanently,
    deleteProductPermanently,
    deleteCustomerPermanently,
    deleteDesignPermanently,
    deleteExpensePermanently,
    purgeAllArchived,
  } = useApp();

  const [activeArchiveTab, setActiveArchiveTab] = useState<
    'orders' | 'products' | 'customers' | 'designs' | 'expenses'
  >('orders');
  const [restoredMessage, setRestoredMessage] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmPurgeAll, setConfirmPurgeAll] = useState<boolean>(false);

  const archivedOrders = orders.filter(o => Boolean(o.archivedAt));
  const archivedProducts = products.filter(p => Boolean(p.archivedAt));
  const archivedCustomers = customers.filter(c => Boolean(c.archivedAt));
  const archivedDesigns = designs.filter(d => Boolean(d.archivedAt));
  const archivedExpenses = expenses.filter(e => Boolean(e.archivedAt));

  const totalArchivedCount =
    archivedOrders.length +
    archivedProducts.length +
    archivedCustomers.length +
    archivedDesigns.length +
    archivedExpenses.length;

  const notifyAction = (msg: string) => {
    setRestoredMessage(msg);
    setTimeout(() => setRestoredMessage(''), 3500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Archives & Corbeille du Système
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Les éléments archivés ne sont pas comptabilisés dans vos statistiques ni votre caisse. Vous pouvez les restaurer ou les supprimer définitivement.
          </p>
        </div>

        {totalArchivedCount > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {confirmPurgeAll ? (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span className="text-xs font-semibold text-red-800 dark:text-red-200">
                  Supprimer définitivement les {totalArchivedCount} archive(s) ?
                </span>
                <button
                  onClick={() => {
                    purgeAllArchived();
                    setConfirmPurgeAll(false);
                    notifyAction('Toutes les archives ont été supprimées définitivement.');
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded cursor-pointer transition"
                >
                  Oui, tout vider
                </button>
                <button
                  onClick={() => setConfirmPurgeAll(false)}
                  className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmPurgeAll(true)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider toutes les archives ({totalArchivedCount})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notification banner */}
      {restoredMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{restoredMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => {
            setActiveArchiveTab('orders');
            setConfirmDeleteId(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeArchiveTab === 'orders'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Commandes ({archivedOrders.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveArchiveTab('products');
            setConfirmDeleteId(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeArchiveTab === 'products'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Articles ({archivedProducts.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveArchiveTab('customers');
            setConfirmDeleteId(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeArchiveTab === 'customers'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Clients ({archivedCustomers.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveArchiveTab('designs');
            setConfirmDeleteId(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeArchiveTab === 'designs'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Designs ({archivedDesigns.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveArchiveTab('expenses');
            setConfirmDeleteId(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeArchiveTab === 'expenses'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Charges ({archivedExpenses.length})</span>
        </button>
      </div>

      {/* Content Tables */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        {activeArchiveTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">Commande</th>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                  <th className="py-2.5 px-4">Date Archivage</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {archivedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-400">
                      Aucune commande archivée.
                    </td>
                  </tr>
                ) : (
                  archivedOrders.map(o => (
                    <tr key={o.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-zinc-900 dark:text-white">
                        {o.orderNumber}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-800 dark:text-zinc-200">{o.customerName}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                        {o.totalAmount} DH
                      </td>
                      <td className="py-2.5 px-4 text-zinc-500 font-mono">
                        {o.archivedAt ? new Date(o.archivedAt).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              restoreOrder(o.id);
                              notifyAction(`Commande ${o.orderNumber} restaurée dans les commandes actives.`);
                            }}
                            className="px-2.5 py-1 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <RotateCcw className="w-3 h-3" /> Restaurer
                          </button>

                          {confirmDeleteId === o.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  deleteOrderPermanently(o.id);
                                  setConfirmDeleteId(null);
                                  notifyAction(`Commande ${o.orderNumber} supprimée définitivement.`);
                                }}
                                className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded font-semibold cursor-pointer transition"
                              >
                                Confirmer suppression
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(o.id)}
                              className="px-2.5 py-1 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-3 h-3" /> Supprimer définitivement
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
        )}

        {activeArchiveTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Modèle</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Prix d'Achat</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {archivedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-400">
                      Aucun vêtement archivé.
                    </td>
                  </tr>
                ) : (
                  archivedProducts.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-zinc-500">{p.id}</td>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-white">{p.name}</td>
                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">{p.type}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                        {p.costPrice ?? p.unitPrice} DH
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              restoreProduct(p.id);
                              notifyAction(`Article "${p.name}" restauré dans le stock actif.`);
                            }}
                            className="px-2.5 py-1 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <RotateCcw className="w-3 h-3" /> Restaurer
                          </button>

                          {confirmDeleteId === p.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  deleteProductPermanently(p.id);
                                  setConfirmDeleteId(null);
                                  notifyAction(`Article "${p.name}" supprimé définitivement.`);
                                }}
                                className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded font-semibold cursor-pointer transition"
                              >
                                Confirmer suppression
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="px-2.5 py-1 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-3 h-3" /> Supprimer définitivement
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
        )}

        {activeArchiveTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Nom</th>
                  <th className="py-2.5 px-4">Téléphone</th>
                  <th className="py-2.5 px-4">Ville</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {archivedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-400">
                      Aucun client archivé.
                    </td>
                  </tr>
                ) : (
                  archivedCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-zinc-500">{c.id}</td>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-white">{c.name}</td>
                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400 font-mono">{c.phone}</td>
                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">{c.location}</td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              restoreCustomer(c.id);
                              notifyAction(`Client "${c.name}" restauré.`);
                            }}
                            className="px-2.5 py-1 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <RotateCcw className="w-3 h-3" /> Restaurer
                          </button>

                          {confirmDeleteId === c.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  deleteCustomerPermanently(c.id);
                                  setConfirmDeleteId(null);
                                  notifyAction(`Client "${c.name}" supprimé définitivement.`);
                                }}
                                className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded font-semibold cursor-pointer transition"
                              >
                                Confirmer suppression
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(c.id)}
                              className="px-2.5 py-1 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-3 h-3" /> Supprimer définitivement
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
        )}

        {activeArchiveTab === 'designs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Nom Design</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {archivedDesigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-400">
                      Aucun design archivé.
                    </td>
                  </tr>
                ) : (
                  archivedDesigns.map(d => (
                    <tr key={d.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-zinc-500">{d.id}</td>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-white">{d.name}</td>
                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">{d.type}</td>
                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">{d.customerName || '-'}</td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              restoreDesign(d.id);
                              notifyAction(`Design "${d.name}" restauré.`);
                            }}
                            className="px-2.5 py-1 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <RotateCcw className="w-3 h-3" /> Restaurer
                          </button>

                          {confirmDeleteId === d.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  deleteDesignPermanently(d.id);
                                  setConfirmDeleteId(null);
                                  notifyAction(`Design "${d.name}" supprimé définitivement.`);
                                }}
                                className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded font-semibold cursor-pointer transition"
                              >
                                Confirmer suppression
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(d.id)}
                              className="px-2.5 py-1 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-3 h-3" /> Supprimer définitivement
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
        )}

        {activeArchiveTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Libellé</th>
                  <th className="py-2.5 px-4">Catégorie</th>
                  <th className="py-2.5 px-4 text-right">Montant</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {archivedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-400">
                      Aucune charge archivée.
                    </td>
                  </tr>
                ) : (
                  archivedExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-4 font-mono text-zinc-500">{e.date}</td>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-white">{e.title}</td>
                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">{e.category}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                        {e.amount} DH
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              restoreExpense(e.id);
                              notifyAction(`Charge "${e.title}" restaurée.`);
                            }}
                            className="px-2.5 py-1 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <RotateCcw className="w-3 h-3" /> Restaurer
                          </button>

                          {confirmDeleteId === e.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  deleteExpensePermanently(e.id);
                                  setConfirmDeleteId(null);
                                  notifyAction(`Charge "${e.title}" supprimée définitivement.`);
                                }}
                                className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded font-semibold cursor-pointer transition"
                              >
                                Confirmer suppression
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(e.id)}
                              className="px-2.5 py-1 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-3 h-3" /> Supprimer définitivement
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
        )}
      </div>
    </div>
  );
};
