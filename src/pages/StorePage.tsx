import { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import type { AnnouncementConfig, Category, Product } from '@/types';

type ProductRow = Product & {
  categories?: {
    name?: string | null;
  } | null;
};

export default function StorePage() {
  const navigate = useNavigate();
  const { customer, isLoading: isAuthLoading } = useAuth();
  const { addItem, totalItems } = useCart();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcement, setAnnouncement] = useState<AnnouncementConfig | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      setCategories((data as Category[] | null) ?? []);
    };
    void loadCategories();
  }, []);

  useEffect(() => {
    const loadAnnouncement = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'announcement_config')
        .maybeSingle();
      if (data?.value) {
        setAnnouncement(data.value as AnnouncementConfig);
      }
    };
    void loadAnnouncement();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order('sort_order')
        .order('created_at', { ascending: false });

      if (activeCategory !== 'all') {
        query = query.eq('category_id', activeCategory);
      }

      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data } = await query;
      setProducts((data as ProductRow[] | null) ?? []);
      setIsLoading(false);
    };
    void loadProducts();
  }, [activeCategory, search]);

  useEffect(() => {
    if (!isAuthLoading && Capacitor.isNativePlatform() && !customer) {
      navigate('/mobile-auth', { replace: true });
    }
  }, [customer, isAuthLoading, navigate]);

  const visibleAnnouncement = useMemo(() => {
    if (!announcement) return null;
    const publishAt = announcement.publish_at ? new Date(announcement.publish_at).getTime() : null;
    const takedownAt = announcement.takedown_at ? new Date(announcement.takedown_at).getTime() : null;
    const now = Date.now();
    const scheduledVisible =
      (!announcement.auto_publish || !publishAt || now >= publishAt) &&
      (!announcement.auto_takedown || !takedownAt || now <= takedownAt);
    const manualVisible = Boolean(announcement.enabled);
    return (manualVisible || Boolean(announcement.auto_publish)) && scheduledVisible
      ? announcement
      : null;
  }, [announcement]);

  const addProduct = (product: ProductRow) => {
    const image = product.images?.[0] ?? '/placeholder.svg';
    addItem({
      product_id: product.id,
      product_name: product.name,
      sub_name: product.sub_name,
      product_image: image,
      price: product.price,
      quantity: 1,
    });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
            PC
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black tracking-wide">PRIME CORE STORE</div>
            <div className="text-[11px] text-muted-foreground">
              {customer ? `Welcome back, ${customer.telegram_first_name ?? 'Customer'}` : 'Telegram Mini App storefront'}
            </div>
          </div>
          <a
            href="/cart"
            className="inline-flex items-center rounded-xl border border-border px-3 py-2 text-sm font-semibold"
          >
            Cart {totalItems > 0 ? `(${totalItems})` : ''}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4">
        {visibleAnnouncement && (
          <section className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Announcement</p>
            {visibleAnnouncement.title && <h1 className="mt-1 text-lg font-black">{visibleAnnouncement.title}</h1>}
            {visibleAnnouncement.body_markdown && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {visibleAnnouncement.body_markdown}
              </p>
            )}
          </section>
        )}

        <section className="mb-4 rounded-2xl border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr] md:items-center">
            <div>
              <h2 className="text-xl font-black">Shop now</h2>
              <p className="text-sm text-muted-foreground">
                Browse products, add items to cart, and continue checkout from Telegram.
              </p>
            </div>
            <label className="grid gap-1 text-sm font-semibold">
              Search products
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a product name"
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none"
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              All
            </button>
            {categories
              .filter((category) => category.name !== 'All')
              .map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    activeCategory === category.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {category.name}
                </button>
              ))}
          </div>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center">
            <p className="text-base font-bold">No products available</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const image = product.images?.[0] ?? '/placeholder.svg';
              return (
                <article key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <a href={`/product/${product.id}`} className="block">
                    <div className="aspect-square bg-muted">
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          (event.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  </a>
                  <div className="space-y-2 p-3">
                    <div>
                      <a href={`/product/${product.id}`} className="block text-sm font-bold leading-tight">
                        {product.name}
                      </a>
                      {product.sub_name && <p className="text-[11px] text-muted-foreground">{product.sub_name}</p>}
                      {product.categories?.name && (
                        <p className="text-[11px] text-muted-foreground">{product.categories.name}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-primary">₱{product.price.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => addProduct(product)}
                        disabled={product.stock === 0}
                        className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {product.stock === 0 ? 'Sold out' : 'Add'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
