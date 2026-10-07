import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Customer,
  Product,
  ProductVariant,
  StockMovement,
  Design,
  Order,
  OrderItem,
  Payment,
  OrderStatus,
  PaymentStatus,
  StockMovementType,
  DashboardStats,
  Expense,
  AccountingStats,
  PaymentMethod,
} from '../types';
import { AppData, CollectionKey, SyncStatus, useCloudSync } from '../lib/cloudStore';

const STORAGE_KEY = 'atelier_custom_data_v2';

// Helper to detect legacy hardcoded demo seed records (from 2025-01 / 2025-02)
const isLegacyDemoSeed = (item: any): boolean => {
  if (!item || typeof item !== 'object') return true;
  const created = String(item.createdAt || '');
  const date = String(item.date || '');
  if (created.startsWith('2025-01') || created.startsWith('2025-02')) return true;
  if (date.startsWith('2025-01') || date.startsWith('2025-02')) return true;
  return false;
};

// Safe localStorage writer that never crashes React if quota is reached
const safeSaveToStorage = (key: string, data: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn(`LocalStorage quota warning for ${key}:`, err);
    return false;
  }
};

const LOCAL_SUFFIX: Record<CollectionKey, string> = {
  products: 'products',
  variants: 'variants',
  customers: 'customers',
  designs: 'designs',
  orders: 'orders',
  payments: 'payments',
  stockMovements: 'stock_movements',
  expenses: 'expenses',
};

const readLocalArray = (suffix: string): any[] => {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${suffix}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.filter(item => !isLegacyDemoSeed(item));
    }
  } catch {
    // ignore unreadable storage
  }
  return [];
};

// Lit les données enregistrées dans ce navigateur (mode local, ou import vers le compte en ligne)
export const loadLocalData = (): AppData => ({
  products: readLocalArray(LOCAL_SUFFIX.products).map(p => ({
    ...p,
    costPrice: Number(p.costPrice ?? p.unitPrice ?? 50),
    unitPrice: Number(p.unitPrice ?? p.costPrice ?? 50),
    minimumStock: Number(p.minimumStock ?? 3),
  })),
  variants: readLocalArray(LOCAL_SUFFIX.variants).map(v => ({
    ...v,
    quantity: Math.max(0, Number(v.quantity) || 0),
  })),
  customers: readLocalArray(LOCAL_SUFFIX.customers),
  designs: readLocalArray(LOCAL_SUFFIX.designs).map(d => ({
    ...d,
    // Avoid duplicate base64 strings in both fileUrl and thumbnailUrl
    thumbnailUrl: d.thumbnailUrl === d.fileUrl ? undefined : d.thumbnailUrl,
  })),
  orders: readLocalArray(LOCAL_SUFFIX.orders),
  payments: readLocalArray(LOCAL_SUFFIX.payments),
  stockMovements: readLocalArray(LOCAL_SUFFIX.stockMovements),
  expenses: readLocalArray(LOCAL_SUFFIX.expenses),
});

