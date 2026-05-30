import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell } from 'lucide-react';
import { products } from '@/data/products';
import CategoryFilter from '@/components/shop/CategoryFilter';
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

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-hero-gradient px-4 pt-10 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/70 text-sm font-medium">Welcome back</p>
            <h1 className="text-primary-foreground text-xl font-bold">ShopBot Store</h1>
          </div>
          <button className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground backdrop-blur-sm">
            <Bell size={18} />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card/95 backdrop-blur-sm rounded-2xl pl-9 pr-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 shadow-card"
          />
        </div>
      </div>

      {/* Banner */}
      {!searchQuery && activeCategory === 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4"
        >
          <div className="bg-primary/8 border border-primary/20 rounded-2xl p-4 flex items-center justify-between overflow-hidden relative">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Flash Sale</p>
              <p className="text-base font-bold text-foreground mt-0.5">Up to 40% off<br />selected items</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-black text-primary">40%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Categories */}
      <div className="mt-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-foreground">Categories</h2>
        </div>
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      </div>

      {/* Products grid */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">
            {activeCategory === 'all' ? 'All Products' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
          </h2>
          <span className="text-xs text-muted-foreground">{filtered.length} items</span>
        </div>

        {filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-2 gap-3 pb-4"
          >
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                layout
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search size={36} className="text-muted-foreground/40 mb-3" />
            <p className="text-base font-semibold text-foreground">No products found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
