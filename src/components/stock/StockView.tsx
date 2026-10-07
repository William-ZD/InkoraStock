import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Minus,
  History,
  Archive,
  RotateCcw,
  Edit2,
  Check,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StockView: React.FC = () => {
  const {
    products,
    variants,
    stockMovements,
    searchQuery,
    setIsProductModalOpen,
    setIsStockMovementModalOpen,
    updateProduct,
    archiveProduct,
    restoreProduct,
    deleteProductPermanently,
    adjustStock,
    setVariantStockExact,
    addVariant,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');
  const [viewScope, setViewScope] = useState<'active' | 'archived'>('active');
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(0);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Direct quantity editing on variant tile
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingVariantQty, setEditingVariantQty] = useState<number>(0);

  // Quick add variant to existing product
  const [addingVariantProductId, setAddingVariantProductId] = useState<string | null>(null);
  const [newVarColor, setNewVarColor] = useState<string>('');
  const [newVarSize, setNewVarSize] = useState<string>('M');
  const [newVarQty, setNewVarQty] = useState<number>(10);

  // Confirm permanent delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeProducts = useMemo(() => products.filter(p => !p.archivedAt), [products]);
  const activeProductIds = useMemo(() => new Set(activeProducts.map(p => p.id)), [activeProducts]);

  const activeCount = activeProducts.length;
  const archivedCount = products.filter(p => Boolean(p.archivedAt)).length;

  const activeStockMovements = useMemo(() => {
    return stockMovements.filter(m => activeProductIds.has(m.productId));
  }, [stockMovements, activeProductIds]);

  const displayedProducts = useMemo(() => {
    return products
      .filter(p => (viewScope === 'active' ? !p.archivedAt : Boolean(p.archivedAt)))
      .filter(p => {
        if (filterType !== 'ALL' && p.type !== filterType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (p.name || '').toLowerCase().includes(q);
          const matchType = (p.type || '').toLowerCase().includes(q);
          const matchVariant = variants.some(
            v =>
              v.productId === p.id &&
              ((v.color || '').toLowerCase().includes(q) ||
                (v.size || '').toLowerCase().includes(q))
          );
          if (!matchName && !matchType && !matchVariant) return false;
        }
        return true;
      });
  }, [products, variants, viewScope, filterType, searchQuery]);

  const apparelTypes = useMemo(() => {
    return Array.from(new Set(products.map(p => p.type).filter(Boolean)));
  }, [products]);

  const handleStartEditPrice = (product: any) => {
    setEditingPriceProductId(product.id);
    setNewPriceValue(product.costPrice ?? product.unitPrice ?? 50);
  };

  const handleSavePrice = (productId: string) => {
    if (newPriceValue > 0) {
      updateProduct(productId, { costPrice: newPriceValue, unitPrice: newPriceValue });
    }
    setEditingPriceProductId(null);
  };

  const handleSaveDirectQty = (variantId: string) => {
    setVariantStockExact(variantId, Math.max(0, editingVariantQty));
    setEditingVariantId(null);
  };

  const handleAddVariantToProduct = (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    if (!newVarColor.trim() || !newVarSize.trim()) return;
    addVariant({
      productId,
      color: newVarColor.trim(),
      size: newVarSize.trim().toUpperCase(),
      quantity: Math.max(0, newVarQty),
    });
    setAddingVariantProductId(null);
    setNewVarColor('');
    setNewVarSize('M');
    setNewVarQty(10);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Stock & Vêtements
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gestion des articles, prix d'achat fournisseur, variantes (tailles & couleurs), réassorts et archivage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStockMovementModalOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold py-2 px-3 rounded-lg shadow-xs transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Mouvement de stock</span>
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold py-2 px-3 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Nouveau vêtement</span>
          </button>
        </div>
      </div>

      {/* Tabs: Catalogue vs Historique des mouvements */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('catalog');
              setViewScope('active');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'catalog' && viewScope === 'active'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Articles Actifs ({activeCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('catalog');
              setViewScope('archived');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'catalog' && viewScope === 'archived'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archives ({archivedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Journal des mouvements ({activeStockMovements.length})
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-medium">Type :</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="ALL">Tous les types</option>
              {apparelTypes.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: CATALOGUE DES ARTICLES ET VARIANTES */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {displayedProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
              <Package className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
              <div>
                {viewScope === 'active'
                  ? 'Aucun vêtement actif enregistré dans votre stock.'
                  : 'Aucun vêtement archivé.'}
              </div>
              {viewScope === 'active' && (
                <button
                  onClick={() => setIsProductModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-amber-500 text-white dark:text-zinc-950 rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter mon premier vêtement
                </button>
              )}
            </div>
          ) : (
            displayedProducts.map(product => {
              const prodVariants = variants.filter(v => v.productId === product.id);
              const totalPieces = prodVariants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
              const stockValue = totalPieces * (Number(product.costPrice ?? product.unitPrice) || 0);

              // Group by color
              const colorGroups = new Map<string, typeof prodVariants>();
              prodVariants.forEach(v => {
                const colKey = v.color || 'Standard';
                const list = colorGroups.get(colKey) || [];
                list.push(v);
                colorGroups.set(colKey, list);
              });

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4"
                >
                  {/* Product Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[11px] font-mono text-zinc-400 font-semibold">
                          {product.id}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {product.type}
                        </span>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
                          {product.name}
                        </h3>
                      </div>
                      {product.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Actions */}
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Editable Cost Price */}
                      <div className="flex items-center gap-2">
                        {editingPriceProductId === product.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              value={newPriceValue}
                              onChange={e => setNewPriceValue(parseInt(e.target.value, 10) || 0)}
                              className="w-20 px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded font-mono font-bold"
                            />
                            <span className="text-xs text-zinc-500">DH</span>
                            <button
                              onClick={() => handleSavePrice(product.id)}
                              className="p-1 bg-zinc-900 dark:bg-amber-500 text-white dark:text-zinc-950 rounded hover:bg-zinc-800 cursor-pointer"
                              title="Sauvegarder nouveau prix d'achat"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-zinc-400">Prix d'achat :</span>
                            <span className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
                              {product.costPrice ?? product.unitPrice} DH
                            </span>
                            <button
                              onClick={() => handleStartEditPrice(product)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                              title="Modifier le prix d'achat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                          {totalPieces} pièce(s) · <span className="text-emerald-700 dark:text-emerald-400">{stockValue.toLocaleString('fr-FR')} DH</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Seuil alerte : ≤ {product.minimumStock}
                        </div>
                      </div>

                      {viewScope === 'active' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setAddingVariantProductId(
                                addingVariantProductId === product.id ? null : product.id
                              )
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-md transition cursor-pointer"
                            title="Ajouter une couleur ou taille à ce modèle"
                          >
                            + Variante
                          </button>
                          <button
                            onClick={() => archiveProduct(product.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                            title="Archiver cet article"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => restoreProduct(product.id)}
                            className="px-2.5 py-1 text-xs bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold rounded flex items-center gap-1 transition cursor-pointer"
                            title="Restaurer cet article"
                          >
                            <RotateCcw className="w-3 h-3" /> Restaurer
                          </button>
                          {confirmDeleteId === product.id ? (
                            <button
                              onClick={() => {
                                deleteProductPermanently(product.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1 text-xs bg-red-600 text-white font-semibold rounded cursor-pointer"
                            >
                              Confirmer suppression
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(product.id)}
                              className="px-2.5 py-1 text-xs bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-semibold rounded flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Supprimer définitivement
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Add Variant Inline Form */}
                  {addingVariantProductId === product.id && (
                    <form
                      onSubmit={e => handleAddVariantToProduct(e, product.id)}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg flex flex-wrap items-end gap-3"
                    >
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 block mb-1">
                          Couleur *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Noir, Beige, Kaki..."
                          value={newVarColor}
                          onChange={e => setNewVarColor(e.target.value)}
                          className="text-xs px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white w-40"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 block mb-1">
                          Taille *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: S, M, L, XL..."
                          value={newVarSize}
                          onChange={e => setNewVarSize(e.target.value.toUpperCase())}
                          className="text-xs px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white w-24 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 block mb-1">
                          Stock initial
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={newVarQty}
                          onChange={e => setNewVarQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="text-xs px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white w-24 font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-amber-500 text-white dark:text-zinc-950 rounded cursor-pointer"
                        >
                          Ajouter la variante
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingVariantProductId(null)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Colors & Sizes Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(colorGroups.entries()).map(([colorName, colorVariants]) => (
                      <div
                        key={colorName}
                        className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full border border-zinc-300 dark:border-zinc-600"
                              style={{ backgroundColor: colorVariants[0]?.colorHex || '#18181b' }}
                            />
                            <span>{colorName}</span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-normal">
                            {colorVariants.reduce((s, v) => s + (Number(v.quantity) || 0), 0)} pcs
                          </span>
                        </div>

                        {/* Sizes tiles */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                          {colorVariants.map(variant => {
                            const isZero = variant.quantity === 0;
                            const isLow = variant.quantity <= product.minimumStock && !isZero;
                            const isEditingThis = editingVariantId === variant.id;

                            return (
                              <div
                                key={variant.id}
                                className={`p-2 rounded border text-center transition flex flex-col justify-between ${
                                  isZero
                                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-300'
                                    : isLow
                                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                                }`}
                              >
                                <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 font-mono">
                                  {variant.size}
                                </span>

                                {isEditingThis ? (
                                  <div className="my-1 flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      value={editingVariantQty}
                                      onChange={e =>
                                        setEditingVariantQty(Math.max(0, parseInt(e.target.value, 10) || 0))
                                      }
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleSaveDirectQty(variant.id);
                                      }}
                                      className="w-12 text-center text-xs font-mono font-bold px-1 py-0.5 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveDirectQty(variant.id)}
                                      className="p-0.5 bg-emerald-600 text-white rounded cursor-pointer"
                                      title="Valider quantité"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVariantId(variant.id);
                                      setEditingVariantQty(variant.quantity);
                                    }}
                                    className="text-sm font-bold font-mono my-0.5 hover:underline cursor-pointer"
                                    title="Cliquer pour saisir la quantité exacte"
                                  >
                                    {variant.quantity}
                                  </button>
                                )}

                                {/* Quick -1 / +1 / +5 controls */}
                                <div className="flex items-center justify-center gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                                  <button
                                    type="button"
                                    disabled={variant.quantity <= 0}
                                    onClick={() =>
                                      adjustStock(variant.id, -1, 'STOCK_OUT', 'Retrait rapide -1')
                                    }
                                    className="px-1 py-0.5 text-[10px] font-mono font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
                                    title="Retirer 1 pièce"
                                  >
                                    -1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      adjustStock(variant.id, 1, 'STOCK_IN', 'Ajout rapide +1')
                                    }
                                    className="px-1 py-0.5 text-[10px] font-mono font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                                    title="Ajouter 1 pièce"
                                  >
                                    +1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      adjustStock(variant.id, 5, 'STOCK_IN', 'Réassort rapide +5')
                                    }
                                    className="px-1 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 cursor-pointer"
                                    title="Ajouter 5 pièces"
                                  >
                                    +5
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: HISTORIQUE DES MOUVEMENTS */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Variante</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4">Type de mouvement</th>
                  <th className="py-3 px-4">Motif / Justification</th>
                  <th className="py-3 px-4">Réf. Commande</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {activeStockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs">
                      Aucun mouvement de stock enregistré pour les articles actifs.
                    </td>
                  </tr>
                ) : (
                  activeStockMovements.map(mvt => {
                    const isPositive = mvt.quantity > 0;
                    const formattedDate = mvt.createdAt
                      ? new Date(mvt.createdAt).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '-';
                    return (
                      <tr key={mvt.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 font-mono">
                          {formattedDate}
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                          {mvt.productName}
                        </td>
                        <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                          {mvt.color} · Taille {mvt.size}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span
                            className={
                              isPositive
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-700 dark:text-red-400'
                            }
                          >
                            {isPositive ? `+${mvt.quantity}` : mvt.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                          {mvt.type === 'STOCK_IN' && 'Entrée stock'}
                          {mvt.type === 'STOCK_OUT' && 'Sortie manuelle'}
                          {mvt.type === 'ORDER' && 'Vente commande'}
                          {mvt.type === 'ORDER_CANCELLED' && 'Restauration annulation'}
                          {mvt.type === 'ADJUSTMENT' && 'Ajustement inventaire'}
                          {mvt.type === 'RETURN' && 'Retour'}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                          {mvt.reason || '-'}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                          {mvt.orderNumber || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
