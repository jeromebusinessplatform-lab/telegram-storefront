import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Pencil, Trash2, AlertTriangle, Package, Tag, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import AdminSubHeader from '@/components/admin/AdminSubHeader';
import ProductFormDrawer from '@/components/admin/products/ProductFormDrawer';
import { useProducts } from '@/context/ProductContext';
import type { Product } from '@/data/products';

export default function InventoryPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory } = useProducts();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Category editing state
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  const shopCategories = categories.filter(c => c.id !== 'all');

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  const handleSave = (data: Omit<Product, 'id' | 'rating' | 'reviews'>, id?: string) => {
    if (id) {
      updateProduct(id, data);
    } else {
      addProduct(data);
    }
  };

  const handleEdit = (p: Product) => {
    setEditProduct(p);
    setDrawerOpen(true);
  };

  const handleAdd = () => {
    setEditProduct(undefined);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setConfirmDelete(null);
    toast.success('Product deleted');
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName('');
    setAddingCat(false);
    toast.success(`Category "${newCatName.trim()}" added`);
  };

  const handleSaveCategory = (id: string) => {
    if (!editCatName.trim()) return;
    updateCategory(id, editCatName.trim());
    setEditCatId(null);
    toast.success('Category updated');
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    toast.success('Category deleted');
    if (filterCat === id) setFilterCat('all');
  };

  const stockBadge = (p: Product) => {
    if (p.stock === 0) return <span className="text-[9px] font-bold text-destructive flex items-center gap-0.5"><AlertTriangle size={8} />Out</span>;
    if (p.stock <= 5) return <span className="text-[9px] font-bold text-amber-600 flex items-center gap-0.5"><AlertTriangle size={8} />{p.stock}</span>;
    return <span className="text-[9px] font-semibold text-success flex items-center gap-0.5"><Package size={8} />{p.stock}</span>;
  };

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Product Management" subtitle="Manage your catalog, categories & bundles" />

      <div className="px-4 pt-4 pb-24 flex flex-col gap-4">

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Products', value: products.length, color: 'text-primary' },
            { label: 'Categories', value: shopCategories.length, color: 'text-primary' },
            { label: 'Low Stock', value: lowStock, color: 'text-amber-600' },
            { label: 'Out of Stock', value: outOfStock, color: 'text-destructive' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border/40 rounded-2xl p-2.5 shadow-card text-center">
              <p className={`text-sm font-bold font-condensed ${s.color}`}>{s.value}</p>
              <p className="text-[8px] text-muted-foreground leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Category Manager ── */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Categories</p>
            <button onClick={() => setAddingCat(true)} className="flex items-center gap-1 text-[10px] font-semibold text-primary">
              <Plus size={11} /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {shopCategories.map(cat => (
              <div key={cat.id} className="flex items-center gap-1 bg-card border border-border/40 rounded-full px-2.5 py-1 shadow-card">
                {editCatId === cat.id ? (
                  <>
                    <input value={editCatName} onChange={e => setEditCatName(e.target.value)} autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveCategory(cat.id); if (e.key === 'Escape') setEditCatId(null); }}
                      className="text-[10px] text-foreground bg-transparent outline-none w-20 border-b border-primary" />
                    <button onClick={() => handleSaveCategory(cat.id)} className="text-success"><Check size={11} /></button>
                    <button onClick={() => setEditCatId(null)} className="text-muted-foreground"><X size={11} /></button>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-semibold text-foreground">{cat.name}</span>
                    <button onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); }} className="text-muted-foreground hover:text-foreground ml-0.5">
                      <Pencil size={9} />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-muted-foreground hover:text-destructive">
                      <X size={9} />
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* Add new category inline */}
            <AnimatePresence>
              {addingCat && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-2.5 py-1">
                  <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name" autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setAddingCat(false); }}
                    className="text-[10px] text-foreground bg-transparent outline-none w-24 placeholder:text-muted-foreground" />
                  <button onClick={handleAddCategory} className="text-primary"><Check size={11} /></button>
                  <button onClick={() => setAddingCat(false)} className="text-muted-foreground"><X size={11} /></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Search + Filter ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full bg-card border border-border/40 rounded-xl pl-8 pr-3 py-2 text-[11px] text-foreground outline-none focus:border-primary/50 shadow-card" />
          </div>
          <div className="relative">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="appearance-none bg-card border border-border/40 rounded-xl pl-2.5 pr-7 py-2 text-[11px] font-semibold text-foreground outline-none shadow-card">
              <option value="all">All</option>
              {shopCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* ── Product List ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package size={32} className="text-muted-foreground/20 mb-3" />
            <p className="text-sm font-semibold text-foreground">No products found</p>
            <p className="text-xs text-muted-foreground mt-1">Add a product or try a different search</p>
          </div>
        ) : (
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 px-3 py-2.5 ${i < filtered.length - 1 ? 'border-b border-border/40' : ''}`}>

                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/40">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-1">{p.name}</p>
                    {p.bundle?.enabled && (
                      <Tag size={9} className="text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[9px] text-muted-foreground">{categories.find(c => c.id === p.category)?.name ?? p.category}</span>
                    <span className="text-[10px] font-bold text-foreground">₱{p.price.toFixed(0)}</span>
                    {p.badge && (
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                        p.badge === 'Sale' ? 'bg-destructive/15 text-destructive' :
                        p.badge === 'New' ? 'bg-primary/15 text-primary' :
                        'bg-foreground/10 text-foreground'
                      }`}>{p.badge}</span>
                    )}
                  </div>
                </div>

                {/* Stock */}
                <div className="flex-shrink-0 w-10 text-right">
                  {stockBadge(p)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handleEdit(p)}
                    className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => setConfirmDelete(p.id)}
                    className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleAdd}
        className="fixed bottom-20 right-5 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center z-40">
        <Plus size={22} />
      </motion.button>

      {/* ── Delete confirmation ── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)} className="fixed inset-0 z-50 bg-black/40" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-4 right-4 bottom-1/3 z-50 bg-card rounded-2xl p-5 shadow-2xl border border-border/40">
              <p className="text-sm font-bold text-foreground mb-1">Delete Product?</p>
              <p className="text-[11px] text-muted-foreground mb-4">
                "{products.find(p => p.id === confirmDelete)?.name}" will be permanently removed.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-[12px] font-semibold text-muted-foreground">
                  Cancel
                </button>
                <button onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-[12px] font-semibold">
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Product Form Drawer ── */}
      <ProductFormDrawer
        key={editProduct?.id ?? 'new'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        product={editProduct}
        categories={categories}
        allProducts={products}
        onSave={handleSave}
      />
    </div>
  );
}
