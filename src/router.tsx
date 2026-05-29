import { lazy } from "react";

// Admin pages
import AdminGuard from "@/components/layout/AdminGuard";

// Admin Guard

const StorePage = lazy(() => import("./pages/StorePage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const TicketDetailPage = lazy(() => import("./pages/TicketDetailPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MobileAuthPage = lazy(() => import("./pages/MobileAuthPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));

const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("./pages/admin/AdminOrderDetailPage"));
const AdminCustomersPage = lazy(() => import("./pages/admin/AdminCustomersPage"));
const AdminVouchersPage = lazy(() => import("./pages/admin/AdminVouchersPage"));
const AdminPaymentMethodsPage = lazy(() => import("./pages/admin/AdminPaymentMethodsPage"));
const AdminDeliveryPage = lazy(() => import("./pages/admin/AdminDeliveryPage"));
const AdminFeesPage = lazy(() => import("./pages/admin/AdminFeesPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminSupportPage = lazy(() => import("./pages/admin/AdminSupportPage"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage"));

export const routers = [
  // Customer routes
  { path: "/", name: "store", element: <StorePage /> },
  { path: "/product/:id", name: "product", element: <ProductDetailPage /> },
  { path: "/cart", name: "cart", element: <CartPage /> },
  { path: "/checkout", name: "checkout", element: <CheckoutPage /> },
  { path: "/orders", name: "orders", element: <OrdersPage /> },
  { path: "/orders/:id", name: "order-detail", element: <OrderDetailPage /> },
  { path: "/profile", name: "profile", element: <ProfilePage /> },
  { path: "/support", name: "support", element: <SupportPage /> },
  { path: "/support/:ticketId", name: "ticket-detail", element: <TicketDetailPage /> },
  { path: "/notifications", name: "notifications", element: <NotificationsPage /> },
  { path: "/mobile-auth", name: "mobile-auth", element: <MobileAuthPage /> },
  { path: "/auth/callback", name: "auth-callback", element: <AuthCallbackPage /> },

  // Admin routes
  { path: "/admin", name: "admin-login", element: <AdminLoginPage /> },
  { path: "/admin/dashboard", name: "admin-dashboard", element: <AdminGuard><AdminDashboard /></AdminGuard> },
  { path: "/admin/products", name: "admin-products", element: <AdminGuard><AdminProductsPage /></AdminGuard> },
  { path: "/admin/categories", name: "admin-categories", element: <AdminGuard><AdminCategoriesPage /></AdminGuard> },
  { path: "/admin/orders", name: "admin-orders", element: <AdminGuard><AdminOrdersPage /></AdminGuard> },
  { path: "/admin/orders/:id", name: "admin-order-detail", element: <AdminGuard><AdminOrderDetailPage /></AdminGuard> },
  { path: "/admin/customers", name: "admin-customers", element: <AdminGuard><AdminCustomersPage /></AdminGuard> },
  { path: "/admin/vouchers", name: "admin-vouchers", element: <AdminGuard><AdminVouchersPage /></AdminGuard> },
  { path: "/admin/payments", name: "admin-payments", element: <AdminGuard><AdminPaymentMethodsPage /></AdminGuard> },
  { path: "/admin/delivery", name: "admin-delivery", element: <AdminGuard><AdminDeliveryPage /></AdminGuard> },
  { path: "/admin/fees", name: "admin-fees", element: <AdminGuard><AdminFeesPage /></AdminGuard> },
  { path: "/admin/settings", name: "admin-settings", element: <AdminGuard><AdminSettingsPage /></AdminGuard> },
  { path: "/admin/support", name: "admin-support", element: <AdminGuard><AdminSupportPage /></AdminGuard> },
  { path: "/admin/notifications", name: "admin-notifications", element: <AdminGuard><AdminNotificationsPage /></AdminGuard> },

  { path: "*", name: "404", element: <NotFound /> },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
