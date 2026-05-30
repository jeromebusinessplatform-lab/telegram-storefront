import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, ArrowLeft, Package, ShoppingBag, TrendingUp, Users, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { products } from '@/data/products';

const ADMIN_CODE = 'PRIME2026ADMIN';

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = () => {
    if (code === ADMIN_CODE) {
      onUnlock();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
          <ArrowLeft size={16} /> Back
        </button>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 px-6 pb-10">
        <motion.div
          animate={shaking ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center w-full max-w-[280px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-hero-gradient flex items-center justify-center mb-5 shadow-elevated">
            <Shield size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-condensed mb-1">Admin Access</h1>
          <p className="text-sm text-muted-foreground mb-6 text-center">Enter your access code to continue</p>

          {/* Code input */}
          <div className="relative w-full mb-4">
            <input
              type={showCode ? 'text' : 'password'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Access code"
              className={`w-full bg-card border rounded-2xl px-4 py-3.5 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none pr-11 transition-all ${
                error ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
              }`}
            />
            <button
              onClick={() => setShowCode(!showCode)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-destructive font-medium mb-3"
              >
                Invalid access code. Please try again.
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="w-full py-3.5 bg-hero-gradient text-primary-foreground rounded-2xl text-sm font-semibold shadow-elevated"
          >
            Unlock Admin
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { orders } = useCart();
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const stats = [
    { icon: ShoppingBag, label: 'Products', value: products.length, color: 'text-primary bg-primary/10' },
    { icon: Package, label: 'Orders', value: orders.length, color: 'text-success bg-success/10' },
    { icon: TrendingUp, label: 'Revenue', value: `$${totalRevenue.toFixed(0)}`, color: 'text-amber-600 bg-amber-50' },
    { icon: Users, label: 'Users', value: 1, color: 'text-rose-500 bg-rose-50' },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-hero-gradient px-4 pt-5 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="text-primary-foreground/80" />
          </button>
          <div>
            <p className="text-primary-foreground/70 text-[11px] font-medium">Admin Panel</p>
            <h1 className="text-primary-foreground font-bold text-lg font-condensed leading-tight">Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-5 pb-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border/40 rounded-2xl p-3.5 shadow-card"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon size={16} />
              </div>
              <p className="text-xl font-bold text-foreground font-condensed">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Products table */}
        <div>
          <h2 className="text-base font-bold text-foreground font-condensed mb-2.5">Products</h2>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {products.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-3.5 py-3 ${i < products.length - 1 ? 'border-b border-border/50' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground leading-tight line-clamp-1">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">${p.price.toFixed(2)}</p>
                </div>
                <div className="flex gap-1.5">
                  <button className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Edit size={12} />
                  </button>
                  <button className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders table */}
        <div>
          <h2 className="text-base font-bold text-foreground font-condensed mb-2.5">Recent Orders</h2>
          {orders.length === 0 ? (
            <div className="bg-card border border-border/40 rounded-2xl p-6 text-center shadow-card">
              <p className="text-sm text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
              {orders.map((order, i) => (
                <div
                  key={order.id}
                  className={`flex items-center justify-between px-3.5 py-3 ${i < orders.length - 1 ? 'border-b border-border/50' : ''}`}
                >
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">{order.id}</p>
                    <p className="text-[11px] text-muted-foreground">{order.items.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-foreground">${order.total.toFixed(2)}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {unlocked ? (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-full">
          <AdminDashboard />
        </motion.div>
      ) : (
        <motion.div key="lock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col min-h-full">
          <LockScreen onUnlock={() => setUnlocked(true)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
