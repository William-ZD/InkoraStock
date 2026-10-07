import React, { useState } from 'react';
import { X, Receipt, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory } from '../../types';

export const ExpenseModal: React.FC = () => {
  const { isExpenseModalOpen, setIsExpenseModalOpen, createExpense } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('CONSOMMABLES');
  const [amount, setAmount] = useState<number>(100);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    createExpense({
      title: title.trim(),
      category,
      amount,
      date,
      note: note.trim() || undefined,
    });

    setTitle('');
    setAmount(100);
    setNote('');
    setIsExpenseModalOpen(false);
  };

  if (!isExpenseModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/40">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-500" />
              Nouvelle Dépense / Charge
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Enregistre une charge d'exploitation déductible du bénéfice.
            </p>
          </div>
          <button
            onClick={() => setIsExpenseModalOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Libellé de la dépense *
            </label>
            <input
              type="text"
              placeholder="Ex: Loyer atelier, Encres d'impression, Facture électricité..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Catégorie *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="CONSOMMABLES">Consommables / Encre</option>
                <option value="LOYER">Loyer & Local</option>
                <option value="ELECTRICITE_EAU">Électricité & Eau</option>
                <option value="MATERIEL">Matériel & Entretien</option>
                <option value="TRANSPORT">Transport & Livraison</option>
                <option value="MARKETING">Marketing & Pub</option>
                <option value="AUTRE">Autre charge</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Montant payé (DH) *
              </label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={e => setAmount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono font-bold"
                required
              />
            </div>
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

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Détails ou note (optionnel)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Facture n°4492, fournisseur pièces..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-zinc-900 dark:bg-amber-500 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-amber-400 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Enregistrer la charge ({amount} DH)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
