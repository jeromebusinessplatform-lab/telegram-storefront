import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, totalPrice, totalItems, updateQty, removeItem, placeOrder, clearCart } = useCart();
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const handleOrder = () => {
    setOrdering(true);
    setTimeout(() => {
      placeOrder();
      setOrdering(false);
      setOrdered(true);
      setTimeout(() => {
        setOrdered(false);
        navigate('/orders');
      }, 1800);
    }, 1000);
  };

  if (ordered) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center"
        >
          <PackageCheck size={36} className="text-success" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-xl font-bold text-foreground">Order Placed!</p>
          <p className="text-sm text-muted-foreground mt-1">Redirecting to your orders...</p>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <ShoppingCart size={32} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">Your cart is empty</p>
          <p className="text-sm text-muted-foreground mt-1">Add some items to get started</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold shadow-elevated"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Cart</h1>
          <button
            onClick={clearCart}
            className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5 font-medium"
          >
            Clear all
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
      </div>

      {/* Items */}
      <div className="flex-1 px-4 flex flex-col gap-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl border border-border/40 p-3 flex gap-3 shadow-card"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                  {item.product.name}
                </h3>
                <p className="text-sm font-bold text-primary mt-1">${item.product.price.toFixed(2)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 bg-muted rounded-xl p-0.5">
                    <button
                      onClick={() => updateQty(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-card flex items-center justify-center shadow-sm"
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary & CTA */}
      <div className="px-4 pb-4 mt-4">
        <div className="bg-card border border-border/40 rounded-2xl p-4 mb-3 shadow-card">
          <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Shipping</span>
            <span className="text-success font-medium">Free</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleOrder}
          disabled={ordering}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-elevated disabled:opacity-70"
        >
          {ordering ? (
            <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
          ) : (
            <>
              Place Order
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
