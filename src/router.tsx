import AppLayout from './components/layout/AppLayout';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import SupportPage from './pages/SupportPage';
import NotFound from './pages/NotFound';

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
    ],
  },
  {
    path: '*',
    name: '404',
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
