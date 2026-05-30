import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';

export default function GlobalHeader() {
  const { totalItems } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-hero-gradient">
      <div className="max-w-sm mx-auto px-4 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-primary-foreground font-bold text-lg leading-none font-condensed tracking-wide">
            ShopBot
          </h1>
          <p className="text-primary-foreground/65 text-[11px] font-medium mt-0.5">Mini Store</p>
        </div>
        <Link to="/cart" className="relative w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground">
          <ShoppingCart size={18} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
