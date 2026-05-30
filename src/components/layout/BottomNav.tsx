import { NavLink } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Bell, Package, User, LifeBuoy } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', label: 'Shop', icon: ShoppingBag, exact: true, badge: null },
  { to: '/cart', label: 'Cart', icon: ShoppingCart, exact: false, badge: 'cart' },
  { to: '/notifications', label: 'Alerts', icon: Bell, exact: false, badge: null },
  { to: '/orders', label: 'Orders', icon: Package, exact: false, badge: null },
  { to: '/support', label: 'Support', icon: LifeBuoy, exact: false, badge: null },
  { to: '/profile', label: 'Profile', icon: User, exact: false, badge: null },
];

export default function BottomNav() {
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-stretch justify-around py-1">
        {navItems.map(({ to, label, icon: Icon, exact, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <motion.div
                    animate={isActive ? { scale: 1.08 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
                  </motion.div>
                  <AnimatePresence>
                    {badge === 'cart' && totalItems > 0 && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-1 bg-primary text-primary-foreground text-[8px] font-bold rounded-full flex items-center justify-center leading-none"
                      >
                        {totalItems > 99 ? '99+' : totalItems}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[8px] font-medium leading-none">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
