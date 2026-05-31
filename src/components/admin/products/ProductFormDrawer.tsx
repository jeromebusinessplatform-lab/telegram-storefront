import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Upload, Link, ChevronDown, Package, Check, Eye, EyeOff, Bold, Italic, List, ListOrdered } from 'lucide-react';
import { toast } from 'sonner';
import type { Product, Category, Variant, Bundle, BundleItem } from '@/data/products';
import { renderRichTextMarkdown } from '@/utils/richText';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product;
  categories: Category[];
  allProducts: Product[];
  onSave: (data: Omit<Product, 'id' | 'rating' | 'reviews'>, id?: string) => void;
  onAddCategory: (name: string) => void;
}

const TABS = ['Basic Info', 'Variants', 'Promotions'] as const;
type Tab = typeof TABS[number];

function newVariant(): Variant {
  return { id: Date.now().toString(), name: '', price: 0, costing: 0, stock: 0 };
}
function newBundleItem(productId = ''): BundleItem {
  return { id: Date.now().toString(), productId, discountType: 'percentage', discountValue: 10 };
}
function emptyBundle(): Bundle {
  return { id: Date.now().toString(), enabled: false, items: [], useGlobalPrice: false, globalPrice: 0 };
}

const INPUT_CLS = 'w-full bg-muted rounded-xl px-3 py-2.5 text-[11px] text-foreground outline-none border border-border/40 focus:ring-1 focus:ring-primary/30';

