import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StockMovementType } from '../../types';

export const StockMovementModal: React.FC = () => {
  const {
    isStockMovementModalOpen,
    setIsStockMovementModalOpen,
    products,
    variants,
    adjustStock,
  } = useApp();

  const activeProducts = useMemo(() => products.filter(p => !p.archivedAt), [products]);

  const [operationType, setOperationType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Variants for selected product
  const productVariants = useMemo(
    () => variants.filter(v => v.productId === selectedProductId),
    [variants, selectedProductId]
  );

  const availableColors = useMemo(() => {
    return Array.from(new Set(productVariants.map(v => v.color)));
  }, [productVariants]);

  const availableSizes = useMemo(() => {
    if (!selectedColor) return [];
    return productVariants.filter(v => v.color === selectedColor);
  }, [productVariants, selectedColor]);

  const currentVariant = useMemo(() => {
    return productVariants.find(
      v => v.color === selectedColor && v.size === selectedSize
    );
  }, [productVariants, selectedColor, selectedSize]);

  const currentStock = currentVariant ? currentVariant.quantity : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentVariant) {
      setErrorMessage('Veuillez sélectionner un article, une couleur et une taille.');
      return;
    }

    if (quantity <= 0) {
      setErrorMessage('La quantité doit être supérieure à 0.');
      return;
    }

    if (operationType === 'REMOVE' && quantity > currentStock) {
      setErrorMessage(`Impossible de retirer ${quantity} pièce(s). Stock actuel disponible : ${currentStock}.`);
      return;
    }

    const delta = operationType === 'ADD' ? quantity : -quantity;
    const movementType: StockMovementType = operationType === 'ADD' ? 'STOCK_IN' : 'STOCK_OUT';
    const defaultReason = operationType === 'ADD'
      ? 'Réapprovisionnement manuel'
      : 'Retrait manuel';

    const success = adjustStock(
      currentVariant.id,
      delta,
      movementType,
      reason.trim() || defaultReason
    );

    if (!success) {
      setErrorMessage('Erreur lors de la mise à jour du stock.');
      return;
    }

    // Reset and close
    setQuantity(10);
    setReason('');
    setIsStockMovementModalOpen(false);
  };

  if (!isStockMovementModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              Mouvement Manuel de Stock
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Ajout de réassort ou retrait (défaut, échantillon, perte...).
            </p>
          </div>
          <button
            onClick={() => setIsStockMovementModalOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Operation Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-lg">
            <button
              type="button"
              onClick={() => setOperationType('ADD')}
              className={`py-2 px-3 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                operationType === 'ADD'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span>Ajouter du stock (+ entrée)</span>
            </button>
            <button
              type="button"
              onClick={() => setOperationType('REMOVE')}
              className={`py-2 px-3 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                operationType === 'REMOVE'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Minus className="w-4 h-4 text-red-600 stroke-[2.5]" />
              <span>Retirer du stock (- sortie)</span>
            </button>
          </div>

          {/* Product */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Article *
            </label>
            <select
              value={selectedProductId}
              onChange={e => {
                setSelectedProductId(e.target.value);
                setSelectedColor('');
                setSelectedSize('');
              }}
              className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white"
              required
            >
              <option value="">-- Choisir un vêtement --</option>
              {activeProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color & Size */}
          {selectedProductId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Couleur *
                </label>
                <select
                  value={selectedColor}
                  onChange={e => {
                    setSelectedColor(e.target.value);
                    setSelectedSize('');
                  }}
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white"
                  required
                >
                  <option value="">-- Couleur --</option>
                  {availableColors.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Taille *
                </label>
                <select
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                  disabled={!selectedColor}
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white disabled:opacity-50"
                  required
                >
                  <option value="">-- Taille --</option>
                  {availableSizes.map(v => (
                    <option key={v.id} value={v.size}>
                      {v.size} (Actuel : {v.quantity})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Quantity & Stock preview */}
          {currentVariant && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600">Stock actuel disponible :</span>
                <span className="font-mono font-bold text-zinc-900">{currentStock} pièces</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-zinc-600">Nouveau stock projeté :</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {operationType === 'ADD' ? currentStock + quantity : Math.max(0, currentStock - quantity)} pièces
                </span>
              </div>
            </div>
          )}

          {/* Quantity input */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Quantité à {operationType === 'ADD' ? 'ajouter' : 'retirer'} *
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white font-mono font-bold"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Motif / Raison du mouvement
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(operationType === 'ADD'
                ? ['Arrivage usine', 'Réassort atelier', 'Retour client', 'Inventaire correctif']
                : ['Produit défectueux', 'Échantillon client', 'Perte / Dégradation', 'Erreur inventaire']
              ).map(mot => (
                <button
                  key={mot}
                  type="button"
                  onClick={() => setReason(mot)}
                  className="text-[10px] px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded transition cursor-pointer"
                >
                  {mot}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Ex: Réception commande fournisseur n°84..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsStockMovementModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!currentVariant}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                operationType === 'ADD'
                  ? 'bg-emerald-700 hover:bg-emerald-600'
                  : 'bg-red-700 hover:bg-red-600'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Valider le mouvement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
