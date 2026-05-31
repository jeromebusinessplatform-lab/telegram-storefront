import { motion } from 'framer-motion';
import { Package, ChevronRight, PackageCheck, Truck, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Order } from '@/context/CartContext';
import { useCart } from '@/context/CartContext';
const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50'
  },
  processing: {
    label: 'Processing',
    icon: Clock,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-success',
    bg: 'bg-success/10'
  }
};
function OrderCard({
  order
}: {
  order: Order;
}) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;
  const date = new Date(order.date);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const preview = order.items.slice(0, 3);
  return <motion.div initial={{
    opacity: 0,
    y: 8
  }} animate={{
    opacity: 1,
    y: 0
  }} className="bg-card rounded-2xl border border-border/40 shadow-card p-4">
      {/* Order header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{dateStr}</p>
          <p className="text-sm font-bold text-foreground">{order.id}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>

      {/* Product previews */}
      <div className="flex gap-2 mb-3">
        {preview.map(item => <div key={item.product.id} className="w-14 h-14 rounded-xl overflow-hidden bg-muted relative flex-shrink-0">
            <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
            {item.quantity > 1 && <span className="absolute bottom-0.5 right-0.5 bg-foreground/80 text-background text-[9px] font-bold rounded-md px-1">
                ×{item.quantity}
              </span>}
          </div>)}
        {order.items.length > 3 && <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            +{order.items.length - 3}
          </div>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
          <p className="text-sm font-bold text-foreground">₱{order.total.toFixed(2)}</p>
        </div>
        <button className="text-primary flex items-center gap-0.5 text-xs font-semibold">
          Details <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>;
}
export default function OrdersPage() {
  const {
    orders
  } = useCart();
  const navigate = useNavigate();
  return <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground">MY ORDERS</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? 's' : ''}` : 'No orders yet'}
        </p>
      </div>

      {orders.length === 0 ? <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center pb-16">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Package size={32} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your completed orders will appear here
            </p>
          </div>
          <button onClick={() => navigate('/')} className="mt-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold shadow-elevated">
            Start Shopping
          </button>
        </div> : <div className="px-4 flex flex-col gap-3 pb-4">
          {orders.map((order, i) => <motion.div key={order.id} initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: i * 0.06
      }}>
              <OrderCard order={order} />
            </motion.div>)}

          {/* Summary card */}
          <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-card mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <PackageCheck size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Total Spent</p>
                <p className="text-lg font-bold text-primary">
                  ₱{orders.reduce((s, o) => s + o.total, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>}
    </div>;
}