export const clearLocalData = (): void => {
  Object.values(LOCAL_SUFFIX).forEach(suffix => {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${suffix}`);
    } catch {
      // ignore
    }
  });
};

export interface CloudSession {
  userId: string;
  email: string;
  initialData: AppData; // données affichées au démarrage
  syncedData: AppData; // données déjà présentes dans la base
  signOut: () => void;
}

interface AppContextType {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Compte en ligne
  syncStatus: SyncStatus;
  accountEmail: string | null;
  signOut: () => void;

  // Data
  products: Product[];
  variants: ProductVariant[];
  customers: Customer[];
  designs: Design[];
  orders: Order[];
  payments: Payment[];
  stockMovements: StockMovement[];
  expenses: Expense[];

  // Stats
  dashboardStats: DashboardStats;
  accountingStats: AccountingStats;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Active view tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Selected item modals/views
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;

  // Modal triggers
  isOrderModalOpen: boolean;
  setIsOrderModalOpen: (open: boolean) => void;
  isCustomerModalOpen: boolean;
  setIsCustomerModalOpen: (open: boolean) => void;
  isProductModalOpen: boolean;
  setIsProductModalOpen: (open: boolean) => void;
  isStockMovementModalOpen: boolean;
  setIsStockMovementModalOpen: (open: boolean) => void;
  isDesignModalOpen: boolean;
  setIsDesignModalOpen: (open: boolean) => void;
  editingDesign: Design | null;
  setEditingDesign: (design: Design | null) => void;
  lastCreatedDesignId: string | null;
  setLastCreatedDesignId: (id: string | null) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  isExpenseModalOpen: boolean;
  setIsExpenseModalOpen: (open: boolean) => void;
  targetOrderForPayment: Order | null;
  setTargetOrderForPayment: (order: Order | null) => void;

  // Delivery check modal after full payment
  deliveryPromptOrder: Order | null;
  setDeliveryPromptOrder: (order: Order | null) => void;

  // Order cancellation modal
  cancellingOrder: Order | null;
  setCancellingOrder: (order: Order | null) => void;

  // Toast feedback
  toast: {
    message: string;
    type?: 'info' | 'success' | 'warn';
    undoAction?: () => void;
    undoLabel?: string;
  } | null;
  showToast: (
    message: string,
    type?: 'info' | 'success' | 'warn',
    undoAction?: () => void,
    undoLabel?: string
  ) => void;
  hideToast: () => void;

  // Product Actions
  createProduct: (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    initialVariants: { size: string; color: string; colorHex?: string; quantity: number }[]
  ) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  archiveProduct: (id: string) => void;
  restoreProduct: (id: string) => void;
  deleteProductPermanently: (id: string) => void;

  // Variant & Stock Actions
  addVariant: (variant: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteVariant: (variantId: string) => void;
  adjustStock: (
    variantId: string,
    quantityDelta: number,
    type: StockMovementType,
    reason?: string,
    orderId?: string,
    orderNumber?: string
  ) => boolean;
  setVariantStockExact: (variantId: string, newQuantity: number, reason?: string) => boolean;

  // Customer Actions
  createCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  archiveCustomer: (id: string) => void;
  restoreCustomer: (id: string) => void;
  deleteCustomerPermanently: (id: string) => void;

  // Design Actions
  createDesign: (designData: Omit<Design, 'id' | 'createdAt' | 'updatedAt'>) => Design;
  updateDesign: (id: string, updates: Partial<Design>) => void;
  archiveDesign: (id: string) => void;
  restoreDesign: (id: string) => void;
  deleteDesignPermanently: (id: string) => void;

  // Order Actions
  createOrder: (
    orderData: {
      customerId: string;
      items: Omit<OrderItem, 'id' | 'orderId'>[];
      status?: OrderStatus;
      notes?: string;
    },
    advancePayment?: {
      amount: number;
      paymentMethod: Payment['paymentMethod'];
      note?: string;
    }
  ) => { success: boolean; error?: string; order?: Order };
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  markOrderAsPaid: (orderId: string, paymentMethod?: PaymentMethod) => void;
  archiveOrder: (id: string) => void;
  restoreOrder: (id: string) => void;
  deleteOrderPermanently: (id: string) => void;

  // Payment Actions
  addPayment: (data: {
    orderId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    note?: string;
    date?: string;
  }) => { success: boolean; error?: string };
  deletePaymentPermanently: (id: string) => void;

  // Expenses Actions
  createExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  archiveExpense: (id: string) => void;
  restoreExpense: (id: string) => void;
  deleteExpensePermanently: (id: string) => void;

  // Bulk Archive Purge & System
  purgeAllArchived: () => void;
  resetToSampleData: () => void;
  exportDataJson: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode; cloud?: CloudSession }> = ({ children, cloud }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('atelier_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('atelier_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Données de départ : celles du compte en ligne (mode Supabase) ou celles du navigateur (mode local)
  const [initialData] = useState<AppData>(() => cloud?.initialData ?? loadLocalData());

  const [products, setProducts] = useState<Product[]>(initialData.products);
  const [variants, setVariants] = useState<ProductVariant[]>(initialData.variants);
  const [customers, setCustomers] = useState<Customer[]>(initialData.customers);
  const [designs, setDesigns] = useState<Design[]>(initialData.designs);
  const [orders, setOrders] = useState<Order[]>(initialData.orders);
  const [payments, setPayments] = useState<Payment[]>(initialData.payments);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialData.stockMovements);
  const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses);

  // One-time relational integrity cleanup on mount (removes orphan variants/payments/movements)
  useEffect(() => {
    const productIds = new Set(products.map(p => p.id));
    const orderIds = new Set(orders.map(o => o.id));

    setVariants(prev => {
      const cleaned = prev.filter(v => productIds.has(v.productId));
      return cleaned.length !== prev.length ? cleaned : prev;
    });

    setPayments(prev => {
      const cleaned = prev.filter(p => orderIds.has(p.orderId));
      return cleaned.length !== prev.length ? cleaned : prev;
    });

    setStockMovements(prev => {
      const cleaned = prev.filter(
        m => productIds.has(m.productId) && (!m.orderId || orderIds.has(m.orderId))
      );
      return cleaned.length !== prev.length ? cleaned : prev;
    });
  }, []);

  // UI state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockMovementModalOpen, setIsStockMovementModalOpen] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [lastCreatedDesignId, setLastCreatedDesignId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [targetOrderForPayment, setTargetOrderForPayment] = useState<Order | null>(null);

  // Delivery check modal after payment completion
  const [deliveryPromptOrder, setDeliveryPromptOrder] = useState<Order | null>(null);

  // Order cancellation modal
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{
    message: string;
    type?: 'info' | 'success' | 'warn';
    undoAction?: () => void;
    undoLabel?: string;
  } | null>(null);

  const showToast = (
    message: string,
    type: 'info' | 'success' | 'warn' = 'success',
    undoAction?: () => void,
    undoLabel?: string
  ) => {
    setToast({ message, type, undoAction, undoLabel });
    setTimeout(() => {
      setToast(current => (current?.message === message ? null : current));
    }, 4500);
  };

  const hideToast = () => setToast(null);

  // Persistance : Supabase quand un compte est connecté, sinon localStorage
  const isCloud = Boolean(cloud);

  const syncStatus = useCloudSync(
    cloud?.userId ?? null,
    { products, variants, customers, designs, orders, payments, stockMovements, expenses },
    cloud?.syncedData ?? null
  );

  useEffect(() => {
    if (isCloud) return;
    safeSaveToStorage(`${STORAGE_KEY}_products`, products);
  }, [products]);

  useEffect(() => {
    if (isCloud) return;
    safeSaveToStorage(`${STORAGE_KEY}_variants`, variants);
  }, [variants]);

  useEffect(() => {
    if (isCloud) return;
    safeSaveToStorage(`${STORAGE_KEY}_customers`, customers);
  }, [customers]);

  useEffect(() => {
    if (isCloud) return;
    const savedOk = safeSaveToStorage(`${STORAGE_KEY}_designs`, designs);
    if (!savedOk) {
      // Fallback: strip redundant thumbnailUrl if storage quota is tight
      const compactDesigns = designs.map(d => ({ ...d, thumbnailUrl: undefined }));
      safeSaveToStorage(`${STORAGE_KEY}_designs`, compactDesigns);
    }
  }, [designs]);

  useEffect(() => {
    if (isCloud) return;
    safeSaveToStorage(`${STORAGE_KEY}_orders`, orders);
  }, [orders]);

  useEffect(() => {
    if (isCloud) return;
    safeSaveToStorage(`${STORAGE_KEY}_payments`, payments);
  }, [payments]);

  useEffect(() => {
    if (isCloud) return;
    safeSaveToStorage(`${STORAGE_KEY}_stock_movements`, stockMovements);
  }, [stockMovements]);

  useEffect(() => {
    if (isCloud) return;
    safeSaveToStorage(`${STORAGE_KEY}_expenses`, expenses);
  }, [expenses]);

  // ID Generators
  const generateCustomerId = (): string => {
    const existingNums = customers
      .map(c => parseInt(String(c.id).replace('CLI-', ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `CLI-${String(nextNum).padStart(4, '0')}`;
  };

  const generateProductId = (): string => {
    const existingNums = products
      .map(p => parseInt(String(p.id).replace('PRD-', ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `PRD-${String(nextNum).padStart(4, '0')}`;
  };

  const generateDesignId = (): string => {
    const existingNums = designs
      .map(d => parseInt(String(d.id).replace('DSG-', ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `DSG-${String(nextNum).padStart(4, '0')}`;
  };

  const generateOrderNumber = (): string => {
    const existingNums = orders
      .map(o => parseInt(String(o.orderNumber).replace('CMD-', ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `CMD-${String(nextNum).padStart(4, '0')}`;
  };

  const generatePaymentId = (): string => {
    const existingNums = payments
      .map(p => parseInt(String(p.id).replace('PAY-', ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `PAY-${String(nextNum).padStart(4, '0')}`;
  };

  const generateMovementId = (): string => {
    const existingNums = stockMovements
      .map(m => parseInt(String(m.id).replace('MVT-', ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `MVT-${String(nextNum).padStart(4, '0')}`;
  };

  const generateExpenseId = (): string => {
    const existingNums = expenses
      .map(e => parseInt(String(e.id).replace('CHG-', ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `CHG-${String(nextNum).padStart(4, '0')}`;
  };

  // ----------------------------------------------------
  // Stock Adjustments
  // ----------------------------------------------------
  const adjustStock = (
    variantId: string,
    quantityDelta: number,
    type: StockMovementType,
    reason?: string,
    orderId?: string,
    orderNumber?: string
  ): boolean => {
    if (quantityDelta === 0) return true;
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return false;

    const product = products.find(p => p.id === variant.productId);
    const newQuantity = variant.quantity + quantityDelta;

    if (newQuantity < 0) {
      return false; // Cannot have negative stock
    }

    setVariants(prev =>
      prev.map(v =>
        v.id === variantId
          ? { ...v, quantity: newQuantity, updatedAt: new Date().toISOString() }
          : v
      )
    );

    const movement: StockMovement = {
      id: `${generateMovementId()}-${Date.now().toString().slice(-3)}`,
      productVariantId: variant.id,
      productId: variant.productId,
      productName: product?.name || 'Vêtement',
      size: variant.size,
      color: variant.color,
      quantity: quantityDelta,
      type,
      orderId: orderId || null,
      orderNumber: orderNumber || null,
      reason: reason || (quantityDelta > 0 ? 'Entrée de stock' : 'Sortie de stock'),
      createdAt: new Date().toISOString(),
    };

    setStockMovements(prev => [movement, ...prev]);
    return true;
  };

  const setVariantStockExact = (
    variantId: string,
    newQuantity: number,
    reason?: string
  ): boolean => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return false;
    const targetQty = Math.max(0, Math.round(newQuantity));
    const delta = targetQty - variant.quantity;
    if (delta === 0) return true;
    return adjustStock(
      variantId,
      delta,
      'ADJUSTMENT',
      reason || `Ajustement direct du stock (${variant.quantity} → ${targetQty})`
    );
  };

  // ----------------------------------------------------
  // Products & Variants (with costPrice / Prix d'achat)
  // ----------------------------------------------------
  const createProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    initialVariants: { size: string; color: string; colorHex?: string; quantity: number }[]
  ) => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      costPrice: Number(productData.costPrice) || 0,
      unitPrice: Number(productData.unitPrice ?? productData.costPrice) || 0,
      minimumStock: Number(productData.minimumStock ?? 3),
      id: generateProductId(),
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };

    const newVariants: ProductVariant[] = initialVariants.map((iv, idx) => ({
      id: `VAR-${Date.now().toString().slice(-5)}-${idx}`,
      productId: newProduct.id,
      size: iv.size,
      color: iv.color,
      colorHex: iv.colorHex || '#18181b',
      quantity: Math.max(0, Number(iv.quantity) || 0),
      createdAt: now,
      updatedAt: now,
    }));

    setProducts(prev => [newProduct, ...prev]);
    setVariants(prev => [...prev, ...newVariants]);

    const initialMovements: StockMovement[] = newVariants
      .filter(v => v.quantity > 0)
      .map((v, idx) => ({
        id: `MVT-${Date.now().toString().slice(-4)}-${idx}`,
        productVariantId: v.id,
        productId: newProduct.id,
        productName: newProduct.name,
        size: v.size,
        color: v.color,
        quantity: v.quantity,
        type: 'STOCK_IN',
        reason: 'Stock initial à la création du produit',
        createdAt: now,
      }));

    if (initialMovements.length > 0) {
      setStockMovements(prev => [...initialMovements, ...prev]);
    }

    showToast(`Article "${newProduct.name}" ajouté au stock avec succès !`, 'success');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    );
    showToast('Article mis à jour.', 'success');
  };

  const archiveProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    const now = new Date().toISOString();
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, archivedAt: now, updatedAt: now } : p))
    );
    showToast(
      `Article "${target?.name || id}" archivé (exclu des statistiques).`,
      'info',
      () => restoreProduct(id),
      'Annuler'
    );
  };

  const restoreProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    const now = new Date().toISOString();
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, archivedAt: null, updatedAt: now } : p))
    );
    showToast(`Article "${target?.name || id}" restauré avec succès !`, 'success');
  };

  const deleteProductPermanently = (id: string) => {
    const target = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setVariants(prev => prev.filter(v => v.productId !== id));
    setStockMovements(prev => prev.filter(m => m.productId !== id));
    showToast(`Article "${target?.name || id}" supprimé définitivement.`, 'warn');
  };

  const addVariant = (variantData: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    // Check if variant with same productId + color + size already exists
    const existing = variants.find(
      v =>
        v.productId === variantData.productId &&
        v.color.toLowerCase() === variantData.color.toLowerCase() &&
        v.size.toLowerCase() === variantData.size.toLowerCase()
    );

    if (existing) {
      if (variantData.quantity > 0) {
        adjustStock(existing.id, variantData.quantity, 'STOCK_IN', 'Ajout sur variante existante');
      }
      showToast(`Stock ajouté à la variante ${existing.color} · ${existing.size}.`, 'success');
      return;
    }

    const newVariant: ProductVariant = {
      ...variantData,
      id: `VAR-${Date.now().toString().slice(-6)}`,
      createdAt: now,
      updatedAt: now,
    };

    setVariants(prev => [...prev, newVariant]);

    if (newVariant.quantity > 0) {
      const product = products.find(p => p.id === newVariant.productId);
      const movement: StockMovement = {
        id: `${generateMovementId()}-${Date.now().toString().slice(-3)}`,
        productVariantId: newVariant.id,
        productId: newVariant.productId,
        productName: product?.name || 'Vêtement',
        size: newVariant.size,
        color: newVariant.color,
        quantity: newVariant.quantity,
        type: 'STOCK_IN',
        reason: 'Création de variante avec stock initial',
        createdAt: now,
      };
      setStockMovements(prev => [movement, ...prev]);
    }
    showToast(`Nouvelle variante (${newVariant.color} · ${newVariant.size}) ajoutée !`, 'success');
  };

  const deleteVariant = (variantId: string) => {
    setVariants(prev => prev.filter(v => v.id !== variantId));
    setStockMovements(prev => prev.filter(m => m.productVariantId !== variantId));
    showToast('Variante supprimée.', 'info');
  };

  // ----------------------------------------------------
  // Customers
  // ----------------------------------------------------
  const createCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: generateCustomerId(),
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };

    setCustomers(prev => [newCustomer, ...prev]);
    showToast(`Client "${newCustomer.name}" enregistré !`, 'success');
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      )
    );
    showToast('Fiche client mise à jour.', 'success');
  };

  const archiveCustomer = (id: string) => {
    const target = customers.find(c => c.id === id);
    const now = new Date().toISOString();
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, archivedAt: now, updatedAt: now } : c))
    );
    showToast(
      `Client "${target?.name || id}" archivé.`,
      'info',
      () => restoreCustomer(id),
      'Annuler'
    );
  };

  const restoreCustomer = (id: string) => {
    const target = customers.find(c => c.id === id);
    const now = new Date().toISOString();
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, archivedAt: null, updatedAt: now } : c))
    );
    showToast(`Client "${target?.name || id}" restauré avec succès !`, 'success');
  };

  const deleteCustomerPermanently = (id: string) => {
    const target = customers.find(c => c.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (selectedCustomerId === id) {
      setSelectedCustomerId(null);
    }
    showToast(`Client "${target?.name || id}" supprimé définitivement.`, 'warn');
  };

  // ----------------------------------------------------
  // Designs
  // ----------------------------------------------------
  const createDesign = (designData: Omit<Design, 'id' | 'createdAt' | 'updatedAt'>): Design => {
    const now = new Date().toISOString();
    const customer = customers.find(c => c.id === designData.customerId);
    const newId = `${generateDesignId()}`;
    const newDesign: Design = {
      ...designData,
      customerId: designData.customerId || null,
      customerName: customer ? customer.name : designData.customerName || null,
      fileUrl: designData.fileUrl || '',
      // Do not duplicate large base64 data into thumbnailUrl
      thumbnailUrl: undefined,
      id: newId,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };

    setDesigns(prev => [newDesign, ...prev]);
    setLastCreatedDesignId(newDesign.id);
    showToast(`Design "${newDesign.name}" enregistré avec succès !`, 'success');
    return newDesign;
  };

  const updateDesign = (id: string, updates: Partial<Design>) => {
    const now = new Date().toISOString();
    setDesigns(prev =>
      prev.map(d => {
        if (d.id !== id) return d;
        const resolvedCustomerId =
          updates.customerId !== undefined ? updates.customerId : d.customerId;
        const customer = customers.find(c => c.id === resolvedCustomerId);
        return {
          ...d,
          ...updates,
          customerId: resolvedCustomerId || null,
          customerName: customer ? customer.name : null,
          thumbnailUrl: undefined,
          updatedAt: now,
        };
      })
    );
    showToast('Design mis à jour avec succès !', 'success');
  };

  const archiveDesign = (id: string) => {
    const target = designs.find(d => d.id === id);
    const now = new Date().toISOString();
    setDesigns(prev =>
      prev.map(d => (d.id === id ? { ...d, archivedAt: now, updatedAt: now } : d))
    );
    showToast(
      `Design "${target?.name || id}" archivé.`,
      'info',
      () => restoreDesign(id),
      'Annuler'
    );
  };

  const restoreDesign = (id: string) => {
    const target = designs.find(d => d.id === id);
    const now = new Date().toISOString();
    setDesigns(prev =>
      prev.map(d => (d.id === id ? { ...d, archivedAt: null, updatedAt: now } : d))
    );
    showToast(`Design "${target?.name || id}" restauré avec succès !`, 'success');
  };

  const deleteDesignPermanently = (id: string) => {
    const target = designs.find(d => d.id === id);
    setDesigns(prev => prev.filter(d => d.id !== id));
    // Clean references in orders if any
    setOrders(prev =>
      prev.map(o => ({
        ...o,
        items: o.items.map(it => ({
          ...it,
          frontDesignId: it.frontDesignId === id ? null : it.frontDesignId,
          backDesignId: it.backDesignId === id ? null : it.backDesignId,
        })),
      }))
    );
    showToast(`Design "${target?.name || id}" supprimé définitivement.`, 'warn');
  };

  // ----------------------------------------------------
  // Orders & Stock Deductions
  // ----------------------------------------------------
  const createOrder = (
    orderData: {
      customerId: string;
      items: Omit<OrderItem, 'id' | 'orderId'>[];
      status?: OrderStatus;
      notes?: string;
    },
    advancePayment?: {
      amount: number;
      paymentMethod: Payment['paymentMethod'];
      note?: string;
    }
  ): { success: boolean; error?: string; order?: Order } => {
    const customer = customers.find(c => c.id === orderData.customerId);
    if (!customer) {
      return { success: false, error: 'Client introuvable.' };
    }

    if (!orderData.items || orderData.items.length === 0) {
      return { success: false, error: 'La commande doit contenir au moins un article.' };
    }

    // Check stock for all items
    for (const item of orderData.items) {
      const variant = variants.find(v => v.id === item.productVariantId);
      if (!variant) {
        return { success: false, error: `Variante introuvable pour ${item.productName}` };
      }
      if (item.quantity <= 0) {
        return { success: false, error: `Quantité invalide (${item.quantity}) pour ${item.productName}` };
      }
      if (variant.quantity < item.quantity) {
        return {
          success: false,
          error: `Stock insuffisant pour ${item.productName} (${variant.color} - ${variant.size}). Seulement ${variant.quantity} disponible(s).`,
        };
      }
    }

    const orderNumber = generateOrderNumber();
    const orderId = orderNumber;
    const now = new Date().toISOString();

    const computedItems: OrderItem[] = orderData.items.map((item, idx) => {
      const prod = products.find(p => p.id === item.productId);
      const costPrice = item.costPrice ?? (prod ? (prod.costPrice ?? 50) : 50);
      return {
        ...item,
        id: `ITEM-${Date.now().toString().slice(-4)}${idx}`,
        orderId,
        costPrice,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
      };
    });

    const totalAmount = computedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const advance = advancePayment?.amount ? Math.min(advancePayment.amount, totalAmount) : 0;
    const remainingAmount = Math.max(0, totalAmount - advance);

    let paymentStatus: PaymentStatus = 'NON_PAYE';
    if (advance >= totalAmount && totalAmount > 0) {
      paymentStatus = 'PAYE';
    } else if (advance > 0) {
      paymentStatus = 'PARTIELLEMENT_PAYE';
    }

    // Deduct stock for each item & create stock movement records
    const newStockMovements: StockMovement[] = [];
    const updatedVariantsMap = new Map<string, number>();

    for (const item of computedItems) {
      const currentQty =
        updatedVariantsMap.get(item.productVariantId) ??
        (variants.find(v => v.id === item.productVariantId)?.quantity || 0);

      updatedVariantsMap.set(item.productVariantId, currentQty - item.quantity);

      newStockMovements.push({
        id: `${generateMovementId()}-${item.id}`,
        productVariantId: item.productVariantId,
        productId: item.productId,
        productName: item.productName,
        size: item.size,
        color: item.color,
        quantity: -item.quantity,
        type: 'ORDER',
        orderId,
        orderNumber,
        reason: `Commande ${orderNumber} (${customer.name})`,
        createdAt: now,
      });
    }

    // Apply updated variant stock
    setVariants(prev =>
      prev.map(v => {
        if (updatedVariantsMap.has(v.id)) {
          return {
            ...v,
            quantity: Math.max(0, updatedVariantsMap.get(v.id)!),
            updatedAt: now,
          };
        }
        return v;
      })
    );

    setStockMovements(prev => [...newStockMovements, ...prev]);

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerLocation: customer.location,
      customerInstagram: customer.instagramUsername,
      items: computedItems,
      status: orderData.status || 'EN_ATTENTE',
      totalAmount,
      paidAmount: advance,
      remainingAmount,
      paymentStatus,
      notes: orderData.notes,
      stockDeductedAt: now,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };

    setOrders(prev => [newOrder, ...prev]);

    // Record advance payment if present
    if (advance > 0 && advancePayment) {
      const paymentRecord: Payment = {
        id: generatePaymentId(),
        orderId,
        orderNumber,
        customerId: customer.id,
        customerName: customer.name,
        amount: advance,
        paymentMethod: advancePayment.paymentMethod,
        date: new Date().toISOString().split('T')[0],
        note: advancePayment.note || 'Avance versée à la commande',
        createdAt: now,
      };
      setPayments(prev => [paymentRecord, ...prev]);
    }

    showToast(`Commande ${orderNumber} créée avec succès !`, 'success');

    // If fully paid at creation, check delivery status!
    if (paymentStatus === 'PAYE') {
      setTimeout(() => {
        setDeliveryPromptOrder(newOrder);
      }, 300);
    }

    return { success: true, order: newOrder };
  };

  // ----------------------------------------------------
  // Dedicated Cancel Order (Restores Stock Automatically)
  // ----------------------------------------------------
  const cancelOrder = (orderId: string, reason?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.status === 'ANNULEE') return;

    const now = new Date().toISOString();

    // If stock was consumed, restore it!
    if (order.stockDeductedAt) {
      const restorationMovements: StockMovement[] = [];
      const updatedVariantsMap = new Map<string, number>();

      for (const item of order.items) {
        const currentQty =
          updatedVariantsMap.get(item.productVariantId) ??
          (variants.find(v => v.id === item.productVariantId)?.quantity || 0);

        updatedVariantsMap.set(item.productVariantId, currentQty + item.quantity);

        restorationMovements.push({
          id: `${generateMovementId()}-rest-${item.id}`,
          productVariantId: item.productVariantId,
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          type: 'ORDER_CANCELLED',
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason: reason || `Annulation de la commande ${order.orderNumber} (stock restitué)`,
          createdAt: now,
        });
      }

      setVariants(prev =>
        prev.map(v => {
          if (updatedVariantsMap.has(v.id)) {
            return {
              ...v,
              quantity: updatedVariantsMap.get(v.id)!,
              updatedAt: now,
            };
          }
          return v;
        })
      );

      setStockMovements(prev => [...restorationMovements, ...prev]);
    }

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'ANNULEE',
              stockDeductedAt: null,
              updatedAt: now,
              notes: reason ? `${o.notes ? o.notes + ' | ' : ''}Annulation: ${reason}` : o.notes,
            }
          : o
      )
    );

    showToast(
      `Commande ${order.orderNumber} annulée. Le stock a été restitué avec succès.`,
      'warn'
    );
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'ANNULEE') {
      cancelOrder(orderId, 'Annulation manuelle');
      return;
    }

    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const now = new Date().toISOString();

    // If restoring from ANNULEE to an active status, re-consume stock
    if (order.status === 'ANNULEE' && !order.stockDeductedAt) {
      const deductionMovements: StockMovement[] = [];
      const updatedVariantsMap = new Map<string, number>();

      for (const item of order.items) {
        const currentQty =
          updatedVariantsMap.get(item.productVariantId) ??
          (variants.find(v => v.id === item.productVariantId)?.quantity || 0);

        updatedVariantsMap.set(item.productVariantId, Math.max(0, currentQty - item.quantity));

        deductionMovements.push({
          id: `${generateMovementId()}-rededuct-${item.id}`,
          productVariantId: item.productVariantId,
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          color: item.color,
          quantity: -item.quantity,
          type: 'ORDER',
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason: `Réactivation de la commande ${order.orderNumber}`,
          createdAt: now,
        });
      }

      setVariants(prev =>
        prev.map(v => {
          if (updatedVariantsMap.has(v.id)) {
            return {
              ...v,
              quantity: updatedVariantsMap.get(v.id)!,
              updatedAt: now,
            };
          }
          return v;
        })
      );

      setStockMovements(prev => [...deductionMovements, ...prev]);

      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, status: newStatus, stockDeductedAt: now, updatedAt: now }
            : o
        )
      );
      return;
    }

    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: newStatus, updatedAt: now } : o))
    );
  };

  const archiveOrder = (id: string) => {
    const target = orders.find(o => o.id === id);
    const now = new Date().toISOString();
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, archivedAt: now, updatedAt: now } : o))
    );
    showToast(
      `Commande ${target?.orderNumber || id} archivée (exclue des statistiques).`,
      'info',
      () => restoreOrder(id),
      'Annuler'
    );
  };

  const restoreOrder = (id: string) => {
    const target = orders.find(o => o.id === id);
    const now = new Date().toISOString();
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, archivedAt: null, updatedAt: now } : o))
    );
    showToast(`Commande ${target?.orderNumber || id} restaurée avec succès !`, 'success');
  };

  const deleteOrderPermanently = (id: string) => {
    const target = orders.find(o => o.id === id);
    setOrders(prev => prev.filter(o => o.id !== id));
    setPayments(prev => prev.filter(p => p.orderId !== id));
    setStockMovements(prev => prev.filter(m => m.orderId !== id));
    if (selectedOrderId === id) {
      setSelectedOrderId(null);
    }
    showToast(
      `Commande ${target?.orderNumber || id} et ses règlements supprimés définitivement.`,
      'warn'
    );
  };

  // ----------------------------------------------------
  // Payments & Delivery Prompt Trigger
  // ----------------------------------------------------
  const addPayment = (data: {
    orderId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    note?: string;
    date?: string;
  }): { success: boolean; error?: string } => {
    const order = orders.find(o => o.id === data.orderId);
    if (!order) return { success: false, error: 'Commande introuvable.' };

    if (data.amount <= 0) {
      return { success: false, error: 'Le montant du paiement doit être supérieur à 0 DH.' };
    }

    if (data.amount > order.remainingAmount + 0.01) {
      return {
        success: false,
        error: `Le montant (${data.amount} DH) ne peut pas dépasser le reste à payer (${order.remainingAmount} DH).`,
      };
    }

    const now = new Date().toISOString();
    const newPaidAmount = Math.min(order.totalAmount, order.paidAmount + data.amount);
    const newRemainingAmount = Math.max(0, order.totalAmount - newPaidAmount);

    let newPaymentStatus: PaymentStatus = 'NON_PAYE';
    if (newRemainingAmount === 0 && order.totalAmount > 0) {
      newPaymentStatus = 'PAYE';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'PARTIELLEMENT_PAYE';
    }

    const paymentRecord: Payment = {
      id: `${generatePaymentId()}-${Date.now().toString().slice(-3)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      date: data.date || new Date().toISOString().split('T')[0],
      note: data.note || 'Règlement de commande',
      createdAt: now,
    };

    setPayments(prev => [paymentRecord, ...prev]);

    const updatedOrder: Order = {
      ...order,
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      paymentStatus: newPaymentStatus,
      updatedAt: now,
    };

    setOrders(prev => prev.map(o => (o.id === data.orderId ? updatedOrder : o)));

    showToast(`Paiement de ${data.amount} DH enregistré pour ${order.orderNumber} !`, 'success');

    // When order becomes FULLY PAID (PAYE), trigger delivery check modal
    if (newPaymentStatus === 'PAYE' && order.status !== 'LIVREE') {
      setTimeout(() => {
        setDeliveryPromptOrder(updatedOrder);
      }, 250);
    }

    return { success: true };
  };

  const deletePaymentPermanently = (paymentId: string) => {
    const targetPayment = payments.find(p => p.id === paymentId);
    if (!targetPayment) return;

    const now = new Date().toISOString();
    const remainingPayments = payments.filter(p => p.id !== paymentId);
    setPayments(remainingPayments);

    // Recalculate order's paidAmount, remainingAmount, and paymentStatus
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== targetPayment.orderId) return o;
        const newPaidAmount = Math.max(0, o.paidAmount - targetPayment.amount);
        const newRemainingAmount = Math.max(0, o.totalAmount - newPaidAmount);
        let newPaymentStatus: PaymentStatus = 'NON_PAYE';
        if (newRemainingAmount === 0 && o.totalAmount > 0) {
          newPaymentStatus = 'PAYE';
        } else if (newPaidAmount > 0) {
          newPaymentStatus = 'PARTIELLEMENT_PAYE';
        }
        return {
          ...o,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          paymentStatus: newPaymentStatus,
          updatedAt: now,
        };
      })
    );

    showToast(
      `Règlement de ${targetPayment.amount} DH (${targetPayment.orderNumber}) supprimé et solde recalculé.`,
      'warn'
    );
  };

  const markOrderAsPaid = (orderId: string, paymentMethod: PaymentMethod = 'ESPECES') => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.remainingAmount <= 0) return;

    addPayment({
      orderId: order.id,
      amount: order.remainingAmount,
      paymentMethod,
      note: 'Solde intégral réglé',
    });
  };

  // ----------------------------------------------------
  // Expenses / Charges d'exploitation
  // ----------------------------------------------------
  const createExpense = (data: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...data,
      id: generateExpenseId(),
      createdAt: now,
      archivedAt: null,
    };
    setExpenses(prev => [newExpense, ...prev]);
    showToast(`Charge "${newExpense.title}" (${newExpense.amount} DH) enregistrée.`);
    return newExpense;
  };

  const archiveExpense = (id: string) => {
    const target = expenses.find(e => e.id === id);
    const now = new Date().toISOString();
    setExpenses(prev =>
      prev.map(e => (e.id === id ? { ...e, archivedAt: now } : e))
    );
    showToast(
      `Charge "${target?.title || id}" archivée (exclue des calculs).`,
      'info',
      () => restoreExpense(id),
      'Annuler'
    );
  };

  const restoreExpense = (id: string) => {
    const target = expenses.find(e => e.id === id);
    setExpenses(prev =>
      prev.map(e => (e.id === id ? { ...e, archivedAt: null } : e))
    );
    showToast(`Charge "${target?.title || id}" restaurée avec succès !`, 'success');
  };

  const deleteExpensePermanently = (id: string) => {
    const target = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast(`Charge "${target?.title || id}" supprimée définitivement.`, 'warn');
  };

  // Bulk purge all archived items across the system
  const purgeAllArchived = () => {
    const archivedProdIds = new Set(products.filter(p => Boolean(p.archivedAt)).map(p => p.id));
    const archivedOrdIds = new Set(orders.filter(o => Boolean(o.archivedAt)).map(o => o.id));
    const archivedDesignIds = new Set(designs.filter(d => Boolean(d.archivedAt)).map(d => d.id));

    setProducts(prev => prev.filter(p => !p.archivedAt));
    setVariants(prev => prev.filter(v => !archivedProdIds.has(v.productId)));
    setCustomers(prev => prev.filter(c => !c.archivedAt));
    setDesigns(prev => prev.filter(d => !d.archivedAt));
    setOrders(prev =>
      prev
        .filter(o => !o.archivedAt)
        .map(o => ({
          ...o,
          items: o.items.map(it => ({
            ...it,
            frontDesignId:
              it.frontDesignId && archivedDesignIds.has(it.frontDesignId) ? null : it.frontDesignId,
            backDesignId:
              it.backDesignId && archivedDesignIds.has(it.backDesignId) ? null : it.backDesignId,
          })),
        }))
    );
    setPayments(prev => prev.filter(p => !archivedOrdIds.has(p.orderId)));
    setStockMovements(prev =>
      prev.filter(
        m => !archivedProdIds.has(m.productId) && (!m.orderId || !archivedOrdIds.has(m.orderId))
      )
    );
    setExpenses(prev => prev.filter(e => !e.archivedAt));

    showToast('Toutes les archives ont été supprimées définitivement.', 'warn');
  };

  // ----------------------------------------------------
  // Dashboard & Accounting Metrics (100% Real & Synchronized)
  // ----------------------------------------------------
  const dashboardStats: DashboardStats = useMemo(() => {
    const activeOrders = orders.filter(o => !o.archivedAt);
    const activeProducts = products.filter(p => !p.archivedAt);
    const activeProductIds = new Set(activeProducts.map(p => p.id));
    const activeVariants = variants.filter(v => activeProductIds.has(v.productId));
    const activeCustomers = customers.filter(c => !c.archivedAt);

    const totalOrders = activeOrders.length;
    const pendingOrders = activeOrders.filter(o => o.status === 'EN_ATTENTE').length;
    const inProdOrders = activeOrders.filter(o => o.status === 'EN_PRODUCTION').length;
    const readyOrders = activeOrders.filter(o => o.status === 'PRETE').length;
    const deliveredOrders = activeOrders.filter(o => o.status === 'LIVREE').length;
    const cancelledOrders = activeOrders.filter(o => o.status === 'ANNULEE').length;

    const nonCancelledOrders = activeOrders.filter(o => o.status !== 'ANNULEE');
    const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalPaid = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);
    const totalRemaining = nonCancelledOrders.reduce(
      (sum, o) => sum + (Number(o.remainingAmount) || 0),
      0
    );

    const fullyPaidCount = nonCancelledOrders.filter(o => o.paymentStatus === 'PAYE').length;
    const partiallyPaidCount = nonCancelledOrders.filter(
      o => o.paymentStatus === 'PARTIELLEMENT_PAYE'
    ).length;
    const unpaidCount = nonCancelledOrders.filter(o => o.paymentStatus === 'NON_PAYE').length;

    const totalProducts = activeProducts.length;
    const totalVariants = activeVariants.length;
    const totalStockPieces = activeVariants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

    let lowStockVariantsCount = 0;
    let outOfStockVariantsCount = 0;

    activeVariants.forEach(v => {
      const prod = activeProducts.find(p => p.id === v.productId);
      const minStock = prod ? prod.minimumStock : 3;
      if (v.quantity === 0) {
        outOfStockVariantsCount++;
      } else if (v.quantity <= minStock) {
        lowStockVariantsCount++;
      }
    });

    return {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        inProduction: inProdOrders,
        ready: readyOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      payments: {
        totalRevenue,
        totalPaid,
        totalRemaining,
        fullyPaidCount,
        partiallyPaidCount,
        unpaidCount,
      },
      stock: {
        totalProducts,
        totalVariants,
        totalStockPieces,
        lowStockVariantsCount,
        outOfStockVariantsCount,
      },
      customers: {
        total: activeCustomers.length,
        recentCount: activeCustomers.filter(c => {
          const diffDays = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 30;
        }).length,
      },
    };
  }, [orders, products, variants, customers]);

  // ACCOUNTING COMPUTATION (Strictly on active, non-archived, non-cancelled data)
  const accountingStats: AccountingStats = useMemo(() => {
    const validOrders = orders.filter(o => !o.archivedAt && o.status !== 'ANNULEE');
    const validExpenses = expenses.filter(e => !e.archivedAt);
    const activeProducts = products.filter(p => !p.archivedAt);
    const activeProductIds = new Set(activeProducts.map(p => p.id));
    const activeVariants = variants.filter(v => activeProductIds.has(v.productId));

    // Chiffre d'affaires
    const chiffreAffaires = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    // Total des achats de vêtements vendus
    let totalAchatsVendus = 0;
    validOrders.forEach(o => {
      o.items.forEach(it => {
        const prod = products.find(p => p.id === it.productId);
        const unitCost = Number(it.costPrice ?? prod?.costPrice ?? 0);
        totalAchatsVendus += unitCost * (Number(it.quantity) || 0);
      });
    });

    // Valeur d'achat totale du stock actuel en atelier (produits actifs uniquement)
    let totalAchatsStockGlobal = 0;
    activeVariants.forEach(v => {
      const prod = activeProducts.find(p => p.id === v.productId);
      if (prod) {
        totalAchatsStockGlobal += (Number(prod.costPrice) || 0) * (Number(v.quantity) || 0);
      }
    });

    // Total des charges d'exploitation (actives uniquement)
    const totalCharges = validExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Bénéfices
    const beneficeBrut = chiffreAffaires - totalAchatsVendus;
    const beneficeNet = beneficeBrut - totalCharges;

    // Reste à recevoir
    const resteARecevoir = validOrders.reduce((sum, o) => sum + (Number(o.remainingAmount) || 0), 0);

    return {
      chiffreAffaires,
      totalAchatsVendus,
      totalAchatsStockGlobal,
      totalCharges,
      beneficeBrut,
      beneficeNet,
      resteARecevoir,
    };
  }, [orders, expenses, products, variants]);

  // System actions
  const resetToSampleData = () => {
    setProducts([]);
    setVariants([]);
    setCustomers([]);
    setDesigns([]);
    setOrders([]);
    setPayments([]);
    setStockMovements([]);
    setExpenses([]);
    if (!isCloud) clearLocalData();
    showToast('Toutes les données ont été réinitialisées à zéro.', 'warn');
  };

  const exportDataJson = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      products,
      variants,
      customers,
      designs,
      orders,
      payments,
      stockMovements,
      expenses,
    };
    return JSON.stringify(backup, null, 2);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        syncStatus,
        accountEmail: cloud?.email ?? null,
        signOut: cloud?.signOut ?? (() => {}),
        products,
        variants,
        customers,
        designs,
        orders,
        payments,
        stockMovements,
        expenses,
        dashboardStats,
        accountingStats,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        selectedOrderId,
        setSelectedOrderId,
        selectedCustomerId,
        setSelectedCustomerId,
        isOrderModalOpen,
        setIsOrderModalOpen,
        isCustomerModalOpen,
        setIsCustomerModalOpen,
        isProductModalOpen,
        setIsProductModalOpen,
        isStockMovementModalOpen,
        setIsStockMovementModalOpen,
        isDesignModalOpen,
        setIsDesignModalOpen,
        editingDesign,
        setEditingDesign,
        lastCreatedDesignId,
        setLastCreatedDesignId,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        targetOrderForPayment,
        setTargetOrderForPayment,
        deliveryPromptOrder,
        setDeliveryPromptOrder,
        cancellingOrder,
        setCancellingOrder,
        toast,
        showToast,
        hideToast,
        createProduct,
        updateProduct,
        archiveProduct,
        restoreProduct,
        deleteProductPermanently,
        addVariant,
        deleteVariant,
        adjustStock,
        setVariantStockExact,
        createCustomer,
        updateCustomer,
        archiveCustomer,
        restoreCustomer,
        deleteCustomerPermanently,
        createDesign,
        updateDesign,
        archiveDesign,
        restoreDesign,
        deleteDesignPermanently,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        markOrderAsPaid,
        archiveOrder,
        restoreOrder,
        deleteOrderPermanently,
        addPayment,
        deletePaymentPermanently,
        createExpense,
        archiveExpense,
        restoreExpense,
        deleteExpensePermanently,
        purgeAllArchived,
        resetToSampleData,
        exportDataJson,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
