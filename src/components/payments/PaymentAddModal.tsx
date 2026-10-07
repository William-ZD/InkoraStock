import React, { useState, useEffect } from 'react';
import { X, CreditCard, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';

export const PaymentAddModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    targetOrderForPayment,
    setTargetOrderForPayment,
    orders,
    addPayment,
  } = useApp();

  const unpaidOrders = orders.filter(
    o => !o.archivedAt && o.remainingAmount > 0 && o.status !== 'ANNULEE'
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESPECES');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('Règlement solde commande');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isPaymentModalOpen) {
      if (targetOrderForPayment) {
        setSelectedOrderId(targetOrderForPayment.id);
        setAmount(targetOrderForPayment.remainingAmount);
      } else if (unpaidOrders.length > 0) {
        setSelectedOrderId(unpaidOrders[0].id);
        setAmount(unpaidOrders[0].remainingAmount);
      } else {
        setSelectedOrderId('');
        setAmount(0);
      }
      setErrorMessage('');
    }
  }, [targetOrderForPayment, isPaymentModalOpen]);

  const activeOrder = orders.find(o => o.id === selectedOrderId);

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      setAmount(ord.remainingAmount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedOrderId || !activeOrder) {
      setErrorMessage('Veuillez sélectionner une commande.');
      return;
    }

    if (amount <= 0) {
      setErrorMessage('Le montant doit être supérieur à 0 DH.');
      return;
    }

    if (amount > activeOrder.remainingAmount + 0.01) {
      setErrorMessage(
        `Le montant saisi (${amount} DH) dépasse le reste à payer de cette commande (${activeOrder.remainingAmount} DH).`
      );
      return;
    }

    const result = addPayment({
      orderId: selectedOrderId,
      amount,
      paymentMethod,
      date,
      note: note.trim() || undefined,
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Erreur lors du versement.');
      return;
    }

    // Reset and close
    setTargetOrderForPayment(null);
    setIsPaymentModalOpen(false);
  };

  if (!isPaymentModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/40">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Encaisser un Paiement
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Enregistre un versement et recalcule automatiquement le reste.
            </p>
          </div>
          <button
            onClick={() => {
              setTargetOrderForPayment(null);
              setIsPaymentModalOpen(false);
            }}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Order selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Commande à régler *
            </label>
            <select
              value={selectedOrderId}
              onChange={e => handleOrderChange(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              required
            >
              <option value="">-- Choisir la commande --</option>
              {unpaidOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} · {o.customerName} (Reste : {o.remainingAmount} DH)
                </option>
              ))}
            </select>
            {unpaidOrders.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                Toutes vos commandes actives sont déjà intégralement soldées.
              </p>
            )}
          </div>

          {/* Active order summary */}
          {activeOrder && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Client :</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{activeOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Montant total commande :</span>
                <span className="font-mono text-zinc-900 dark:text-white">{activeOrder.totalAmount} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Déjà payé :</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">{activeOrder.paidAmount} DH</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700 font-bold">
                <span className="text-zinc-700 dark:text-zinc-300">Reste à payer :</span>
                <span className="font-mono text-amber-700 dark:text-amber-400">{activeOrder.remainingAmount} DH</span>
              </div>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Montant du versement (DH) *
            </label>
            <input
              type="number"
              min={1}
              max={activeOrder ? activeOrder.remainingAmount : undefined}
              value={amount}
              onChange={e => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono font-bold text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Mode de règlement
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="ESPECES">Espèces (Cash atelier)</option>
                <option value="VIREMENT">Virement bancaire</option>
                <option value="CARTE">Carte bancaire</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Date du règlement
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Note ou référence (optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Virement CIH n°8392, remise en mains propres..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setTargetOrderForPayment(null);
                setIsPaymentModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!activeOrder || amount <= 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Encaisser {amount} DH</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
