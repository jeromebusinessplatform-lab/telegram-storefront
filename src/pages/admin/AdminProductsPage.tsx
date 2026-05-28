import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ImageUploadInput from '@/components/common/ImageUploadInput';
import { Bold, Italic, List, ListOrdered, Plus, Pencil, Trash2, Package, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { renderRichTextMarkdown } from '@/lib/rich-text';

const EMPTY_PRODUCT = {
  name: '', sub_name: '', description: '', price: '', stock: '',
  category_id: '', is_active: true, show_stock: false, images: [] as string[], sort_order: 0,
};

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('sort_order').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setProducts((prods as unknown as Product[]) ?? []);
    setCategories((cats as Category[]) ?? []);
    setIsLoading(false);
  };

  const openAdd = () => { setEditProduct(null); setForm(EMPTY_PRODUCT); setShowForm(true); };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name, sub_name: p.sub_name ?? '', description: p.description ?? '',
      price: String(p.price), stock: String(p.stock), category_id: p.category_id ?? '',
      is_active: p.is_active, show_stock: p.show_stock ?? false,
      images: p.images ?? [], sort_order: p.sort_order,
    });
    setShowForm(true);
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setIsAddingCat(true);
    const { data } = await supabase.from('categories').insert({ name: newCatName.trim(), sort_order: categories.length }).select().maybeSingle();
    if (data) {
      const newCat = data as Category;
      setCategories(c => [...c, newCat]);
      setForm(p => ({ ...p, category_id: newCat.id }));
      toast({ description: `Category "${newCat.name}" added!` });
    }
    setNewCatName(''); setShowAddCat(false); setIsAddingCat(false);
  };

  const addImage = (url: string) => {
    if (url && !form.images.includes(url)) setForm(p => ({ ...p, images: [...p.images, url] }));
  };

  const removeImage = (idx: number) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  const insertDescriptionText = (snippet: string) => {
    const textarea = descriptionRef.current;
    setForm(p => {
      const current = p.description ?? '';
      if (!textarea) return { ...p, description: current ? `${current}\n${snippet}` : snippet };

      const start = textarea.selectionStart ?? current.length;
      const end = textarea.selectionEnd ?? current.length;
      const next = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
      requestAnimationFrame(() => {
        const pos = start + snippet.length;
        textarea.focus();
        textarea.setSelectionRange(pos, pos);
      });
      return { ...p, description: next };
    });
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) {
      toast({ description: 'Name and price are required', variant: 'destructive' }); return;
    }
    setIsSaving(true);
    const payload = {
      name: form.name.trim(),
      sub_name: form.sub_name.trim() || null,
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      category_id: form.category_id || null,
      is_active: form.is_active,
      show_stock: form.show_stock,
      images: form.images,
      variants: [],
      sort_order: form.sort_order,
    };
    try {
      if (editProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id);
        if (error) throw error;
        toast({ description: 'Product updated!' });
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast({ description: 'Product added!' });
      }
      await fetchAll(); setShowForm(false);
    } catch (err) {
      toast({ description: `Failed: ${(err as { message?: string })?.message ?? 'Unknown error'}`, variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const deleteProduct = async () => {
    if (!deleteId) return;
    await supabase.from('products').delete().eq('id', deleteId);
    setProducts(p => p.filter(pr => pr.id !== deleteId));
    setDeleteId(null);
    toast({ description: 'Product deleted' });
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const displayCategories = categories.filter(c => c.name !== 'All');

  return (
    <AdminLayout title="Products">
      <div className="flex items-center gap-3 mb-4">
        <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-sm flex-1" />
        <Button size="sm" onClick={openAdd} className="btn-gradient gap-1.5 flex-shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({length:4}).map((_,i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(prod => (
            <div key={prod.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3 shadow-brand-sm">
              <img src={prod.images?.[0] || '/placeholder.svg'} alt={prod.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-muted" onError={e=>{(e.target as HTMLImageElement).src='/placeholder.svg';}} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground line-clamp-1">{prod.name}{prod.sub_name ? <span className="text-muted-foreground font-normal"> · {prod.sub_name}</span> : null}</p>
                <p className="text-xs text-primary font-bold">₱{prod.price.toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${prod.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{prod.is_active ? 'Active' : 'Hidden'}</span>
                  <span className="text-[10px] text-muted-foreground">Stock: {prod.stock}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => openEdit(prod)} className="w-7 h-7 p-0 hover:bg-primary-light hover:text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(prod.id)} className="w-7 h-7 p-0 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editProduct ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
          <div className="space-y-4">

            {/* ── Category (first) ── */}
            <div>
              <Label className="text-xs">Category</Label>
              <div className="flex gap-2 mt-1">
                <Select value={form.category_id || 'none'} onValueChange={v => { if (v === '__add__') { setShowAddCat(true); } else { setForm(p => ({ ...p, category_id: v === 'none' ? '' : v })); } }}>
                  <SelectTrigger className="h-8 text-sm flex-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {displayCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    <SelectItem value="__add__" className="text-primary font-semibold">+ Add new category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showAddCat && (
                <div className="flex gap-2 mt-2">
                  <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name" className="h-7 text-xs flex-1" onKeyDown={e => e.key === 'Enter' && addCategory()} autoFocus />
                  <Button size="sm" onClick={addCategory} disabled={isAddingCat} className="h-7 text-xs px-2 btn-gradient">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAddCat(false); setNewCatName(''); }} className="h-7 text-xs px-2">Cancel</Button>
                </div>
              )}
            </div>

            {/* ── Name + Sub-name ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Product Name *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Product name" className="mt-1 h-8 text-sm" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Sub-name <span className="text-muted-foreground">(optional — shown next to product name)</span></Label>
                <Input value={form.sub_name} onChange={e => setForm(p => ({ ...p, sub_name: e.target.value }))} placeholder="e.g. Original Formula, 500ml, Red" className="mt-1 h-8 text-sm" />
              </div>
            </div>

            {/* ── Price + Stock ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Price (₱) *</Label>
                <Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Stock</Label>
                <Input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="0" className="mt-1 h-8 text-sm" />
              </div>
            </div>

            {/* ── Show Stock Toggle ── */}
            <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                {form.show_stock ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                <Label className="text-xs cursor-pointer">Show remaining stock to customers</Label>
              </div>
              <Switch checked={form.show_stock} onCheckedChange={v => setForm(p => ({ ...p, show_stock: v }))} />
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <div className="mt-1 mb-2 flex flex-wrap gap-1.5">
                <Button type="button" size="sm" variant="outline" onClick={() => insertDescriptionText('- Bullet item')} className="h-8 gap-1.5 text-xs">
                  <List className="w-3.5 h-3.5" /> Bullet
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => insertDescriptionText('1. Numbered item')} className="h-8 gap-1.5 text-xs">
                  <ListOrdered className="w-3.5 h-3.5" /> Number
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => insertDescriptionText('**Bold text**')} className="h-8 gap-1.5 text-xs">
                  <Bold className="w-3.5 h-3.5" /> Bold
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => insertDescriptionText('*Italic text*')} className="h-8 gap-1.5 text-xs">
                  <Italic className="w-3.5 h-3.5" /> Italic
                </Button>
              </div>
              <Textarea
                ref={descriptionRef}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Product description..."
                className="mt-1 text-sm h-24 resize-none"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Use markdown lines for bullets, dashes, and numbered lists.</p>
              {form.description && (
                <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</div>
                  <div
                    className="product-description-copy"
                    dangerouslySetInnerHTML={{ __html: renderRichTextMarkdown(form.description) }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 h-8 text-sm" />
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                  <Label className="text-xs cursor-pointer">Active in store</Label>
                </div>
              </div>
            </div>

            {/* ── Images ── */}
            <div>
              <Label className="text-xs mb-2 block">Product Images</Label>
              {form.images.map((img, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0" onError={e=>{(e.target as HTMLImageElement).src='/placeholder.svg';}} />
                  <span className="text-xs text-muted-foreground flex-1 truncate">{img.slice(0, 40)}...</span>
                  <button onClick={() => removeImage(i)} className="text-destructive"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <ImageUploadInput value="" onChange={addImage} label="Add Image" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={save} disabled={isSaving} className="flex-1 btn-gradient">
                {isSaving ? 'Saving...' : editProduct ? 'Update' : 'Add Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
