import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';
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

  return (
    <div className="flex flex-col min-h-full">
      {/* Banner */}
      {!searchQuery && activeCategory === 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-3"
        >
          <div className="bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3 flex items-center justify-between overflow-hidden">
            <div>
              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Flash Sale</p>
              <p className="text-sm font-bold text-foreground mt-0.5 font-condensed">Up to 40% off selected items</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-black text-primary font-condensed">40%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search + Category Dropdown */}
      <div className="px-3 mt-3 flex gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-xl pl-8 pr-3 py-2.5 text-[12px] font-medium text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 shadow-card transition-all"
          />
        </div>

        {/* Category dropdown */}
        <div className="relative flex-shrink-0">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="appearance-none bg-card border border-border rounded-xl pl-3 pr-7 py-2.5 text-[12px] font-semibold text-foreground outline-none focus:border-primary/50 shadow-card cursor-pointer min-w-[90px]"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Products grid - 3 columns */}
      <div className="px-3 mt-3">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-foreground font-condensed">
            {activeCategoryLabel === 'All' ? 'All Products' : activeCategoryLabel}
          </h2>
          <span className="text-[11px] text-muted-foreground">{filtered.length} items</span>
        </div>

        {filtered.length > 0 ? (
          <motion.div layout className="grid grid-cols-3 gap-2 pb-4">
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
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Search size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground">No products found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
