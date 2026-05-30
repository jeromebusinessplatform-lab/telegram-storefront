import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, Tag } from 'lucide-react';
import { products, categories } from '@/data/products';
import ProductCard from '@/components/shop/ProductCard';

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let list = activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, searchQuery]);

  const activeCategoryLabel = categories.find((c) => c.id === activeCategory)?.name ?? 'All';
  const showBanner = !searchQuery && activeCategory === 'all';

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Sticky banner — non-scrolling when active ── */}
      {showBanner && (
        <div className="sticky top-0 z-20 bg-background px-5 pt-4 pb-2">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-banner-gradient border-l-4 border-l-primary rounded-2xl px-5 py-4 flex items-center justify-between overflow-hidden shadow-banner"
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Tag size={11} className="text-primary" />
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Flash Sale</p>
              </div>
              <p className="text-sm font-bold text-foreground font-condensed leading-snug">
                Up to 40% off<br />selected items
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Limited time · Free shipping included</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/12 flex items-center justify-center flex-shrink-0 ml-3 border-2 border-primary/20">
              <span className="text-lg font-black text-primary font-condensed leading-none">40%<br /><span className="text-[9px] font-semibold">OFF</span></span>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Search + Category Dropdown ── */}
      <div className="px-5 mt-4 flex gap-2.5 items-center">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-xl pl-8 pr-3 py-2.5 text-[11px] font-medium text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 shadow-card transition-all"
          />
        </div>
        <div className="relative flex-shrink-0">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="appearance-none bg-card border border-border rounded-xl pl-3 pr-7 py-2.5 text-[11px] font-semibold text-foreground outline-none focus:border-primary/50 shadow-card cursor-pointer min-w-[88px]"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* ── Products grid — 3 columns ── */}
      <div className="px-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground font-condensed">
            {activeCategoryLabel === 'All' ? 'All Products' : activeCategoryLabel}
          </h2>
          <span className="text-[10px] text-muted-foreground">{filtered.length} items</span>
        </div>

        {filtered.length > 0 ? (
          <motion.div layout className="grid grid-cols-3 gap-2.5 pb-5">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                layout
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search size={30} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground">No products found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
