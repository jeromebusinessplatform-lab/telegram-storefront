import { useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { formatMoney } from '@/lib/money';
interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();

  const image = product.images?.[0] ?? '/placeholder.svg';
  const isOnSale = product.is_on_sale && product.sale_price != null;
  const displayPrice = isOnSale ? product.sale_price : product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const effectivePrice = product.is_on_sale && product.sale_price != null ? product.sale_price : product.price;
    addItem({
      product_id: product.id,
      product_name: product.name,
      sub_name: product.sub_name,
      product_image: image,
      price: effectivePrice,
      quantity: 1,
    });
    toast({ description: `${product.name} added to cart!` });
  };

  return (
    <div
      className="product-tile bg-card rounded-xl overflow-hidden border border-border shadow-brand-sm cursor-pointer active:scale-95"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="aspect-square relative bg-muted overflow-hidden">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        {isOnSale && (
          <div className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-foreground shadow-brand-sm ring-1 ring-primary/20">
            On Sale
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
            <span className="bg-background text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-1 mb-0.5">
          {product.name}
        </p>
        {product.sub_name && (
          <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1 mb-1">{product.sub_name}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isOnSale ? (
                <>
                  <span className="text-[10px] text-muted-foreground line-through">{formatMoney(product.price)}</span>
                  <span className="text-xs font-black text-primary">{formatMoney(displayPrice ?? product.price)}</span>
                </>
              ) : (
                <span className="text-xs font-black text-primary">{formatMoney(displayPrice ?? product.price)}</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{product.stock} left</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform"
          >
            <ShoppingCart className="w-3 h-3 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
