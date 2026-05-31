import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { fmtPrice } from '@/utils/format';

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

  const isSale = product.badge === 'Sale' && product.originalPrice != null;
  const outOfStock = product.stock === 0;
  const stockLabel = outOfStock ? 'Out of stock' : product.showStock ? `${product.stock} left` : null;
  const stockColor = outOfStock ? 'text-destructive' : product.stock <= 5 ? 'text-amber-600' : 'text-muted-foreground';

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="bg-card rounded-xl overflow-hidden shadow-card border border-border/40 flex flex-col"
      >
        {/* Thumbnail */}
        <div className="relative h-[96px] bg-muted overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {product.badge && (
            <span className={`absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
              product.badge === 'Sale'       ? 'bg-destructive text-destructive-foreground' :
              product.badge === 'New'        ? 'bg-primary text-primary-foreground' :
                                              'bg-foreground text-background'
            }`}>
              {product.badge}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="px-2.5 pt-2 pb-2.5 flex flex-col gap-0.5 flex-1">
          {/* Product Name */}
          <h3 className="text-[10px] font-bold text-card-foreground leading-tight line-clamp-1">
            {product.name}
          </h3>

          {/* Sub-Name */}
          {product.subName && (
            <p className="text-[9px] text-muted-foreground leading-tight line-clamp-1">
              {product.subName}
            </p>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between mt-auto pt-1 gap-1">
            <div className="flex flex-col leading-none min-w-0">
              {isSale ? (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[11px] font-bold text-foreground">₱{fmtPrice(product.price)}</span>
                  <span className="text-[9px] text-muted-foreground line-through">₱{fmtPrice(product.originalPrice!)}</span>
                </div>
              ) : (
                <span className="text-[11px] font-bold text-foreground">₱{fmtPrice(product.price)}</span>
              )}
              {/* Stocks Left */}
              {stockLabel && (
                <span className={`text-[8px] font-medium leading-none mt-0.5 ${stockColor}`}>
                  {stockLabel}
                </span>
              )}
            </div>

            {/* Add button */}
            <motion.button
              onClick={handleAdd}
              whileTap={{ scale: 0.82 }}
              className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
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
                    <Check size={10} strokeWidth={3} />
                  </motion.span>
                ) : qty > 0 ? (
                  <motion.span key="qty" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[9px] font-bold">
                    {qty}
                  </motion.span>
                ) : (
                  <motion.span key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Plus size={10} strokeWidth={2.5} />
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
