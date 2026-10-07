import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MovementsView: React.FC = () => {
  const { stockMovements, searchQuery, setIsStockMovementModalOpen } = useApp();
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredMovements = useMemo(() => {
    return stockMovements.filter(mvt => {
      if (typeFilter !== 'ALL' && mvt.type !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        mvt.productName.toLowerCase().includes(q) ||
        mvt.color.toLowerCase().includes(q) ||
        mvt.size.toLowerCase().includes(q) ||
        (mvt.reason || '').toLowerCase().includes(q) ||
        (mvt.orderNumber || '').toLowerCase().includes(q)
      );
    });
  }, [stockMovements, typeFilter, searchQuery]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Historique & Traçabilité des Mouvements de Stock
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Audit complet de chaque entrée, sortie manuelle, déduction commande et réintégration.
          </p>
        </div>

        <button
          onClick={() => setIsStockMovementModalOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold py-2 px-3 rounded-lg shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Nouveau mouvement</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'Tous les mouvements' },
          { id: 'STOCK_IN', label: 'Entrées réassort' },
          { id: 'ORDER', label: 'Consommations commandes' },
          { id: 'ORDER_CANCELLED', label: 'Restaurations annulations' },
          { id: 'STOCK_OUT', label: 'Sorties manuelles / Pertes' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              typeFilter === tab.id
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Variante (Couleur & Taille)</th>
                <th className="py-3 px-4 text-center">Quantité</th>
                <th className="py-3 px-4">Type de Mouvement</th>
                <th className="py-3 px-4">Motif / Justification</th>
                <th className="py-3 px-4">N° Commande Liée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs">
                    Aucun mouvement trouvé.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(mvt => {
                  const isPositive = mvt.quantity > 0;
                  return (
                    <tr key={mvt.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 font-mono">
                        {new Date(mvt.createdAt).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                        {mvt.productName}
                      </td>
                      <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                        {mvt.color} · Taille {mvt.size}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-red-700 dark:text-red-400'
                          }
                        >
                          {isPositive ? `+${mvt.quantity}` : mvt.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                        {mvt.type === 'STOCK_IN' && 'Entrée réassort'}
                        {mvt.type === 'STOCK_OUT' && 'Sortie manuelle'}
                        {mvt.type === 'ORDER' && 'Commande client'}
                        {mvt.type === 'ORDER_CANCELLED' && 'Restauration commande annulée'}
                        {mvt.type === 'ADJUSTMENT' && 'Ajustement inventaire'}
                        {mvt.type === 'RETURN' && 'Retour'}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {mvt.reason || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                        {mvt.orderNumber || '-'}
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
