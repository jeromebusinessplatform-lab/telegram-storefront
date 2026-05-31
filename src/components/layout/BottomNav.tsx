import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Bell, Package, User, LifeBuoy, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/',             label: 'Shop',    icon: ShoppingBag,  exact: true,  badge: null   },
  { to: '/cart',         label: 'Cart',    icon: ShoppingCart, exact: false, badge: 'cart' },
  { to: '/notifications',label: 'Alerts',  icon: Bell,         exact: false, badge: null   },
  { to: '/orders',       label: 'Orders',  icon: Package,      exact: false, badge: null   },
  { to: '/support',      label: 'Support', icon: LifeBuoy,     exact: false, badge: null   },
  { to: '/profile',      label: 'Profile', icon: User,         exact: false, badge: null   },
];

export default function BottomNav() {
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAdmin = pathname.startsWith('/admin');

  /* ── Admin pages: show Preview Shop button instead ── */
  if (isAdmin) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-5 py-3">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-hero-gradient text-primary-foreground rounded-2xl text-[11px] font-semibold shadow-elevated"
        >
          <Eye size={14} /> Preview Shop
        </button>
      </div>
    );
  }

  /* ── Normal store pages: full BottomNav ── */
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-stretch justify-around py-1">
        {navItems.map(({ to, label, icon: Icon, exact, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                  {badge === 'cart' && totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full flex items-center justify-center"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  )}
                </div>
                <span className={`text-[8px] mt-0.5 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
