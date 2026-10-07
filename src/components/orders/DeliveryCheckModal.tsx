import React from 'react';
import { CheckCircle2, Truck, Clock, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DeliveryCheckModal: React.FC = () => {
  const { deliveryPromptOrder, setDeliveryPromptOrder, updateOrderStatus } = useApp();

  if (!deliveryPromptOrder) return null;

  const handleConfirmDelivered = () => {
    updateOrderStatus(deliveryPromptOrder.id, 'LIVREE');
    setDeliveryPromptOrder(null);
  };

  const handleKeepCurrentStatus = () => {
    // Leaves order in its current production status (e.g. PRETE or EN_PRODUCTION)
    setDeliveryPromptOrder(null);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
          </div>

          <div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Commande {deliveryPromptOrder.orderNumber}
            </span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight mt-2">
              Paiement Intégral Reçu !
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Cette commande de <strong className="text-zinc-900 dark:text-white">{deliveryPromptOrder.customerName}</strong> ({deliveryPromptOrder.totalAmount} DH) est désormais entièrement soldée.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
            <span className="font-semibold block mb-0.5">La commande a-t-elle été remise ou livrée au client ?</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Statut actuel de production : <strong className="text-zinc-800 dark:text-zinc-200">{deliveryPromptOrder.status}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleKeepCurrentStatus}
              className="py-2.5 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Non, pas encore (Garder "{deliveryPromptOrder.status}")</span>
            </button>

            <button
              onClick={handleConfirmDelivered}
              className="py-2.5 px-3 rounded-lg bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Truck className="w-4 h-4 stroke-[2.2]" />
              <span>Oui, commande livrée</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