export default function ProductFormDrawer({
  open, onClose, product, categories, allProducts, onSave, onAddCategory,
}: Props) {
  const isEdit = Boolean(product);
  const fileRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [tab, setTab]                 = useState<Tab>('Basic Info');
  const [name, setName]               = useState(product?.name ?? '');
  const [subName, setSubName]         = useState(product?.subName ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice]             = useState(String(product?.price ?? ''));
  const [originalPrice, setOriginalPrice] = useState(String(product?.originalPrice ?? ''));
  const [costing, setCosting]         = useState(String(product?.costing ?? ''));
  const [stock, setStock]             = useState(String(product?.stock ?? ''));
  const [category, setCategory]       = useState(product?.category ?? (categories.find(c => c.id !== 'all')?.id ?? ''));
  const [image, setImage]             = useState(product?.image ?? '');
  const [imageMode, setImageMode]     = useState<'url' | 'upload'>('url');
  const [badge, setBadge]             = useState<string | undefined>(product?.badge);
  const [variants, setVariants]       = useState<Variant[]>(product?.variants ?? []);
  const [bundle, setBundle]           = useState<Bundle>(product?.bundle ?? emptyBundle());
  const [showStock, setShowStock]     = useState<boolean>(product?.showStock ?? false);

  // Inline add-category flow
  const [addingCat, setAddingCat]     = useState(false);
  const [newCatName, setNewCatName]   = useState('');

  const shopCategories = categories.filter(c => c.id !== 'all');
  const otherProducts  = allProducts.filter(p => p.id !== product?.id);
  const isSaleBadge    = badge === 'Sale';

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCategoryChange = (val: string) => {
    if (val === '__add__') { setAddingCat(true); return; }
    setCategory(val);
  };

  const confirmAddCat = () => {
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    const newId = newCatName.trim().toLowerCase().replace(/\s+/g, '-');
    setCategory(newId);
    setNewCatName('');
    setAddingCat(false);
    toast.success(`Category "${newCatName.trim()}" added`);
  };

  const insertDescriptionText = (snippet: string) => {
    const textarea = descriptionRef.current;
    setDescription(current => {
      if (!textarea) return current ? `${current}\n${snippet}` : snippet;
      const start = textarea.selectionStart ?? current.length;
      const end   = textarea.selectionEnd   ?? current.length;
      const next  = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
      requestAnimationFrame(() => {
        const pos = start + snippet.length;
        textarea.focus();
        textarea.setSelectionRange(pos, pos);
      });
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim())                      { toast.error('Product name is required'); return; }
    if (!price || isNaN(Number(price)))    { toast.error('Valid price is required');  return; }
    if (!category)                         { toast.error('Category is required');     return; }

    const data: Omit<Product, 'id' | 'rating' | 'reviews'> = {
      name:          name.trim(),
      subName:       subName.trim() || undefined,
      description:   description.trim(),
      price:         Number(price),
      originalPrice: isSaleBadge && originalPrice ? Number(originalPrice) : undefined,
      costing:       Number(costing) || 0,
      stock:         Number(stock)   || 0,
      showStock,
      category,
      image:   image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop',
      inStock: Number(stock) > 0,
      badge:   badge || undefined,
      variants,
      bundle:  bundle.enabled ? bundle : null,
      specs:   [],
    };
    onSave(data, product?.id);
    onClose();
    toast.success(isEdit ? 'Product updated' : 'Product added');
  };

  /* ── Variants helpers ── */
  const addVariant    = () => setVariants(v => [...v, newVariant()]);
  const updateVariant = (id: string, key: keyof Variant, val: string | number) =>
    setVariants(v => v.map(vr => vr.id === id ? { ...vr, [key]: val } : vr));
  const removeVariant = (id: string) => setVariants(v => v.filter(vr => vr.id !== id));

  /* ── Bundle helpers ── */
  const addBundleItem    = () => setBundle(b => ({ ...b, items: [...b.items, newBundleItem(otherProducts[0]?.id ?? '')] }));
  const updateBundleItem = (id: string, key: keyof BundleItem, val: string | number) =>
    setBundle(b => ({ ...b, items: b.items.map(i => i.id === id ? { ...i, [key]: val } : i) }));
  const removeBundleItem = (id: string) =>
    setBundle(b => ({ ...b, items: b.items.filter(i => i.id !== id) }));

  /* ── Toggle helper ── */
  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle}
      className="flex-shrink-0 rounded-full relative transition-colors"
      style={{ minWidth: 40, height: 22, background: on ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
      <motion.div animate={{ x: on ? 18 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-50 bg-black/40" />

          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: '92vh' }}>

            {/* Handle + Tabs */}
            <div className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 px-5">
              <div className="w-10 h-1 rounded-full bg-border mb-3" />
              <div className="w-full flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground font-condensed uppercase">
                  {isEdit ? 'Edit Product' : 'Add Product'}
                </h2>
                <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>
              <div className="flex gap-1 mt-3 w-full bg-muted rounded-xl p-1">
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-1">

              {/* ── Tab 1: Basic Info ── */}
              {tab === 'Basic Info' && (
                <div className="flex flex-col gap-4">

                  {/* Image */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Product Image</label>
                    {image && (
                      <div className="w-full h-32 rounded-2xl overflow-hidden bg-muted mb-2 border border-border/40">
                        <img src={image} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex gap-2 mb-2">
                      {(['url', 'upload'] as const).map(m => (
                        <button key={m} onClick={() => setImageMode(m)}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${imageMode === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/40'}`}>
                          {m === 'url' ? <><Link size={10} className="inline mr-1" />Image URL</> : <><Upload size={10} className="inline mr-1" />Upload File</>}
                        </button>
                      ))}
                    </div>
                    {imageMode === 'url'
                      ? <input value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." className={INPUT_CLS} />
                      : (
                        <>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                          <button onClick={() => fileRef.current?.click()}
                            className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-[11px] text-muted-foreground flex items-center justify-center gap-2">
                            <Upload size={13} /> Choose image file
                          </button>
                        </>
                      )}
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Product Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter product name..." className={INPUT_CLS} />
                  </div>

                  {/* Sub-Name */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Sub-Name <span className="normal-case font-normal">(visible to customers)</span></label>
                    <input value={subName} onChange={e => setSubName(e.target.value)} placeholder="e.g. 100ml · Floral Scent" className={INPUT_CLS} />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category *</label>
                    <div className="relative">
                      <select value={category} onChange={e => handleCategoryChange(e.target.value)}
                        className={`${INPUT_CLS} appearance-none pr-8`}>
                        {shopCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        <option value="__add__">+ Add Category…</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    {addingCat && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 flex gap-2 items-center">
                        <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category name"
                          autoFocus onKeyDown={e => { if (e.key === 'Enter') confirmAddCat(); if (e.key === 'Escape') setAddingCat(false); }}
                          className="flex-1 bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none border border-primary/50" />
                        <button onClick={confirmAddCat} className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                          <Check size={13} />
                        </button>
                        <button onClick={() => setAddingCat(false)} className="w-8 h-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                          <X size={13} />
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Description with rich-text toolbar */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
                    {/* Toolbar */}
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      {[
                        { icon: List,          label: 'Bullet',   snippet: '- Bullet item'     },
                        { icon: ListOrdered,   label: 'Number',   snippet: '1. Numbered item'  },
                        { icon: Bold,          label: 'Bold',     snippet: '**Bold text**'     },
                        { icon: Italic,        label: 'Italic',   snippet: '*Italic text*'     },
                      ].map(({ icon: Icon, label, snippet }) => (
                        <button key={label} type="button" onClick={() => insertDescriptionText(snippet)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted border border-border/40 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                          <Icon size={11} /> {label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      ref={descriptionRef}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Describe the product... Use - for bullets, 1. for numbered lists, **bold**, *italic*"
                      className="w-full bg-muted rounded-xl px-3 py-2.5 text-[11px] text-foreground outline-none resize-none border border-border/40 focus:ring-1 focus:ring-primary/30"
                    />
                    {/* Live preview */}
                    {description.trim() && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 rounded-xl border border-border/40 bg-muted/40 p-3 overflow-hidden">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Preview</p>
                        <div className="text-foreground [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-0.5 [&_p]:leading-relaxed [&_p]:text-[11px] [&_li]:text-[11px]"
                          dangerouslySetInnerHTML={{ __html: renderRichTextMarkdown(description) }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Badge Toggles */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 block">Product Badge</label>
                    <div className="flex gap-2">
                      {(['Sale', 'New', 'Best Seller'] as const).map(b => {
                        const isActive = badge === b;
                        const colors: Record<string, string> = {
                          'Sale':        isActive ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-card text-muted-foreground border-border/40',
                          'New':         isActive ? 'bg-primary text-primary-foreground border-primary'            : 'bg-card text-muted-foreground border-border/40',
                          'Best Seller': isActive ? 'bg-foreground text-background border-foreground'              : 'bg-card text-muted-foreground border-border/40',
                        };
                        return (
                          <button key={b} onClick={() => setBadge(isActive ? undefined : b)}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${colors[b]}`}>
                            {b}
                          </button>
                        );
                      })}
                    </div>
                    {badge && (
                      <button onClick={() => setBadge(undefined)} className="mt-1.5 text-[9px] text-muted-foreground underline w-full text-right">
                        Remove badge
                      </button>
                    )}
                  </div>

                  {/* Price Fields — adapts for Sale badge */}
                  {isSaleBadge ? (
                    <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-3">
                      <p className="text-[10px] font-bold text-destructive mb-2 uppercase tracking-wide">Sale Pricing</p>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">Original Price ₱</label>
                          <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="0.00" min="0"
                            className={INPUT_CLS} />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-destructive uppercase mb-1 block">Sale Price ₱ *</label>
                          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" min="0"
                            className={`${INPUT_CLS} border-destructive/30`} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Price ₱ *</label>
                        <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" min="0" className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Costing ₱</label>
                        <input type="number" value={costing} onChange={e => setCosting(e.target.value)} placeholder="0.00" min="0" className={INPUT_CLS} />
                      </div>
                    </div>
                  )}
                  {isSaleBadge && (
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Costing ₱</label>
                      <input type="number" value={costing} onChange={e => setCosting(e.target.value)} placeholder="0.00" min="0" className={INPUT_CLS} />
                    </div>
                  )}

                  {/* Stock */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Stock Quantity</label>
                    <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" min="0" className={INPUT_CLS} />
                  </div>

                  {/* Show stock to customers toggle */}
                  <button onClick={() => setShowStock(s => !s)}
                    className="w-full flex items-center justify-between bg-muted rounded-xl px-3 py-2.5 border border-border/40">
                    <div className="flex items-center gap-2">
                      {showStock
                        ? <Eye size={13} className="text-primary flex-shrink-0" />
                        : <EyeOff size={13} className="text-muted-foreground flex-shrink-0" />}
                      <span className="text-[11px] font-medium text-foreground">Show remaining stock to customers</span>
                    </div>
                    <Toggle on={showStock} onToggle={() => setShowStock(s => !s)} />
                  </button>
                </div>
              )}

              {/* ── Tab 2: Variants ── */}
              {tab === 'Variants' && (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] text-muted-foreground">Add product variants (e.g. sizes, colors). Each variant can have its own price and stock.</p>
                  {variants.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package size={28} className="text-muted-foreground/30 mb-2" />
                      <p className="text-[11px] text-muted-foreground">No variants yet</p>
                    </div>
                  )}
                  {variants.map((v, i) => (
                    <div key={v.id} className="bg-muted rounded-2xl p-3 border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Variant {i + 1}</span>
                        <button onClick={() => removeVariant(v.id)} className="w-6 h-6 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <input value={v.name} onChange={e => updateVariant(v.id, 'name', e.target.value)} placeholder="Variant name (e.g. Small, Red)"
                          className="w-full bg-card rounded-xl px-3 py-2 text-[11px] text-foreground outline-none border border-border/40 focus:ring-1 focus:ring-primary/30" />
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['price', 'costing', 'stock'] as const).map(k => (
                            <div key={k}>
                              <p className="text-[9px] text-muted-foreground mb-1 capitalize">{k === 'price' ? 'Price ₱' : k === 'costing' ? 'Costing ₱' : 'Stock'}</p>
                              <input type="number" value={v[k]} onChange={e => updateVariant(v.id, k, Number(e.target.value))} min="0"
                                className="w-full bg-card rounded-lg px-2 py-1.5 text-[11px] text-foreground outline-none border border-border/40" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addVariant} className="w-full py-2.5 border-2 border-dashed border-primary/30 rounded-2xl text-[11px] text-primary font-semibold flex items-center justify-center gap-1.5">
                    <Plus size={13} /> Add Variant
                  </button>
                </div>
              )}

              {/* ── Tab 3: Promotions ── */}
              {tab === 'Promotions' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-muted rounded-2xl px-4 py-3 border border-border/40">
                    <div>
                      <p className="text-[12px] font-bold text-foreground">Enable Bundle Promotion</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Combine products to offer bundle discounts</p>
                    </div>
                    <Toggle on={bundle.enabled} onToggle={() => setBundle(b => ({ ...b, enabled: !b.enabled }))} />
                  </div>

                  {bundle.enabled && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-col gap-3 overflow-hidden">
                      <div className="bg-card rounded-2xl border border-border/40 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-[11px] font-bold text-foreground">Global Bundle Price</p>
                            <p className="text-[9px] text-muted-foreground">Set one fixed price for the entire bundle</p>
                          </div>
                          <Toggle on={bundle.useGlobalPrice} onToggle={() => setBundle(b => ({ ...b, useGlobalPrice: !b.useGlobalPrice }))} />
                        </div>
                        {bundle.useGlobalPrice && (
                          <input type="number" value={bundle.globalPrice ?? ''} onChange={e => setBundle(b => ({ ...b, globalPrice: Number(e.target.value) }))}
                            placeholder="0.00" min="0" className={`${INPUT_CLS} mt-1`} />
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Bundled Products</p>
                        {bundle.items.length === 0 && <div className="text-center py-5 text-[11px] text-muted-foreground">No products added yet</div>}
                        {bundle.items.map((item, idx) => {
                          const selProd = allProducts.find(p => p.id === item.productId);
                          return (
                            <div key={item.id} className="bg-card rounded-2xl border border-border/40 p-3 mb-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Item {idx + 1}</span>
                                <button onClick={() => removeBundleItem(item.id)} className="w-6 h-6 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                              <div className="relative mb-2">
                                <select value={item.productId} onChange={e => updateBundleItem(item.id, 'productId', e.target.value)}
                                  className={`${INPUT_CLS} appearance-none pr-8`}>
                                  {otherProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  {otherProducts.length === 0 && <option value="">No other products</option>}
                                </select>
                                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              </div>
                              {!bundle.useGlobalPrice && (
                                <div>
                                  <div className="flex gap-1.5 mb-2">
                                    {(['fixed', 'percentage'] as const).map(dt => (
                                      <button key={dt} onClick={() => updateBundleItem(item.id, 'discountType', dt)}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${item.discountType === dt ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border/40'}`}>
                                        {dt === 'fixed' ? 'Fixed Price' : '% Off'}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-muted-foreground">{item.discountType === 'fixed' ? '₱' : '%'}</span>
                                    <input type="number" value={item.discountValue} onChange={e => updateBundleItem(item.id, 'discountValue', Number(e.target.value))}
                                      placeholder={item.discountType === 'fixed' ? 'Bundle price' : 'Discount %'} min="0"
                                      className="flex-1 bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none border border-border/40" />
                                    {selProd && (
                                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        → ₱{item.discountType === 'fixed'
                                          ? item.discountValue.toFixed(0)
                                          : (selProd.price * (1 - item.discountValue / 100)).toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <button onClick={addBundleItem} disabled={otherProducts.length === 0}
                          className="w-full py-2.5 border-2 border-dashed border-primary/30 rounded-2xl text-[11px] text-primary font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40">
                          <Plus size={13} /> Add Product to Bundle
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {!bundle.enabled && (
                    <p className="text-[11px] text-muted-foreground text-center py-4">
                      Enable the bundle toggle to configure "Buy More, Save More" promotions.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="px-5 pb-6 pt-3 flex-shrink-0 border-t border-border/40">
              <button onClick={handleSave} className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold shadow-elevated">
                {isEdit ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
