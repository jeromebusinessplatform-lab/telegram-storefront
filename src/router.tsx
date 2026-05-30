import AppLayout from './components/layout/AppLayout';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import AdminPage from './pages/AdminPage';
import NotFound from './pages/NotFound';
import StoreStatusPage from './pages/admin/StoreStatusPage';
import OrderManagementPage from './pages/admin/OrderManagementPage';
import InventoryPage from './pages/admin/InventoryPage';
import PaymentManagementPage from './pages/admin/PaymentManagementPage';
import CustomerManagementPage from './pages/admin/CustomerManagementPage';
import PromosPage from './pages/admin/PromosPage';
import ChargeManagementPage from './pages/admin/ChargeManagementPage';
import DeliveryManagementPage from './pages/admin/DeliveryManagementPage';
import CashflowPage from './pages/admin/CashflowPage';
import AnnouncementPage from './pages/admin/AnnouncementPage';
import AdminSupportCenterPage from './pages/admin/AdminSupportCenterPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';

export const routers = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ShopPage /> },
      { path: 'product/:id', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'support', element: <SupportPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'admin/store-status',   element: <StoreStatusPage /> },
      { path: 'admin/orders',         element: <OrderManagementPage /> },
      { path: 'admin/inventory',      element: <InventoryPage /> },
      { path: 'admin/payments',       element: <PaymentManagementPage /> },
      { path: 'admin/customers',      element: <CustomerManagementPage /> },
      { path: 'admin/promos',         element: <PromosPage /> },
      { path: 'admin/charges',        element: <ChargeManagementPage /> },
      { path: 'admin/delivery',       element: <DeliveryManagementPage /> },
      { path: 'admin/cashflow',       element: <CashflowPage /> },
      { path: 'admin/announcements',  element: <AnnouncementPage /> },
      { path: 'admin/support-config', element: <AdminSupportCenterPage /> },
      { path: 'admin/settings',       element: <SystemSettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
