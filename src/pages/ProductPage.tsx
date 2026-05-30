import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { useState } from 'react';
import { getById } from '@/data/products';
import { useCart } from '@/context/CartContext';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = getById(id ?? '');
  const { addItem, updateQty, removeItem, getItemQty } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const qty = getItemQty(id ?? '');

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Product not found
      </div>
    );
  }

  const handleAdd = () => {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleDecrease = () => {
    if (qty === 1) removeItem(product.id);
    else updateQty(product.id, qty - 1);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Image */}
      <div className="relative">
        <div className="aspect-square bg-muted overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-card border border-border/60"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>

        {/* Badges */}
        <div className="absolute top-4 right-4 flex gap-1.5">
          {product.badge && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              product.badge === 'Sale' ? 'bg-destructive text-destructive-foreground' :
              product.badge === 'New' ? 'bg-primary text-primary-foreground' :
              'bg-foreground text-background'
            }`}>
              {product.badge}
            </span>
          )}
          {discount && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-destructive/90 text-destructive-foreground">
              -{discount}%
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 px-4 pt-5 pb-6"
      >
        {/* Category & Name */}
        <p className="text-xs font-semibold text-primary capitalize tracking-wide uppercase mb-1">
          {product.category}
        </p>
        <h1 className="text-2xl font-bold text-foreground leading-tight">{product.name}</h1>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={13}
                className={i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted'}
              />
            ))}
          </div>
          <span className="text-sm font-semibold">{product.rating}</span>
          <span className="text-sm text-muted-foreground">({product.reviews.toLocaleString()} reviews)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-2xl font-bold text-foreground">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-base text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">{product.description}</p>

        {/* Specs */}
        {product.specs && (
          <div className="mt-4">
            <h3 className="text-sm font-bold text-foreground mb-2">Highlights</h3>
            <div className="flex flex-wrap gap-2">
              {product.specs.map((spec) => (
                <span
                  key={spec}
                  className="text-xs font-medium px-3 py-1.5 bg-accent text-accent-foreground rounded-full border border-primary/20"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6">
          {qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              className={`w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                justAdded
                  ? 'bg-success text-success-foreground'
                  : 'bg-primary text-primary-foreground shadow-elevated'
              }`}
            >
              {justAdded ? (
                <>
                  <Check size={18} strokeWidth={2.5} />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  Add to Cart
                </>
              )}
            </motion.button>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 bg-card border border-border rounded-2xl px-1 py-1">
                <button
                  onClick={handleDecrease}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground"
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>
                <span className="text-lg font-bold w-6 text-center">{qty}</span>
                <button
                  onClick={() => updateQty(product.id, qty + 1)}
                  className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/cart')}
                className="flex-1 ml-3 py-4 rounded-2xl font-semibold text-sm bg-primary text-primary-foreground flex items-center justify-center gap-2 shadow-elevated"
              >
                <ShoppingCart size={18} />
                View Cart
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
