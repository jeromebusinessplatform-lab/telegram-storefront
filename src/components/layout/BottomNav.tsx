import { NavLink } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Bell, Package, User, LifeBuoy } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
const navItems = [{
  to: '/',
  label: 'Shop',
  icon: ShoppingBag,
  exact: true,
  badge: null
}, {
  to: '/cart',
  label: 'Cart',
  icon: ShoppingCart,
  exact: false,
  badge: 'cart'
}, {
  to: '/notifications',
  label: 'Alerts',
  icon: Bell,
  exact: false,
  badge: null
}, {
  to: '/orders',
  label: 'Orders',
  icon: Package,
  exact: false,
  badge: null
}, {
  to: '/support',
  label: 'Support',
  icon: LifeBuoy,
  exact: false,
  badge: null
}, {
  to: '/profile',
  label: 'Profile',
  icon: User,
  exact: false,
  badge: null
}];
export default function BottomNav() {
  const {
    totalItems
  } = useCart();
  return <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-stretch justify-around py-1">
        {navItems.map(({
        to,
        label,
        icon: Icon,
        exact,
        badge
      }) => {})}
      </div>
    </nav>;
}