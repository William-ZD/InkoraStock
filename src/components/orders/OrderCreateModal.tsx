import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  AlertCircle,
  Plus,
  Check,
  ShoppingBag,
  Palette,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrintPosition, PaymentMethod, OrderStatus } from '../../types';

export const OrderCreateModal: React.FC = () => {
  const {
    isOrderModalOpen,
    setIsOrderModalOpen,
    customers,
    products,
    variants,
    designs,
    createOrder,
    createCustomer,
    setIsDesignModalOpen,
    setEditingDesign,
    lastCreatedDesignId,
    setLastCreatedDesignId,
  } = useApp();

  // Active products & customers (non archived)
  const activeProducts = useMemo(() => products.filter(p => !p.archivedAt), [products]);
  const activeCustomers = useMemo(() => customers.filter(c => !c.archivedAt), [customers]);
  const activeDesigns = useMemo(() => designs.filter(d => !d.archivedAt), [designs]);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLocation, setNewCustLocation] = useState('Casablanca');
  const [newCustInstagram, setNewCustInstagram] = useState('');

  // Item selection
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [sellingPrice, setSellingPrice] = useState<number>(140);

  // Design configuration
  const [printPosition, setPrintPosition] = useState<PrintPosition>('FRONT');
  const [frontDesignId, setFrontDesignId] = useState<string>('');
  const [backDesignId, setBackDesignId] = useState<string>('');

  // Auto-select newly created design when DesignModal saves while OrderCreateModal is open
  useEffect(() => {
    if (isOrderModalOpen && lastCreatedDesignId) {
      if (printPosition === 'BACK') {
        setBackDesignId(lastCreatedDesignId);
      } else {
        setFrontDesignId(lastCreatedDesignId);
      }
      setLastCreatedDesignId(null);
    }
  }, [lastCreatedDesignId, isOrderModalOpen, printPosition, setLastCreatedDesignId]);

  // Payment section
  const [hasAdvance, setHasAdvance] = useState<boolean>(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESPECES');
  const [paymentNote, setPaymentNote] = useState<string>('Avance versée à la commande');

  // Order notes & production status
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('EN_ATTENTE');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Selected product & available colors/sizes
  const selectedProduct = useMemo(
    () => activeProducts.find(p => p.id === selectedProductId),
    [activeProducts, selectedProductId]
  );

  // Available variants for this product
  const productVariants = useMemo(
    () => variants.filter(v => v.productId === selectedProductId),
    [variants, selectedProductId]
  );

  // Unique colors for this product
  const availableColors = useMemo(() => {
    const map = new Map<string, { color: string; hex?: string }>();
    productVariants.forEach(v => {
      if (!map.has(v.color)) {
        map.set(v.color, { color: v.color, hex: v.colorHex });
      }
    });
    return Array.from(map.values());
  }, [productVariants]);

  // Available sizes for the selected color
  const availableSizes = useMemo(() => {
    if (!selectedColor) return [];
    return productVariants.filter(v => v.color === selectedColor);
  }, [productVariants, selectedColor]);

  // Selected specific variant (product + color + size)
  const currentVariant = useMemo(() => {
    return productVariants.find(
      v => v.color === selectedColor && v.size === selectedSize
    );
  }, [productVariants, selectedColor, selectedSize]);

  // Calculations
  const costPrice = selectedProduct?.costPrice || 0;
  const totalAmount = sellingPrice * quantity;
  const unitMargin = sellingPrice - costPrice;
  const availableStock = currentVariant ? currentVariant.quantity : 0;
  const isStockInsufficient = currentVariant ? quantity > availableStock : false;
  const isOutOfStock = currentVariant ? availableStock === 0 : false;

  const remainingAmount = hasAdvance
    ? Math.max(0, totalAmount - advanceAmount)
    : totalAmount;

  // Selected designs previews
  const frontDesign = activeDesigns.find(d => d.id === frontDesignId);
  const backDesign = activeDesigns.find(d => d.id === backDesignId);

  // Handle Quick Customer Creation
  const handleQuickCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      setErrorMessage('Le nom du client est requis.');
      return;
    }

    const created = createCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim() || 'Non renseigné',
      location: newCustLocation.trim() || 'Non précisé',
      instagramUsername: newCustInstagram.trim() || '',
    });

    setSelectedCustomerId(created.id);
    setIsQuickCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustInstagram('');
    setErrorMessage('');
  };

  // Submit Order
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedCustomerId) {
      setErrorMessage('Veuillez sélectionner un client.');
      return;
    }

    if (!selectedProductId) {
      setErrorMessage('Veuillez sélectionner un vêtement.');
      return;
    }

    if (!selectedColor || !selectedSize || !currentVariant) {
      setErrorMessage('Veuillez sélectionner la couleur et la taille.');
      return;
    }

    if (quantity <= 0) {
      setErrorMessage('La quantité doit être supérieure à 0.');
      return;
    }

    if (quantity > availableStock) {
      setErrorMessage(
        `Stock insuffisant. Seulement ${availableStock} unité(s) disponible(s) pour cette variante.`
      );
      return;
    }

    if (hasAdvance && advanceAmount > totalAmount) {
      setErrorMessage('Le montant de l’avance ne peut pas dépasser le montant total de la commande.');
      return;
    }

    const item = {
      productVariantId: currentVariant.id,
      productId: selectedProduct!.id,
      productName: selectedProduct!.name,
      size: selectedSize,
      color: selectedColor,
      quantity,
      costPrice, // Coût d'achat atelier
      unitPrice: sellingPrice, // Prix de vente convenu et saisi par l'administrateur
      totalPrice: totalAmount,
      printPosition,
      frontDesignId: frontDesignId || null,
      backDesignId: backDesignId || null,
    };

    const advancePaymentData = hasAdvance && advanceAmount > 0
      ? {
          amount: advanceAmount,
          paymentMethod,
          note: paymentNote,
        }
      : undefined;

    const result = createOrder(
      {
        customerId: selectedCustomerId,
        items: [item],
        status: orderStatus,
        notes: orderNotes.trim() || undefined,
      },
      advancePaymentData
    );

    if (!result.success) {
      setErrorMessage(result.error || 'Erreur lors de la création de la commande.');
      return;
    }

    // Reset and close
    resetForm();
    setIsOrderModalOpen(false);
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedProductId('');
    setSelectedColor('');
    setSelectedSize('');
    setQuantity(1);
    setSellingPrice(140);
    setPrintPosition('FRONT');
    setFrontDesignId('');
    setBackDesignId('');
    setHasAdvance(false);
    setAdvanceAmount(0);
    setPaymentMethod('ESPECES');
    setPaymentNote('Avance versée à la commande');
    setOrderStatus('EN_ATTENTE');
    setOrderNotes('');
    setErrorMessage('');
  };

  if (!isOrderModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              Nouvelle Commande
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Création rapide avec déduction de stock et calcul automatique du reste.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsOrderModalOpen(false);
            }}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* STEP 1: CLIENT SELECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                1. Client
              </label>
              <button
                type="button"
                onClick={() => setIsQuickCustomerOpen(!isQuickCustomerOpen)}
                className="text-xs text-zinc-700 hover:text-zinc-950 font-medium flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isQuickCustomerOpen ? 'Annuler' : '+ Nouveau client rapide'}
              </button>
            </div>

            {/* Quick Customer Sub-form */}
            {isQuickCustomerOpen ? (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-zinc-900">Nouveau Client</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-500 block mb-1">Nom complet *</label>
                    <input
                      type="text"
                      placeholder="Ex: Yassine Alami"
                      value={newCustName}
                      onChange={e => setNewCustName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-500 block mb-1">Téléphone</label>
                    <input
                      type="text"
                      placeholder="06 XX XX XX XX"
                      value={newCustPhone}
                      onChange={e => setNewCustPhone(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-500 block mb-1">Ville / Quartier</label>
                    <input
                      type="text"
                      placeholder="Casablanca, Rabat..."
                      value={newCustLocation}
                      onChange={e => setNewCustLocation(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-500 block mb-1">Instagram (@)</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={newCustInstagram}
                      onChange={e => setNewCustInstagram(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickCreateCustomer}
                  className="bg-zinc-900 text-white text-xs font-medium py-1.5 px-3 rounded hover:bg-zinc-800 cursor-pointer"
                >
                  Enregistrer & Sélectionner
                </button>
              </div>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                required
              >
                <option value="">-- Choisir un client existant --</option>
                {activeCustomers.map(cust => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} ({cust.phone} · {cust.location} {cust.instagramUsername ? `· ${cust.instagramUsername}` : ''})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* STEP 2: ARTICLE SELECTION & CUSTOM SELLING PRICE */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              2. Vêtement & Prix de Vente Client
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <select
                  value={selectedProductId}
                  onChange={e => {
                    const id = e.target.value;
                    setSelectedProductId(id);
                    setSelectedColor('');
                    setSelectedSize('');
                    const p = activeProducts.find(prod => prod.id === id);
                    if (p) {
                      setSellingPrice(p.unitPrice || Math.round((p.costPrice || 60) * 2.2));
                    }
                  }}
                  className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  required
                >
                  <option value="">-- Choisir le modèle --</option>
                  {activeProducts.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} (Achat : {prod.costPrice ?? 0} DH)
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct ? (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Prix de vente unitaire fixé (DH) *
                    </label>
                    <span className="text-[10px] text-zinc-400">Achat atelier : {costPrice} DH</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={sellingPrice}
                      onChange={e => setSellingPrice(Math.max(1, parseInt(e.target.value, 10) || 0))}
                      className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono font-bold"
                      placeholder="Prix convenu avec le client"
                      required
                    />
                    <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">DH</span>
                  </div>
                  <div className="text-[10px] flex items-center justify-between pt-0.5">
                    <span className="text-zinc-500">Marge brute unitaire :</span>
                    <strong className={`font-mono ${unitMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>
                      {unitMargin >= 0 ? `+${unitMargin}` : unitMargin} DH / pièce
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-400 italic flex items-center p-2">
                  Sélectionnez d'abord un article pour fixer son prix de vente.
                </div>
              )}
            </div>
          </div>

          {/* STEP 3 & 4: COULEUR, TAILLE & QUANTITÉ */}
          {selectedProductId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-50/70 border border-zinc-200 rounded-lg">
              {/* Couleur */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1.5">
                  Couleur disponible
                </label>
                <select
                  value={selectedColor}
                  onChange={e => {
                    setSelectedColor(e.target.value);
                    setSelectedSize('');
                  }}
                  className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded-md bg-white"
                  required
                >
                  <option value="">-- Choisir couleur --</option>
                  {availableColors.map(c => (
                    <option key={c.color} value={c.color}>
                      {c.color}
                    </option>
                  ))}
                </select>
              </div>

              {/* Taille */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1.5">
                  Taille
                </label>
                <select
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                  disabled={!selectedColor}
                  className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded-md bg-white disabled:opacity-50"
                  required
                >
                  <option value="">-- Choisir taille --</option>
                  {availableSizes.map(v => (
                    <option key={v.id} value={v.size} disabled={v.quantity === 0}>
                      {v.size} {v.quantity === 0 ? '(Rupture de stock)' : `(${v.quantity} dispo)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantité */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1.5">
                  Quantité souhaitée
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded-md bg-white font-mono"
                  required
                />
              </div>

              {/* Real-time stock status indicator */}
              {currentVariant && (
                <div className="md:col-span-3 pt-1 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Stock disponible :</span>
                    <strong
                      className={`font-mono font-semibold ${
                        isOutOfStock
                          ? 'text-red-600'
                          : isStockInsufficient
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {availableStock} pièce(s)
                    </strong>
                  </div>

                  {isStockInsufficient && (
                    <span className="text-red-600 font-medium text-[11px]">
                      Stock insuffisant. Maximum commandable : {availableStock}.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: DESIGN & POSITION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                3. Design & Position
              </label>
              <button
                type="button"
                onClick={() => {
                  setEditingDesign(null);
                  setIsDesignModalOpen(true);
                }}
                className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium flex items-center gap-1 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" />
                + Ajouter nouveau design
              </button>
            </div>

            {/* Position Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'FRONT', label: 'Avant uniquement (Front)' },
                { id: 'BACK', label: 'Arrière uniquement (Back)' },
                { id: 'FRONT_BACK', label: 'Avant + Arrière (Front & Back)' },
              ].map(pos => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setPrintPosition(pos.id as PrintPosition)}
                  className={`text-xs py-2 px-3 border rounded-lg font-medium transition cursor-pointer text-center ${
                    printPosition === pos.id
                      ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>

            {/* Front & Back Design Dropdowns & Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {(printPosition === 'FRONT' || printPosition === 'FRONT_BACK') && (
                <div className="p-3 border border-zinc-200 rounded-lg bg-white space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-700 block">
                    Design Avant (Front)
                  </label>
                  <select
                    value={frontDesignId}
                    onChange={e => setFrontDesignId(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
                  >
                    <option value="">-- Sans design ou À définir --</option>
                    {activeDesigns.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type === 'CUSTOM' ? 'Design personnalisé' : 'Image'})
                      </option>
                    ))}
                  </select>

                  {/* Preview miniature */}
                  {frontDesign && (
                    <div className="flex items-center gap-3 pt-2 text-xs text-zinc-600">
                      {frontDesign.fileUrl ? (
                        <img
                          src={frontDesign.fileUrl}
                          alt={frontDesign.name}
                          className="w-12 h-12 object-cover rounded border border-zinc-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold text-center p-1">
                          Sur mesure
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-zinc-900">{frontDesign.name}</div>
                        <div className="text-[11px] text-zinc-400">Position : Poitrine / Avant</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(printPosition === 'BACK' || printPosition === 'FRONT_BACK') && (
                <div className="p-3 border border-zinc-200 rounded-lg bg-white space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-700 block">
                    Design Arrière (Back)
                  </label>
                  <select
                    value={backDesignId}
                    onChange={e => setBackDesignId(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
                  >
                    <option value="">-- Sans design ou À définir --</option>
                    {activeDesigns.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type === 'CUSTOM' ? 'Design personnalisé' : 'Image'})
                      </option>
                    ))}
                  </select>

                  {/* Preview miniature */}
                  {backDesign && (
                    <div className="flex items-center gap-3 pt-2 text-xs text-zinc-600">
                      {backDesign.fileUrl ? (
                        <img
                          src={backDesign.fileUrl}
                          alt={backDesign.name}
                          className="w-12 h-12 object-cover rounded border border-zinc-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold text-center p-1">
                          Sur mesure
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-zinc-900">{backDesign.name}</div>
                        <div className="text-[11px] text-zinc-400">Position : Grand dos / Arrière</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* STEP 6 & 7: FINANCES & PAIEMENT AVANCE */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  4. Total & Règlement
                </span>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Calcul automatique : {sellingPrice} DH × {quantity} pièce(s)
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-zinc-900">
                  {totalAmount} DH
                </div>
              </div>
            </div>

            {/* Advance payment question */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-800">
                  Le client a-t-il versé une avance ?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasAdvance(false);
                      setAdvanceAmount(0);
                    }}
                    className={`px-3 py-1 text-xs rounded font-medium transition cursor-pointer ${
                      !hasAdvance
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white border border-zinc-300 text-zinc-700'
                    }`}
                  >
                    Non
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasAdvance(true);
                      setAdvanceAmount(Math.round(totalAmount * 0.5)); // Suggest 50%
                    }}
                    className={`px-3 py-1 text-xs rounded font-medium transition cursor-pointer ${
                      hasAdvance
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white border border-zinc-300 text-zinc-700'
                    }`}
                  >
                    Oui
                  </button>
                </div>
              </div>

              {hasAdvance && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                      Montant de l'avance (DH) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={totalAmount}
                      value={advanceAmount}
                      onChange={e => setAdvanceAmount(Math.min(totalAmount, parseInt(e.target.value, 10) || 0))}
                      className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white font-mono font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                      Mode de paiement
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
                    >
                      <option value="ESPECES">Espèces (Cash atelier)</option>
                      <option value="VIREMENT">Virement bancaire</option>
                      <option value="CARTE">Carte bancaire (TPE)</option>
                      <option value="AUTRE">Autre moyen</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Reste à payer & Statut automatique */}
              <div className="pt-2 flex items-center justify-between text-xs font-medium">
                <span className="text-zinc-600">Reste à payer calculé :</span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  {remainingAmount} DH
                </span>
              </div>
            </div>
          </div>

          {/* STEP 8: NOTES & PRODUCTION STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Statut initial de production
              </label>
              <select
                value={orderStatus}
                onChange={e => setOrderStatus(e.target.value as OrderStatus)}
                className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white"
              >
                <option value="EN_ATTENTE">En attente (Nouvelle)</option>
                <option value="EN_PRODUCTION">En production (Atelier)</option>
                <option value="PRETE">Prête pour livraison</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Instructions ou notes particulières
              </label>
              <input
                type="text"
                placeholder="Ex: Pop-up store, finition broderie..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsOrderModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isStockInsufficient || isOutOfStock || !selectedProductId || !selectedColor || !selectedSize}
              className="px-5 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Créer la commande ({totalAmount} DH)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
