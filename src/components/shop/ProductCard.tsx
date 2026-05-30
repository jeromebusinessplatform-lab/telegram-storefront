import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, getItemQty } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const qty = getItemQty(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/40 flex flex-col"
      >
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          {product.badge && (
            <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              product.badge === 'Sale' ? 'bg-destructive text-destructive-foreground' :
              product.badge === 'New' ? 'bg-primary text-primary-foreground' :
              'bg-foreground text-background'
            }`}>
              {product.badge}
            </span>
          )}
          {discount && (
            <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/90 text-destructive-foreground">
              -{discount}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <p className="text-xs text-muted-foreground capitalize font-medium">{product.category}</p>
          <h3 className="text-sm font-semibold text-card-foreground leading-tight line-clamp-2">
            {product.name}
          </h3>
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-semibold text-foreground">{product.rating}</span>
            <span className="text-[11px] text-muted-foreground">({product.reviews.toLocaleString()})</span>
          </div>
          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-[11px] text-muted-foreground line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <motion.button
              onClick={handleAdd}
              whileTap={{ scale: 0.88 }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                justAdded
                  ? 'bg-success text-success-foreground'
                  : qty > 0
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              <AnimatePresence mode="wait">
                {justAdded ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check size={14} strokeWidth={3} />
                  </motion.span>
                ) : qty > 0 ? (
                  <motion.span key="qty" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs font-bold">
                    {qty}
                  </motion.span>
                ) : (
                  <motion.span key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Plus size={14} strokeWidth={2.5} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
