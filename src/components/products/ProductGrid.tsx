import { Product } from '@/types';
import ProductCard from './ProductCard';
import { Package } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export default function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 p-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-border animate-pulse">
            <div className="aspect-square bg-muted" />
            <div className="p-2 space-y-1.5">
              <div className="h-2.5 bg-muted rounded w-4/5" />
              <div className="h-2.5 bg-muted rounded w-2/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <Package className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">No products available</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Check back later for new items</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 p-3">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
