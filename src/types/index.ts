export type OrderStatus = 'EN_ATTENTE' | 'EN_PRODUCTION' | 'PRETE' | 'LIVREE' | 'ANNULEE';

export type PaymentStatus = 'NON_PAYE' | 'PARTIELLEMENT_PAYE' | 'PAYE';

export type PaymentMethod = 'ESPECES' | 'VIREMENT' | 'CARTE' | 'AUTRE';

export type StockMovementType = 'STOCK_IN' | 'STOCK_OUT' | 'ORDER' | 'ORDER_CANCELLED' | 'ADJUSTMENT' | 'RETURN';

export type PrintPosition = 'FRONT' | 'BACK' | 'FRONT_BACK';

export type DesignType = 'IMAGE' | 'CUSTOM';

export type DesignStatus = 'FILE_PROVIDED' | 'CUSTOM_REQUEST' | 'READY' | 'ARCHIVED';

export type ApparelType = 
  | 'T-shirt'
  | 'Hoodie'
  | 'Sweatshirt'
  | 'Polo'
  | 'Débardeur'
  | 'Veste'
  | 'Casquette'
  | 'Autre';

export interface Customer {
  id: string; // e.g. "CLI-0001"
  name: string;
  phone: string;
  location: string;
  instagramUsername: string; // e.g. "@username"
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string; // e.g. 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'
  color: string; // e.g. 'Noir', 'Blanc', 'Bleu Marine'
  colorHex?: string; // Optional hex for swatch preview
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string; // e.g. "PRD-0001"
  name: string;
  type: ApparelType;
  costPrice: number; // Prix d'achat de l'article (au fournisseur/stock)
  unitPrice?: number; // Compatibilité
  minimumStock: number; // default threshold (e.g. 3)
  description?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface StockMovement {
  id: string;
  productVariantId: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number; // positive for IN, negative for OUT
  type: StockMovementType;
  orderId?: string | null;
  orderNumber?: string | null;
  reason?: string;
  createdAt: string;
}

export interface Design {
  id: string; // e.g. "DSG-0001"
  customerId?: string | null;
  customerName?: string | null;
  name: string;
  type: DesignType; // 'IMAGE' or 'CUSTOM'
  fileUrl?: string; // Data URL or image path
  thumbnailUrl?: string;
  status: DesignStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productVariantId: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  costPrice: number; // Prix d'achat de l'article pour calculer le bénéfice
  unitPrice: number; // Prix de vente convenu et saisi pour cette commande
  totalPrice: number;
  printPosition: PrintPosition;
  frontDesignId?: string | null;
  backDesignId?: string | null;
}

export type ExpenseCategory =
  | 'LOYER'
  | 'ELECTRICITE_EAU'
  | 'CONSOMMABLES'
  | 'MATERIEL'
  | 'TRANSPORT'
  | 'MARKETING'
  | 'AUTRE';

export interface Expense {
  id: string; // e.g. "CHG-0001"
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
  archivedAt?: string | null;
}

export interface AccountingStats {
  chiffreAffaires: number;
  totalAchatsVendus: number;
  totalAchatsStockGlobal: number;
  totalCharges: number;
  beneficeBrut: number;
  beneficeNet: number;
  resteARecevoir: number;
}

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  note?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "CMD-0001"
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerLocation?: string;
  customerInstagram?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  stockDeductedAt?: string | null; // Guard against double stock deductions
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    inProduction: number;
    ready: number;
    delivered: number;
    cancelled: number;
  };
  payments: {
    totalRevenue: number;
    totalPaid: number;
    totalRemaining: number;
    fullyPaidCount: number;
    partiallyPaidCount: number;
    unpaidCount: number;
  };
  stock: {
    totalProducts: number;
    totalVariants: number;
    totalStockPieces: number;
    lowStockVariantsCount: number;
    outOfStockVariantsCount: number;
  };
  customers: {
    total: number;
    recentCount: number;
  };
}
