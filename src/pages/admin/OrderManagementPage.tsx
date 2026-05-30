import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Package, Clock, Truck, CheckCircle, X } from 'lucide-react';
import AdminSubHeader from '@/components/admin/AdminSubHeader';
import { useCart } from '@/context/CartContext';
import type { Order } from '@/context/CartContext';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered'] as const;
const STATUS_STYLES = {
  pending:    { label: 'Pending',    color: 'text-amber-600 bg-amber-50',    icon: Clock },
  processing: { label: 'Processing', color: 'text-primary bg-primary/10',    icon: Package },
  shipped:    { label: 'Shipped',    color: 'text-sky-500 bg-sky-50',         icon: Truck },
  delivered:  { label: 'Delivered',  color: 'text-success bg-success/10',    icon: CheckCircle },
};

function OrderDetailSheet({ order, onClose }: { order: Order; onClose: () => void }) {
  const s = STATUS_STYLES[order.status];
  const SIcon = s.icon;
  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-elevated max-h-[80vh] overflow-y-auto pb-8">
      <div className="sticky top-0 bg-card px-5 py-4 flex items-center justify-between border-b border-border">
        <div>
          <p className="text-[10px] text-muted-foreground">Order ID</p>
          <p className="text-sm font-bold text-foreground">{order.id}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <X size={15} />
        </button>
      </div>
      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full ${s.color}`}>
            <SIcon size={12} /> {s.label}
          </span>
          <span className="text-[11px] text-muted-foreground">{new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        <div className="flex flex-col gap-2">
          {order.items.map(item => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground line-clamp-1">{item.product.name}</p>
                <p className="text-[10px] text-muted-foreground">×{item.quantity} · ${item.product.price.toFixed(2)}</p>
              </div>
              <p className="text-[11px] font-bold text-foreground">${(item.product.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3 flex justify-between">
          <span className="text-xs font-semibold text-foreground">Total</span>
          <span className="text-sm font-bold text-primary">${order.total.toFixed(2)}</span>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map(s => {
              const cfg = STATUS_STYLES[s];
              const Icon = cfg.icon;
              return (
                <button key={s} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-semibold border transition-all ${order.status === s ? cfg.color + ' border-transparent' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                  <Icon size={12} /> {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function OrderManagementPage() {
  const { orders } = useCart();
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Order Management" subtitle={`${orders.length} total orders`} />

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-5 pt-4 pb-2 overflow-x-auto">
        {['all', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-5 flex flex-col gap-2.5 pb-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Package size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground">No orders</p>
          </div>
        ) : (
          filtered.map((order, i) => {
            const s = STATUS_STYLES[order.status];
            const SIcon = s.icon;
            return (
              <motion.button key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(order)}
                className="w-full bg-card border border-border/40 rounded-2xl p-4 shadow-card flex items-center gap-3 text-left">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <SIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-foreground">{order.id}</p>
                  <p className="text-[10px] text-muted-foreground">{order.items.length} item(s) · {new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-bold text-foreground">${order.total.toFixed(2)}</p>
                  <ChevronRight size={14} className="text-muted-foreground ml-auto mt-0.5" />
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/30 z-40" onClick={() => setSelected(null)} />
            <OrderDetailSheet order={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
