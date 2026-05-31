import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Store, Package, BarChart3, CreditCard, Users, Tag, Truck, DollarSign, Megaphone, LifeBuoy, Settings, LogOut, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/context/AdminContext';
import { useCart } from '@/context/CartContext';
const ACCESS_CODE = 'PRIME2026ADMIN';
const MENU_ITEMS = [{
  icon: Store,
  label: 'Store Status',
  sub: 'Open/Close & hours',
  path: '/admin/store-status',
  color: 'text-primary bg-primary/10'
}, {
  icon: Package,
  label: 'Order Management',
  sub: 'View & update orders',
  path: '/admin/orders',
  color: 'text-amber-600 bg-amber-50'
}, {
  icon: BarChart3,
  label: 'Inventory',
  sub: 'Stock levels & alerts',
  path: '/admin/inventory',
  color: 'text-sky-500 bg-sky-50'
}, {
  icon: CreditCard,
  label: 'Payment',
  sub: 'Methods & transactions',
  path: '/admin/payments',
  color: 'text-success bg-success/10'
}, {
  icon: Users,
  label: 'Customers',
  sub: 'Customer management',
  path: '/admin/customers',
  color: 'text-violet-500 bg-violet-50'
}, {
  icon: Tag,
  label: 'Promos',
  sub: 'Discount codes',
  path: '/admin/promos',
  color: 'text-pink-500 bg-pink-50'
}, {
  icon: DollarSign,
  label: 'Charges',
  sub: 'Fees & shipping rates',
  path: '/admin/charges',
  color: 'text-amber-600 bg-amber-50'
}, {
  icon: Truck,
  label: 'Delivery',
  sub: 'Zones & couriers',
  path: '/admin/delivery',
  color: 'text-sky-500 bg-sky-50'
}, {
  icon: BarChart3,
  label: 'Cashflow',
  sub: 'Revenue & expenses',
  path: '/admin/cashflow',
  color: 'text-success bg-success/10'
}, {
  icon: Megaphone,
  label: 'Announcements',
  sub: 'Store banners & alerts',
  path: '/admin/announcements',
  color: 'text-primary bg-primary/10'
}, {
  icon: LifeBuoy,
  label: 'Support Center',
  sub: 'Tickets & FAQ config',
  path: '/admin/support-config',
  color: 'text-violet-500 bg-violet-50'
}, {
  icon: Settings,
  label: 'System Settings',
  sub: 'Security & preferences',
  path: '/admin/settings',
  color: 'text-muted-foreground bg-muted'
}];
export default function AdminPage() {
  const {
    isUnlocked,
    unlock,
    lock
  } = useAdmin();
  const {
    orders
  } = useCart();
  const navigate = useNavigate();

  // Lock screen state
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const handleUnlock = () => {
    if (code === ACCESS_CODE) {
      unlock();
      setCode('');
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setCode('');
    }
  };
  if (!isUnlocked) {
    return <div className="flex flex-col items-center justify-center min-h-screen px-8 bg-background">
        <motion.div animate={shake ? {
        x: [-8, 8, -8, 8, 0]
      } : {}} transition={{
        duration: 0.4
      }} className="w-full max-w-xs">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-hero-gradient flex items-center justify-center mb-4 shadow-elevated">
              <Shield size={28} className="text-primary-foreground text-[26px]" />
            </div>
            <h1 className="font-bold font-condensed text-center text-[16px] text-[#B20329FF]">ADMINISTRATOR 
FULL SYSTEM ACCESS</h1>
            <p className="text-muted-foreground mt-1 text-[9.5px]">ENTER YOUR AUTHORIZATION CODE</p>
          </div>
          <div className="relative mb-3">
            <input type={showCode ? 'text' : 'password'} value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleUnlock()} placeholder="ACCESS CODE" className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-sm font-bold text-center text-foreground tracking-widest outline-none focus:border-primary/50 shadow-card" />
            <button onClick={() => setShowCode(!showCode)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button onClick={handleUnlock} className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-semibold shadow-elevated text-[11px]">UNLOCK</button>
        </motion.div>
      </div>;
  }

  // Dashboard
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  return <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-hero-gradient px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/60 text-[10px] font-medium uppercase tracking-wide">administrator control center</p>
            <h1 className="text-primary-foreground font-bold text-lg font-condensed leading-tight">DASHBOARD</h1>
          </div>
          <button onClick={() => {
          lock();
          navigate('/');
        }} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-foreground/20 rounded-full text-primary-foreground text-[10px] font-semibold">
            <LogOut size={11} /> Exit Admin
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[{
          label: 'Revenue',
          value: `$${totalRevenue.toFixed(0)}`
        }, {
          label: 'Orders',
          value: orders.length
        }, {
          label: 'Pending',
          value: pendingOrders
        }].map(s => <div key={s.label} className="bg-primary-foreground/15 rounded-xl px-3 py-2.5 text-center">
              <p className="text-primary-foreground font-bold text-base font-condensed">{s.value}</p>
              <p className="text-primary-foreground/70 text-[10px]">{s.label}</p>
            </div>)}
        </div>
      </div>

      {/* Menu grid — 2 columns */}
      <div className="px-5 pt-4 pb-6">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-3 px-1">Management</p>
        <div className="grid grid-cols-2 gap-2.5">
          {MENU_ITEMS.map((item, i) => <motion.button key={item.path} initial={{
          opacity: 0,
          y: 8
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: i * 0.03
        }} onClick={() => navigate(item.path)} className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col items-start gap-2.5 shadow-card text-left active:scale-95 transition-transform">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                <item.icon size={18} />
              </div>
              <div className="min-w-0 w-full">
                <p className="text-[11px] font-bold text-foreground leading-tight">{item.label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug">{item.sub}</p>
              </div>
            </motion.button>)}
        </div>
      </div>
    </div>;
}