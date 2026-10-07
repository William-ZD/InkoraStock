import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Printer,
  Ban,
  Clock,
  CheckCircle,
  Truck,
  Archive,
  ArrowRight,
  Phone,
  MapPin,
  Instagram,
  User,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OrderStatus } from '../../types';
import { OrderReceiptModal } from './OrderReceiptModal';

export const OrderDetailModal: React.FC = () => {
  const {
    orders,
    designs,
    payments,
    selectedOrderId,
    setSelectedOrderId,
    updateOrderStatus,
    cancelOrder,
    markOrderAsPaid,
    archiveOrder,
    restoreOrder,
    setTargetOrderForPayment,
    setIsPaymentModalOpen,
    setCancellingOrder,
  } = useApp();

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const order = orders.find(o => o.id === selectedOrderId);
  if (!order) return null;

  const orderPayments = payments.filter(p => p.orderId === order.id);

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

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'PAYE':
        return 'Entièrement payé';
      case 'PARTIELLEMENT_PAYE':
        return 'Partiellement payé';
      case 'NON_PAYE':
        return 'Non payé';
      default:
        return status;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-2.5 py-1 rounded">
                {order.orderNumber}
              </span>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  Commande {order.orderNumber} — {order.customerName}
                </h2>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span>Créée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                  <span>·</span>
                  <span>Stock déduit : {order.stockDeductedAt ? 'Oui (automatique)' : 'Non (restauré)'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReceiptOpen(true)}
                className="p-1.5 rounded-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700"
                title="Imprimer le bon de commande / reçu"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer</span>
              </button>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Status Bars (Strict Separation: Production vs Payment) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Production Status */}
              <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Statut de Production
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-zinc-900 dark:text-white">
                    {getStatusLabel(order.status)}
                  </div>
                  {order.status === 'ANNULEE' && (
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Ban className="w-3.5 h-3.5" /> Stock restauré
                    </span>
                  )}
                </div>

                {/* Status Switcher Buttons */}
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
                  {(['EN_ATTENTE', 'EN_PRODUCTION', 'PRETE', 'LIVREE'] as OrderStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => updateOrderStatus(order.id, st)}
                      className={`text-[11px] px-2 py-1 rounded font-medium transition cursor-pointer ${
                        order.status === st
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold'
                          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {getStatusLabel(st)}
                    </button>
                  ))}
                  {order.status !== 'ANNULEE' ? (
                    <button
                      onClick={() => setCancellingOrder(order)}
                      className="text-[11px] px-2.5 py-1 rounded font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition cursor-pointer flex items-center gap-1"
                    >
                      <Ban className="w-3 h-3" />
                      <span>Annuler commande (Rendre stock)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'EN_ATTENTE')}
                      className="text-[11px] px-2 py-1 rounded font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Réactiver
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Status */}
              <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Statut Financier
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-zinc-900 dark:text-white">
                    {getPaymentStatusLabel(order.paymentStatus)}
                  </div>
                  <div className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                    {order.paidAmount} / {order.totalAmount} DH
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <div className="text-xs text-zinc-500">
                    Reste :{' '}
                    <strong className={`font-mono ${order.remainingAmount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {order.remainingAmount} DH
                    </strong>
                  </div>
                  {order.remainingAmount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setTargetOrderForPayment(order);
                          setIsPaymentModalOpen(true);
                        }}
                        className="text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium px-2 py-1 rounded transition cursor-pointer flex items-center gap-1"
                      >
                        + Versement
                      </button>
                      <button
                        onClick={() => markOrderAsPaid(order.id)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1"
                        title="Marquer comme payée intégralement"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Marquer payée
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Fiche Client
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 text-zinc-900 font-medium">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{order.customerPhone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{order.customerLocation || 'Maroc'}</span>
                </div>
                {order.customerInstagram && (
                  <div className="flex items-center gap-2 text-zinc-600 md:col-span-3">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span className="font-mono text-[11px]">{order.customerInstagram}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ordered Items Table */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Articles & Vêtements Commandés
              </div>
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                    <tr>
                      <th className="py-2.5 px-3">Article</th>
                      <th className="py-2.5 px-3">Variante</th>
                      <th className="py-2.5 px-3 text-center">Quantité</th>
                      <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {order.items.map(item => (
                      <tr key={item.id} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 font-medium text-zinc-900">
                          {item.productName}
                          <div className="text-[11px] text-zinc-400">Position : {item.printPosition}</div>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600">
                          {item.color} · Taille {item.size}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-600">
                          {item.unitPrice} DH
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                          {item.totalPrice} DH
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Designs Linked to Items */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Designs et Emplacements Impression
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.items.map(item => {
                  const front = designs.find(d => d.id === item.frontDesignId);
                  const back = designs.find(d => d.id === item.backDesignId);
                  return (
                    <React.Fragment key={item.id}>
                      {front && (
                        <div className="p-3 border border-zinc-200 rounded-lg flex items-center gap-3 bg-zinc-50/50">
                          {front.fileUrl ? (
                            <img
                              src={front.fileUrl}
                              alt={front.name}
                              className="w-14 h-14 object-cover rounded border border-zinc-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold p-1 text-center">
                              Sur mesure
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-zinc-900">{front.name}</div>
                            <div className="text-[11px] text-zinc-500">Position : AVANT (Front)</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">Statut design : {front.status}</div>
                          </div>
                        </div>
                      )}
                      {back && (
                        <div className="p-3 border border-zinc-200 rounded-lg flex items-center gap-3 bg-zinc-50/50">
                          {back.fileUrl ? (
                            <img
                              src={back.fileUrl}
                              alt={back.name}
                              className="w-14 h-14 object-cover rounded border border-zinc-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold p-1 text-center">
                              Sur mesure
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-zinc-900">{back.name}</div>
                            <div className="text-[11px] text-zinc-500">Position : ARRIÈRE (Back)</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">Statut design : {back.status}</div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Payment History List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Historique des Règlements Encaissés
                </div>
                {order.remainingAmount > 0 && (
                  <button
                    onClick={() => {
                      setTargetOrderForPayment(order);
                      setIsPaymentModalOpen(true);
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
                  >
                    + Encaisser un nouveau paiement
                  </button>
                )}
              </div>

              {orderPayments.length === 0 ? (
                <div className="text-xs text-zinc-400 py-3 text-center border border-dashed border-zinc-200 rounded-lg">
                  Aucun paiement enregistré pour cette commande.
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Moyen</th>
                        <th className="py-2 px-3">Note</th>
                        <th className="py-2 px-3 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {orderPayments.map(p => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 text-zinc-600 font-mono">{p.date}</td>
                          <td className="py-2 px-3 font-medium text-zinc-900">{p.paymentMethod}</td>
                          <td className="py-2 px-3 text-zinc-500">{p.note || '-'}</td>
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

            {/* Notes if any */}
            {order.notes && (
              <div className="p-3 bg-zinc-50 rounded-lg text-xs text-zinc-700">
                <span className="font-semibold text-zinc-900">Notes atelier : </span>
                {order.notes}
              </div>
            )}
          </div>

          {/* Footer with archive / close */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between">
            <div>
              {order.archivedAt ? (
                <button
                  onClick={() => restoreOrder(order.id)}
                  className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurer des archives
                </button>
              ) : (
                <button
                  onClick={() => {
                    archiveOrder(order.id);
                    setSelectedOrderId(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" /> Archiver la commande
                </button>
              )}
            </div>

            <button
              onClick={() => setSelectedOrderId(null)}
              className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {isReceiptOpen && (
        <OrderReceiptModal
          order={order}
          payments={orderPayments}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </>
  );
};
