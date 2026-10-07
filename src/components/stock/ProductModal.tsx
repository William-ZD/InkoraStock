import React, { useState } from 'react';
import { X, Package, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApparelType } from '../../types';

export const ProductModal: React.FC = () => {
  const { isProductModalOpen, setIsProductModalOpen, createProduct } = useApp();

  const [type, setType] = useState<ApparelType>('T-shirt');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState<number>(60);
  const [minimumStock, setMinimumStock] = useState<number>(3);
  const [description, setDescription] = useState('');

  // Colors & Sizes matrices
  const [colors, setColors] = useState<string[]>(['Noir', 'Blanc']);
  const [newColorInput, setNewColorInput] = useState('');
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [newSizeInput, setNewSizeInput] = useState('');

  // Quantities per combination: `${color}-${size}` => quantity
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [bulkQuantity, setBulkQuantity] = useState<number>(10);

  const handleAddColor = () => {
    const trimmed = newColorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors([...colors, trimmed]);
      setNewColorInput('');
    }
  };

  const handleRemoveColor = (col: string) => {
    if (colors.length > 1) {
      setColors(colors.filter(c => c !== col));
    }
  };

  const handleAddSize = () => {
    const trimmed = newSizeInput.trim().toUpperCase();
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes([...sizes, trimmed]);
      setNewSizeInput('');
    }
  };

  const handleRemoveSize = (sz: string) => {
    if (sizes.length > 1) {
      setSizes(sizes.filter(s => s !== sz));
    }
  };

  const handleQuantityChange = (color: string, size: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [`${color}-${size}`]: Math.max(0, value),
    }));
  };

  const handleApplyBulkQuantity = () => {
    const next: Record<string, number> = {};
    colors.forEach(c => {
      sizes.forEach(s => {
        next[`${c}-${s}`] = Math.max(0, bulkQuantity);
      });
    });
    setQuantities(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalColors = [...colors];
    if (newColorInput.trim() && !finalColors.includes(newColorInput.trim())) {
      finalColors.push(newColorInput.trim());
    }

    const finalSizes = [...sizes];
    if (newSizeInput.trim() && !finalSizes.includes(newSizeInput.trim().toUpperCase())) {
      finalSizes.push(newSizeInput.trim().toUpperCase());
    }

    // Generate initial variants matrix
    const initialVariants: { size: string; color: string; quantity: number }[] = [];
    finalColors.forEach(col => {
      finalSizes.forEach(sz => {
        const qty = quantities[`${col}-${sz}`] !== undefined ? quantities[`${col}-${sz}`] : 0;
        initialVariants.push({
          color: col,
          size: sz,
          quantity: qty,
        });
      });
    });

    createProduct(
      {
        name: name.trim(),
        type,
        costPrice,
        unitPrice: costPrice,
        minimumStock,
        description: description.trim() || undefined,
      },
      initialVariants
    );

    // Reset and close
    setName('');
    setDescription('');
    setCostPrice(60);
    setMinimumStock(3);
    setNewColorInput('');
    setNewSizeInput('');
    setQuantities({});
    setIsProductModalOpen(false);
  };

  if (!isProductModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/40">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              Nouveau Vêtement & Variantes
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Définissez l'article, son prix d'achat fournisseur et la matrice des stocks par taille/couleur.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsProductModalOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Type de vêtement *
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as ApparelType)}
                className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="T-shirt">T-shirt</option>
                <option value="Hoodie">Hoodie (Sweat à capuche)</option>
                <option value="Sweatshirt">Sweatshirt (Col rond)</option>
                <option value="Polo">Polo</option>
                <option value="Débardeur">Débardeur</option>
                <option value="Veste">Veste</option>
                <option value="Casquette">Casquette</option>
                <option value="Autre">Autre vêtement</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Nom du modèle *
              </label>
              <input
                type="text"
                placeholder="Ex: T-shirt Oversize 240g"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Pricing & Stock alert threshold */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Prix d'achat de l'article (DH) *
              </label>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5">
                Coût fournisseur unitaire. Le prix de vente sera fixé lors de la commande.
              </div>
              <input
                type="number"
                min={1}
                value={costPrice}
                onChange={e => setCostPrice(Math.max(1, parseInt(e.target.value, 10) || 0))}
                className="w-full text-xs px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Seuil d'alerte stock faible
              </label>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5">
                Alerte déclenchée si stock ≤ à ce seuil (défaut : 3).
              </div>
              <input
                type="number"
                min={0}
                value={minimumStock}
                onChange={e => setMinimumStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full text-xs px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          {/* Colors management */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
              Couleurs disponibles
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {colors.map(col => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                >
                  <span>{col}</span>
                  {colors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(col)}
                      className="text-zinc-400 hover:text-red-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ajouter une couleur (ex: Bleu Marine, Kaki...)"
                value={newColorInput}
                onChange={e => setNewColorInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColor();
                  }
                }}
                className="text-xs px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white w-64"
              />
              <button
                type="button"
                onClick={handleAddColor}
                className="text-xs px-3 py-1.5 bg-zinc-800 dark:bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-700 cursor-pointer"
              >
                + Ajouter couleur
              </button>
            </div>
          </div>

          {/* Sizes management */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
              Tailles disponibles
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {sizes.map(sz => (
                <span
                  key={sz}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                >
                  <span>{sz}</span>
                  {sizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(sz)}
                      className="text-zinc-400 hover:text-red-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ajouter une taille (ex: XS, XXL, 3XL...)"
                value={newSizeInput}
                onChange={e => setNewSizeInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSize();
                  }
                }}
                className="text-xs px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white w-64"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="text-xs px-3 py-1.5 bg-zinc-800 dark:bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-700 cursor-pointer"
              >
                + Ajouter taille
              </button>
            </div>
          </div>

          {/* Combinations Matrix (Color + Size = Initial Quantity) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Stock initial par combinaison (Couleur + Taille)
              </label>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Remplir tout avec :</span>
                <input
                  type="number"
                  min={0}
                  value={bulkQuantity}
                  onChange={e => setBulkQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-16 text-center px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyBulkQuantity}
                  className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded cursor-pointer text-[11px]"
                >
                  Appliquer partout
                </button>
              </div>
            </div>
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="py-2 px-3">Couleur</th>
                    <th className="py-2 px-3">Taille</th>
                    <th className="py-2 px-3 text-right">Quantité initiale en stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {colors.map(col =>
                    sizes.map(sz => {
                      const key = `${col}-${sz}`;
                      const val = quantities[key] !== undefined ? quantities[key] : 0;
                      return (
                        <tr key={key} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-2 px-3 font-medium text-zinc-900 dark:text-white">{col}</td>
                          <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 font-mono font-semibold">{sz}</td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min={0}
                              value={val}
                              onChange={e =>
                                handleQuantityChange(col, sz, parseInt(e.target.value, 10) || 0)
                              }
                              className="w-24 text-right text-xs px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Description ou composition (optionnel)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: 100% coton peigné, grammage lourd, coupe unisexe..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white dark:text-zinc-950 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-400 rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Enregistrer l'article</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
