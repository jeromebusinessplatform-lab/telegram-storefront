import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, PackageCheck, XCircle, WrenchIcon, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useStoreStatus } from '@/context/StoreStatusContext';
import { fmtPrice } from '@/utils/format';

export default function CartPage() {
  const { items, totalPrice, totalItems, updateQty, removeItem, placeOrder, clearCart } = useCart();
  const { status, statusMessage } = useStoreStatus();
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const canOrder = status === 'open' || status === 'limited';

  const STATUS_BANNERS = {
    closed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', msg: 'Store is currently closed. Orders cannot be placed at this time.' },
    maintenance: { icon: WrenchIcon, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300', msg: 'System maintenance in progress. All transactions are temporarily disabled.' },
    limited: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-300', msg: 'Limited operation mode. You can still place orders but delays are expected.' },
  };

  const handleOrder = () => {
    if (!canOrder) return;
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

      {/* Store status banner */}
      {status !== 'open' && STATUS_BANNERS[status as keyof typeof STATUS_BANNERS] && (() => {
        const b = STATUS_BANNERS[status as keyof typeof STATUS_BANNERS];
        const BIcon = b.icon;
        return (
          <div className={`mx-4 mt-3 mb-1 rounded-2xl border px-4 py-3 flex items-start gap-3 ${b.bg}`}>
            <BIcon size={16} className={`${b.color} flex-shrink-0 mt-0.5`} />
            <p className={`text-[11px] font-medium ${b.color} leading-snug`}>{b.msg}</p>
          </div>
        );
      })()}

      {/* Items */}
      <div className="flex-1 px-4 pt-3 flex flex-col gap-3">
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
                <p className="text-sm font-bold text-primary mt-1">₱{fmtPrice(item.product.price)}</p>
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
            <span>₱{fmtPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Shipping</span>
            <span className="text-success font-medium">Free</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
            <span>Total</span>
            <span>₱{fmtPrice(totalPrice)}</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: canOrder ? 0.97 : 1 }}
          onClick={handleOrder}
          disabled={ordering || !canOrder}
          className={`w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-elevated transition-all ${
            canOrder
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          } disabled:opacity-70`}
        >
          {ordering ? (
            <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
          ) : !canOrder ? (
            <>
              {status === 'maintenance' ? <WrenchIcon size={16} /> : <XCircle size={16} />}
              {status === 'maintenance' ? 'System Unavailable' : 'Store is Closed'}
            </>
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
