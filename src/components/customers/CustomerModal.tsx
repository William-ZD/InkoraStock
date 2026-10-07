import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CustomerModal: React.FC = () => {
  const { isCustomerModalOpen, setIsCustomerModalOpen, createCustomer } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Casablanca');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createCustomer({
      name: name.trim(),
      phone: phone.trim() || 'Non renseigné',
      location: location.trim() || 'Non précisé',
      instagramUsername: instagramUsername.trim().startsWith('@') || !instagramUsername.trim()
        ? instagramUsername.trim()
        : `@${instagramUsername.trim()}`,
      notes: notes.trim() || undefined,
    });

    // Reset and close
    setName('');
    setPhone('');
    setLocation('Casablanca');
    setInstagramUsername('');
    setNotes('');
    setIsCustomerModalOpen(false);
  };

  if (!isCustomerModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-500" />
              Nouveau Client
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Identifiant unique auto-généré (CLI-XXXX).
            </p>
          </div>
          <button
            onClick={() => setIsCustomerModalOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              placeholder="Ex: Ahmed Benali"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              placeholder="Ex: 06 61 23 45 67"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Ville / Localisation
              </label>
              <input
                type="text"
                placeholder="Ex: Casablanca, Rabat..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Instagram (@)
              </label>
              <input
                type="text"
                placeholder="@username"
                value={instagramUsername}
                onChange={e => setInstagramUsername(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Notes complémentaires (optionnel)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Marque de streetwear, commande souvent en gros..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Créer le client</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
