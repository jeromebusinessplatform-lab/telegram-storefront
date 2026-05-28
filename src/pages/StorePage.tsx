import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ProductGrid from '@/components/products/ProductGrid';
import AnnouncementBanner from '@/components/products/AnnouncementBanner';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category, AnnouncementConfig } from '@/types';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function StorePage() {
  const { customer } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcement, setAnnouncement] = useState<AnnouncementConfig | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const showAnnouncementBanner = Boolean(announcement && (announcement.enabled || announcement.auto_publish));

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      setCategories(data as Category[] ?? []);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'announcement_config').maybeSingle();
      if (data?.value) {
        setAnnouncement(data.value as AnnouncementConfig);
      }
    };
    fetchAnnouncement();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
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
      setProducts((data as unknown as Product[]) ?? []);
      setIsLoading(false);
    };
    fetchProducts();
  }, [activeCategory, search]);

  return (
    <AppLayout>
      <div className="pb-2">
        {showAnnouncementBanner && <AnnouncementBanner announcement={announcement!} fixed />}

        {/* Welcome banner */}
        {customer && (
          <div className="px-3 pt-3 pb-0">
            <div className="bg-gradient-card rounded-xl p-3 border border-primary/10">
              <p className="text-xs text-muted-foreground">Welcome back,</p>
              <p className="font-bold text-sm text-foreground">{customer.telegram_first_name ?? 'Customer'} 👋</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-9 text-sm bg-muted/50 border-border focus:border-primary"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-primary/10'
            }`}
          >
            All
          </button>
          {categories.filter(c => c.name !== 'All').map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <ProductGrid products={products} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
