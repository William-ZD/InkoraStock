import React from 'react';
import {
  X,
  Phone,
  MapPin,
  Instagram,
  ShoppingBag,
  Palette,
  CreditCard,
  Plus,
  Archive,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CustomerDetailModal: React.FC = () => {
  const {
    customers,
    orders,
    designs,
    payments,
    selectedCustomerId,
    setSelectedCustomerId,
    setSelectedOrderId,
    setIsOrderModalOpen,
    archiveCustomer,
  } = useApp();

  const customer = customers.find(c => c.id === selectedCustomerId);
  if (!customer) return null;

  const customerOrders = orders.filter(
    o => o.customerId === customer.id && !o.archivedAt
  );
  const validCustomerOrders = customerOrders.filter(o => o.status !== 'ANNULEE');
  const validOrderIds = new Set(validCustomerOrders.map(o => o.id));

  const customerDesigns = designs.filter(
    d => d.customerId === customer.id && !d.archivedAt
  );

  const customerPayments = payments.filter(
    p => p.customerId === customer.id && validOrderIds.has(p.orderId)
  );

  const totalSpent = validCustomerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = validCustomerOrders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalRemaining = validCustomerOrders.reduce((sum, o) => sum + o.remainingAmount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-2.5 py-1 rounded">
              {customer.id}
            </span>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                {customer.name}
              </h2>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Client depuis le {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedCustomerId(null);
                setIsOrderModalOpen(true);
              }}
              className="bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nouvelle commande</span>
            </button>
            <button
              onClick={() => setSelectedCustomerId(null)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Coordinates & Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact info */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-lg space-y-2 text-xs">
              <div className="text-zinc-400 dark:text-zinc-500 uppercase font-semibold text-[10px] tracking-wider mb-2">
                Coordonnées
              </div>
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-mono font-medium">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>{customer.location}</span>
              </div>
              {customer.instagramUsername && (
                <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                  <Instagram className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                  <span className="font-mono">{customer.instagramUsername}</span>
                </div>
              )}
              {customer.notes && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-[11px]">
                  {customer.notes}
                </div>
              )}
            </div>

            {/* Financial summary */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-lg space-y-2 text-xs">
              <div className="text-zinc-400 dark:text-zinc-500 uppercase font-semibold text-[10px] tracking-wider mb-2">
                Bilan Financier
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Volume d'affaires :</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{totalSpent} DH</span>
              </div>
              <div className="flex justify-between items-center text-emerald-800 dark:text-emerald-400">
                <span>Total encaissé :</span>
                <span className="font-mono font-bold">{totalPaid} DH</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-700 font-bold">
                <span className="text-zinc-700 dark:text-zinc-300">Reste dû :</span>
                <span
                  className={`font-mono text-sm ${
                    totalRemaining > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-400'
                  }`}
                >
                  {totalRemaining} DH
                </span>
              </div>
            </div>
          </div>

          {/* Section: COMMANDES DU CLIENT (Rule 18) */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Historique des Commandes ({customerOrders.length})
            </div>
            {customerOrders.length === 0 ? (
              <div className="text-xs text-zinc-400 py-4 text-center border border-dashed border-zinc-200 rounded-lg">
                Aucune commande pour ce client.
              </div>
            ) : (
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                    <tr>
                      <th className="py-2 px-3">N° Commande</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Articles</th>
                      <th className="py-2 px-3 text-right">Total</th>
                      <th className="py-2 px-3">Statut</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {customerOrders.map(order => (
                      <tr key={order.id} className="hover:bg-zinc-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-zinc-900">
                          {order.orderNumber}
                        </td>
                        <td className="py-2 px-3 text-zinc-500">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-2 px-3 text-zinc-700">
                          {order.items.map(it => `${it.quantity}× ${it.productName} (${it.size})`).join(', ')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">
                          {order.totalAmount} DH
                        </td>
                        <td className="py-2 px-3 font-medium text-zinc-800">
                          {order.status}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedCustomerId(null);
                              setSelectedOrderId(order.id);
                            }}
                            className="text-zinc-600 hover:text-zinc-900 font-medium text-[11px] cursor-pointer inline-flex items-center gap-0.5"
                          >
                            Ouvrir <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: DESIGNS DU CLIENT (Rule 18 & 25) */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Designs & Visuels Associés ({customerDesigns.length})
            </div>
            {customerDesigns.length === 0 ? (
              <div className="text-xs text-zinc-400 py-4 text-center border border-dashed border-zinc-200 rounded-lg">
                Aucun design rattaché à ce client.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {customerDesigns.map(design => (
                  <div
                    key={design.id}
                    className="p-3 border border-zinc-200 rounded-lg bg-zinc-50/50 flex items-center gap-3"
                  >
                    {design.fileUrl ? (
                      <img
                        src={design.fileUrl}
                        alt={design.name}
                        className="w-12 h-12 object-cover rounded border border-zinc-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold p-1 text-center">
                        Sur mesure
                      </div>
                    )}
                    <div className="truncate">
                      <div className="text-xs font-semibold text-zinc-900 truncate">
                        {design.name}
                      </div>
                      <div className="text-[10px] text-zinc-500">{design.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: PAIEMENTS DU CLIENT (Rule 18) */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Historique des Règlements ({customerPayments.length})
            </div>
            {customerPayments.length === 0 ? (
              <div className="text-xs text-zinc-400 py-3 text-center border border-dashed border-zinc-200 rounded-lg">
                Aucun règlement enregistré.
              </div>
            ) : (
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Commande</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {customerPayments.map(p => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 text-zinc-500 font-mono">{p.date}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-zinc-800">
                          {p.orderNumber}
                        </td>
                        <td className="py-2 px-3 text-zinc-700">{p.paymentMethod}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                          +{p.amount} DH
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between">
          <button
            onClick={() => {
              archiveCustomer(customer.id);
              setSelectedCustomerId(null);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" /> Archiver le client
          </button>

          <button
            onClick={() => setSelectedCustomerId(null)}
            className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
