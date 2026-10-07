import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { OrdersView } from './components/orders/OrdersView';
import { OrderCreateModal } from './components/orders/OrderCreateModal';
import { OrderDetailModal } from './components/orders/OrderDetailModal';
import { DeliveryCheckModal } from './components/orders/DeliveryCheckModal';
import { CancelOrderModal } from './components/orders/CancelOrderModal';
import { Toast } from './components/common/Toast';
import { StockView } from './components/stock/StockView';
import { ProductModal } from './components/stock/ProductModal';
import { StockMovementModal } from './components/stock/StockMovementModal';
import { AccountingView } from './components/accounting/AccountingView';
import { ExpenseModal } from './components/accounting/ExpenseModal';
import { CustomersView } from './components/customers/CustomersView';
import { CustomerModal } from './components/customers/CustomerModal';
import { CustomerDetailModal } from './components/customers/CustomerDetailModal';
import { DesignsView } from './components/designs/DesignsView';
import { DesignModal } from './components/designs/DesignModal';
import { PaymentsView } from './components/payments/PaymentsView';
import { PaymentAddModal } from './components/payments/PaymentAddModal';
import { MovementsView } from './components/movements/MovementsView';
import { ArchivesView } from './components/archives/ArchivesView';
import { AuthGate } from './components/auth/AuthGate';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-zinc-900 dark:text-zinc-100 antialiased selection:bg-amber-100 selection:text-amber-900 dark:selection:bg-amber-900/60 dark:selection:text-amber-100 transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <Header />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/70 dark:bg-zinc-950/70">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'stock' && <StockView />}
          {activeTab === 'accounting' && <AccountingView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'designs' && <DesignsView />}
          {activeTab === 'payments' && <PaymentsView />}
          {activeTab === 'movements' && <MovementsView />}
          {activeTab === 'archives' && <ArchivesView />}
        </main>
      </div>

      {/* Centralized Modals & Notifications */}
      <OrderCreateModal />
      <OrderDetailModal />
      <DeliveryCheckModal />
      <CancelOrderModal />
      <CustomerModal />
      <CustomerDetailModal />
      <ProductModal />
      <StockMovementModal />
      <DesignModal />
      <PaymentAddModal />
      <ExpenseModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AuthGate>
      {cloud => (
        <AppProvider key={cloud?.userId ?? 'local'} cloud={cloud}>
          <MainLayout />
        </AppProvider>
      )}
    </AuthGate>
  );
}
