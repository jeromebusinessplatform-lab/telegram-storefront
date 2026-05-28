import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data } = await supabase.from('products').select('*, categories(name)').eq('id', id).maybeSingle();
      setProduct(data as unknown as Product);
      setIsLoading(false);
    };
    fetch();
  }, [id]);

  if (isLoading) {
    return (
      <AppLayout showBack title="Product">
        <div className="p-3 space-y-3">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout showBack title="Product">
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground text-sm">Product not found</p>
        </div>
      </AppLayout>
    );
  }

  const images = product.images?.length ? product.images : ['/placeholder.svg'];

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      sub_name: product.sub_name,
      product_image: images[0],
      price: product.price,
      quantity,
    });
    toast({ description: `Added ${quantity}x ${product.name} to cart!` });
    navigate(-1);
  };

  return (
    <AppLayout showBack title={product.name}>
      <div>
        <div>
          {/* Images */}
          <div className="relative aspect-square bg-muted">
            <img
              src={images[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage(p => (p - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveImage(p => (p + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeImage ? 'bg-primary' : 'bg-white/60'}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Name & Price */}
            <div>
              <h1 className="font-bold text-lg text-foreground leading-tight">{product.name}</h1>
              {product.sub_name && (
                <p className="text-sm text-muted-foreground mt-0.5">{product.sub_name}</p>
              )}
              {product.categories && (
                <span className="text-[11px] text-primary font-semibold bg-primary-light px-2 py-0.5 rounded-full inline-block mt-1">
                  {(product.categories as {name: string}).name}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-primary">₱{product.price.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">
                {product.stock === 0
                  ? 'Out of stock'
                  : product.show_stock
                    ? `${product.stock} in stock`
                    : 'In stock'}
              </span>
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-foreground">Quantity</span>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-7 h-7 rounded-md bg-background flex items-center justify-center shadow-brand-sm">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock > 0 ? product.stock : 99, q + 1))} className="w-7 h-7 rounded-md bg-background flex items-center justify-center shadow-brand-sm">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add to Cart CTA */}
        <div className="sticky bottom-0 p-4 border-t border-border bg-background shadow-brand-lg">
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full h-12 btn-gradient text-sm font-bold gap-2 rounded-xl"
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock === 0 ? 'Out of Stock' : `Add to Cart — ₱${(product.price * quantity).toFixed(2)}`}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
