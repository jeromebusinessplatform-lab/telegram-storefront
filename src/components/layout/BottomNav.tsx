import { NavLink } from 'react-router-dom';
import { Grid3x3, ShoppingCart, Bell, Package, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', label: 'Shop', icon: Grid3x3, exact: true, badge: null },
  { to: '/cart', label: 'Cart', icon: ShoppingCart, exact: false, badge: 'cart' },
  { to: '/notifications', label: 'Alerts', icon: Bell, exact: false, badge: null },
  { to: '/orders', label: 'Orders', icon: Package, exact: false, badge: null },
  { to: '/profile', label: 'Profile', icon: User, exact: false, badge: null },
];

export default function BottomNav() {
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border max-w-sm mx-auto">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map(({ to, label, icon: Icon, exact, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <motion.div
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  </motion.div>
                  <AnimatePresence>
                    {badge === 'cart' && totalItems > 0 && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 min-w-[15px] h-3.5 px-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
                      >
                        {totalItems > 99 ? '99+' : totalItems}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[9px] font-medium">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-0 w-1 h-0.5 rounded-full bg-primary"
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
