import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, Search } from 'lucide-react';
import AdminSubHeader from '@/components/admin/AdminSubHeader';
import { products as initialProducts } from '@/data/products';

export default function InventoryPage() {
  const [stock, setStock] = useState<Record<string, number>>(
    Object.fromEntries(initialProducts.map(p => [p.id, Math.floor(Math.random() * 50) + 1]))
  );
  const [search, setSearch] = useState('');

  const filtered = initialProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const lowStockCount = Object.values(stock).filter(q => q <= 5).length;

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Inventory" subtitle={`${lowStockCount > 0 ? `${lowStockCount} low stock` : 'All stocked'}`} />

      <div className="px-5 pt-4 pb-6 flex flex-col gap-4">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Products', value: initialProducts.length, color: 'text-primary bg-primary/10' },
            { label: 'Low Stock', value: lowStockCount, color: 'text-amber-600 bg-amber-50' },
            { label: 'Out of Stock', value: Object.values(stock).filter(q => q === 0).length, color: 'text-destructive bg-destructive/10' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border/40 rounded-2xl p-3 shadow-card text-center">
              <p className={`text-lg font-bold font-condensed ${stat.color.split(' ')[0]}`}>{stat.value}</p>
              <p className="text-[9px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full bg-card border border-border rounded-xl pl-8 pr-3 py-2 text-[11px] text-foreground outline-none focus:border-primary/50 shadow-card" />
        </div>

        {/* Product stock list */}
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
          {filtered.map((p, i) => {
            const qty = stock[p.id] ?? 0;
            const isLow = qty > 0 && qty <= 5;
            const isOut = qty === 0;
            return (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 px-4 py-3 ${i < filtered.length - 1 ? 'border-b border-border/40' : ''}`}>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground line-clamp-1">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isOut && <span className="text-[9px] font-bold text-destructive flex items-center gap-0.5"><AlertTriangle size={9} /> Out of stock</span>}
                    {isLow && !isOut && <span className="text-[9px] font-bold text-amber-600 flex items-center gap-0.5"><AlertTriangle size={9} /> Low stock</span>}
                    {!isLow && !isOut && <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Package size={9} /> In stock</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setStock(s => ({ ...s, [p.id]: Math.max(0, (s[p.id] ?? 0) - 1) }))}
                    className="w-6 h-6 rounded-lg bg-muted text-foreground flex items-center justify-center text-sm font-bold">−</button>
                  <span className={`text-[12px] font-bold w-7 text-center ${isOut ? 'text-destructive' : isLow ? 'text-amber-600' : 'text-foreground'}`}>{qty}</span>
                  <button onClick={() => setStock(s => ({ ...s, [p.id]: (s[p.id] ?? 0) + 1 }))}
                    className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">+</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
