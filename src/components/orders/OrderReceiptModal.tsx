import React from 'react';
import { X, Printer, Scissors } from 'lucide-react';
import { Order, Payment } from '../../types';

interface OrderReceiptModalProps {
  order: Order;
  payments: Payment[];
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  payments,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Controls - Hidden during print */}
        <div className="px-6 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 print:hidden">
          <span className="text-xs font-semibold text-zinc-700">Aperçu avant impression</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-zinc-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-zinc-800 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimer / Sauvegarder PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Slip Content */}
        <div className="p-8 space-y-6 text-zinc-900 font-sans print:p-4" id="printable-slip">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-zinc-900" />
                <h1 className="text-lg font-black tracking-tight uppercase">Atelier Custom</h1>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Personnalisation & Confection Vêtements</p>
            </div>
            <div className="text-right">
              <div className="text-base font-mono font-black">{order.orderNumber}</div>
              <div className="text-xs text-zinc-500">Date : {new Date(order.createdAt).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          {/* Client info */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Client</span>
              <div className="font-bold text-sm text-zinc-900">{order.customerName}</div>
              <div className="text-zinc-600">{order.customerPhone}</div>
              {order.customerLocation && <div className="text-zinc-500">{order.customerLocation}</div>}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Instagram</span>
              <div className="font-mono text-zinc-800">{order.customerInstagram || 'N/A'}</div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mt-1">Statut Atelier</span>
              <div className="font-semibold text-zinc-900">{order.status}</div>
            </div>
          </div>

          {/* Items breakdown */}
          <div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 uppercase text-[10px]">
                  <th className="py-1">Article & Position</th>
                  <th className="py-1">Taille/Coul</th>
                  <th className="py-1 text-center">Qté</th>
                  <th className="py-1 text-right">P.U</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {order.items.map(it => (
                  <tr key={it.id}>
                    <td className="py-2 font-medium">
                      {it.productName}
                      <div className="text-[10px] text-zinc-500">Impression : {it.printPosition}</div>
                    </td>
                    <td className="py-2 text-zinc-600">
                      {it.color} · {it.size}
                    </td>
                    <td className="py-2 text-center font-mono font-bold">{it.quantity}</td>
                    <td className="py-2 text-right font-mono text-zinc-600">{it.unitPrice} DH</td>
                    <td className="py-2 text-right font-mono font-bold">{it.totalPrice} DH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial summary */}
          <div className="border-t-2 border-zinc-900 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Montant Total Commande :</span>
              <span className="font-mono font-bold text-zinc-900">{order.totalAmount} DH</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-medium">
              <span>Total Déjà Payé :</span>
              <span className="font-mono font-bold">-{order.paidAmount} DH</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-zinc-200 text-zinc-900">
              <span>Solde Restant à Payer :</span>
              <span className="font-mono text-base font-black">
                {order.remainingAmount} DH
              </span>
            </div>
          </div>

          {/* Payments detail if any */}
          {payments.length > 0 && (
            <div className="text-[11px] text-zinc-500 border-t border-zinc-100 pt-2 space-y-1">
              <span className="font-bold text-zinc-700 block">Règlements enregistrés :</span>
              {payments.map(p => (
                <div key={p.id} className="flex justify-between">
                  <span>{p.date} · {p.paymentMethod}</span>
                  <span className="font-mono font-medium">{p.amount} DH</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer note */}
          <div className="text-center text-[10px] text-zinc-400 pt-4 border-t border-dashed border-zinc-200">
            Merci pour votre confiance. Conservez ce reçu pour le retrait de vos articles à l’atelier.
          </div>
        </div>
      </div>
    </div>
  );
};
