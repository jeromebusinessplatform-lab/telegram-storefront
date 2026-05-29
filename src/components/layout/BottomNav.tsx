import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, User, MessageCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: ShoppingCart, label: 'Cart', path: '/cart' },
  { icon: Package, label: 'Orders', path: '/orders' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: MessageCircle, label: 'Support', path: '/support' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex items-stretch"
      style={{ height: 'var(--bottom-nav-height)' }}
    >
      {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
        const isActive = path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(path);
        const showBadge = path === '/cart' && totalItems > 0;

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-primary' : ''}`} />
              {showBadge && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </div>
            <span className={`text-[8px] font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {isActive && (
              <div className="absolute bottom-0 w-6 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
