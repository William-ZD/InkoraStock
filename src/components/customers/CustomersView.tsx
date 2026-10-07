import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Instagram,
  ChevronRight,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerModal } from './CustomerModal';
import { CustomerDetailModal } from './CustomerDetailModal';

export const CustomersView: React.FC = () => {
  const {
    customers,
    orders,
    searchQuery,
    setSelectedCustomerId,
    setIsCustomerModalOpen,
    archiveCustomer,
    restoreCustomer,
    deleteCustomerPermanently,
  } = useApp();

  const [viewScope, setViewScope] = useState<'active' | 'archived'>('active');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeCount = customers.filter(c => !c.archivedAt).length;
  const archivedCount = customers.filter(c => Boolean(c.archivedAt)).length;

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => (viewScope === 'active' ? !c.archivedAt : Boolean(c.archivedAt)))
      .filter(c => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.instagramUsername.toLowerCase().includes(q)
        );
      });
  }, [customers, viewScope, searchQuery]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Répertoire Clients
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gestion des coordonnées, profils Instagram, historique des achats et soldes.
          </p>
        </div>

        <button
          onClick={() => setIsCustomerModalOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold py-2 px-3 rounded-lg shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Nouveau client</span>
        </button>
      </div>

      {/* Scope Switcher: Actifs vs Archivés */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewScope('active')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            viewScope === 'active'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Clients Actifs ({activeCount})
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
          <span>Archives ({archivedCount})</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Identifiant</th>
                <th className="py-3 px-4">Nom Client</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4">Localisation</th>
                <th className="py-3 px-4">Instagram</th>
                <th className="py-3 px-4 text-center">Commandes</th>
                <th className="py-3 px-4 text-right">Total Dépensé</th>
                <th className="py-3 px-4 text-right">Reste Dû</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400 text-xs">
                    {viewScope === 'active'
                      ? 'Aucun client actif trouvé.'
                      : 'Aucun client archivé.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => {
                  const custOrders = orders.filter(
                    o => o.customerId === customer.id && !o.archivedAt && o.status !== 'ANNULEE'
                  );
                  const totalSpent = custOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                  const totalRemaining = custOrders.reduce((sum, o) => sum + o.remainingAmount, 0);

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-zinc-500">
                        {customer.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                        {customer.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                        {customer.phone}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {customer.location}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-700 dark:text-zinc-300">
                        {customer.instagramUsername ? (
                          <span className="text-pink-700 dark:text-pink-400">{customer.instagramUsername}</span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-zinc-900 dark:text-white">
                        {custOrders.length}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                        {totalSpent} DH
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {totalRemaining > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-bold">{totalRemaining} DH</span>
                        ) : (
                          <span className="text-zinc-400">0 DH</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {viewScope === 'active' ? (
                            <button
                              onClick={() => archiveCustomer(customer.id)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
                              title="Archiver ce client"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => restoreCustomer(customer.id)}
                                className="px-2 py-1 text-[11px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold rounded flex items-center gap-1 transition cursor-pointer"
                                title="Restaurer ce client"
                              >
                                <RotateCcw className="w-3 h-3" /> Restaurer
                              </button>
                              {confirmDeleteId === customer.id ? (
                                <button
                                  onClick={() => {
                                    deleteCustomerPermanently(customer.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 text-[11px] bg-red-600 text-white font-semibold rounded transition cursor-pointer"
                                >
                                  Confirmer
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(customer.id)}
                                  className="px-2 py-1 text-[11px] bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-semibold rounded flex items-center gap-1 transition cursor-pointer"
                                  title="Supprimer définitivement ce client"
                                >
                                  <Trash2 className="w-3 h-3" /> Supprimer
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => setSelectedCustomerId(customer.id)}
                            className="p-1 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition cursor-pointer"
                            title="Consulter le profil client"
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
