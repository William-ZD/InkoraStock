import React, { useState } from 'react';
import { Ban, X, AlertTriangle, RotateCcw, PackageCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CancelOrderModal: React.FC = () => {
  const { cancellingOrder, setCancellingOrder, cancelOrder } = useApp();
  const [reason, setReason] = useState<string>('Annulation demandée par le client');

  if (!cancellingOrder) return null;

  const totalPieces = cancellingOrder.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleConfirm = () => {
    cancelOrder(cancellingOrder.id, reason.trim() || 'Annulation manuelle');
    setCancellingOrder(null);
    setReason('Annulation demandée par le client');
  };

  const handleClose = () => {
    setCancellingOrder(null);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-red-50/60 dark:bg-red-950/30">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <Ban className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                Annuler la Commande {cancellingOrder.orderNumber}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Client : <strong className="text-zinc-800 dark:text-zinc-200">{cancellingOrder.customerName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Automatic Stock Restoration Explanation */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <PackageCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Restitution automatique du stock :</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              L'annulation réintègre immédiatement <strong>{totalPieces} pièce(s)</strong> dans l'inventaire de l'atelier :
            </p>
            <ul className="space-y-1 pl-1 text-[11px] font-mono">
              {cancellingOrder.items.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between border-t border-amber-200/60 dark:border-amber-900/40 pt-1">
                  <span>{item.productName} ({item.color} - {item.size})</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">+{item.quantity} pièce(s)</strong>
                </li>
              ))}
            </ul>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 block text-[11px]">
              Motif de l'annulation (optionnel) :
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Demande client, Erreur taille, Annulation événement..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 dark:focus:ring-zinc-400"
            />
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Le statut passera à <span className="font-semibold text-red-600 dark:text-red-400">« Annulée »</span>. Vous pourrez toujours retrouver cette commande dans les archives ou le tableau.
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-end gap-2.5">
          <button
            onClick={handleClose}
            className="px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Conserver la commande
          </button>
          <button
            onClick={handleConfirm}
            className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Confirmer l'annulation (Restituer stock)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
