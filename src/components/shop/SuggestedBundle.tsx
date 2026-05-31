import { motion } from 'framer-motion';
import { ShoppingCart, Tag, ChevronRight } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/data/products';
import { toast } from 'sonner';

interface Props {
  product: Product;
}

export default function SuggestedBundle({ product }: Props) {
  const { getProductById } = useProducts();
  const { addItem } = useCart();

  const bundle = product.bundle;
  if (!bundle?.enabled || bundle.items.length === 0) return null;

  // Resolve bundled products and their bundle prices
  const bundleDetails = bundle.items
    .map(item => {
      const p = getProductById(item.productId);
      if (!p) return null;
      const bundlePrice = bundle.useGlobalPrice
        ? null // global price applies to whole bundle
        : item.discountType === 'fixed'
          ? item.discountValue
          : p.price * (1 - item.discountValue / 100);
      return { product: p, bundlePrice, item };
    })
    .filter(Boolean) as { product: Product; bundlePrice: number | null; item: typeof bundle.items[0] }[];

  if (bundleDetails.length === 0) return null;

  // Calculate totals
  const mainPrice = product.price;
  const normalTotal = mainPrice + bundleDetails.reduce((s, d) => s + d.product.price, 0);
  const bundleTotal = bundle.useGlobalPrice && bundle.globalPrice
    ? bundle.globalPrice
    : mainPrice + bundleDetails.reduce((s, d) => s + (d.bundlePrice ?? d.product.price), 0);
  const savings = normalTotal - bundleTotal;
  const savingsPct = Math.round((savings / normalTotal) * 100);

  const handleAddBundle = () => {
    addItem(product);
    bundleDetails.forEach(({ product: p }) => addItem(p));
    toast.success(`Bundle added to cart! Save ₱${savings.toFixed(0)}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="mt-4 bg-card border border-primary/20 rounded-2xl overflow-hidden shadow-elevated">

      {/* Header */}
      <div className="bg-primary/8 px-4 py-3 border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
            <Tag size={12} className="text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Suggested Bundle</p>
            <p className="text-[9px] text-muted-foreground">Buy More, Save More</p>
          </div>
        </div>
        {savingsPct > 0 && (
          <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-0.5 rounded-full">
            -{savingsPct}%
          </span>
        )}
      </div>

      {/* Bundle items */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {/* Main product */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/40">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-1">{product.name}</p>
            <p className="text-[10px] font-bold text-foreground">₱{mainPrice.toFixed(0)}</p>
          </div>
          <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">This item</span>
        </div>

        {bundleDetails.map(({ product: p, bundlePrice }, i) => (
          <div key={p.id}>
            <div className="flex items-center gap-1 pl-5 mb-1">
              <div className="h-px flex-1 bg-dashed border-t border-dashed border-border/60" />
              <span className="text-[9px] text-muted-foreground px-1">+</span>
              <div className="h-px flex-1 border-t border-dashed border-border/60" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/40">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-1">{p.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {bundlePrice !== null && bundlePrice < p.price ? (
                    <>
                      <span className="text-[10px] font-bold text-success">₱{bundlePrice.toFixed(0)}</span>
                      <span className="text-[9px] text-muted-foreground line-through">₱{p.price.toFixed(0)}</span>
                    </>
                  ) : (
                    <span className="text-[10px] font-bold text-foreground">₱{p.price.toFixed(0)}</span>
                  )}
                </div>
              </div>
              <ChevronRight size={12} className="text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      {/* Summary + CTA */}
      <div className="px-4 pb-4 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Bundle Total</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-foreground">₱{bundleTotal.toFixed(0)}</span>
              {savings > 0 && <span className="text-[10px] text-muted-foreground line-through">₱{normalTotal.toFixed(0)}</span>}
            </div>
          </div>
          {savings > 0 && (
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground">You save</p>
              <p className="text-sm font-bold text-success">₱{savings.toFixed(0)}</p>
            </div>
          )}
        </div>

        <button onClick={handleAddBundle}
          className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-elevated">
          <ShoppingCart size={14} />
          Add Bundle to Cart
        </button>
      </div>
    </motion.div>
  );
}
