import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Eye, EyeOff, ArrowLeft, Package, ShoppingBag, TrendingUp,
  Users, Edit, Trash2, Plus, Save, LayoutDashboard, LifeBuoy, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useSupportConfig, type FaqItem } from '@/context/SupportContext';
import { products } from '@/data/products';

const ADMIN_CODE = 'PRIME2026ADMIN';

/* ─────────────── Lock Screen ─────────────── */
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
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
          <ArrowLeft size={15} /> Back
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
          <h1 className="text-xl font-bold text-foreground font-condensed mb-1">Admin Access</h1>
          <p className="text-xs text-muted-foreground mb-6 text-center">Enter your access code to continue</p>

          <div className="relative w-full mb-3">
            <input
              type={showCode ? 'text' : 'password'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Access code"
              className={`w-full bg-card border rounded-2xl px-4 py-3.5 text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none pr-11 transition-all ${
                error ? 'border-destructive' : 'border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
              }`}
            />
            <button
              onClick={() => setShowCode(!showCode)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-destructive font-medium mb-3"
              >
                Invalid access code. Please try again.
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="w-full py-3.5 bg-hero-gradient text-primary-foreground rounded-2xl text-xs font-semibold shadow-elevated"
          >
            Unlock Admin
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────── Overview Tab ─────────────── */
function OverviewTab() {
  const { orders } = useCart();
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const stats = [
    { icon: ShoppingBag, label: 'Products', value: products.length, color: 'text-primary bg-primary/10' },
    { icon: Package, label: 'Orders', value: orders.length, color: 'text-success bg-success/10' },
    { icon: TrendingUp, label: 'Revenue', value: `$${totalRevenue.toFixed(0)}`, color: 'text-amber-600 bg-amber-50' },
    { icon: Users, label: 'Users', value: 1, color: 'text-rose-500 bg-rose-50' },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card border border-border/40 rounded-2xl p-4 shadow-card"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${stat.color}`}>
              <stat.icon size={16} />
            </div>
            <p className="text-lg font-bold text-foreground font-condensed">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <h3 className="text-xs font-bold text-foreground font-condensed mb-2.5 uppercase tracking-wide">Recent Orders</h3>
        {orders.length === 0 ? (
          <div className="bg-card border border-border/40 rounded-2xl p-5 text-center shadow-card">
            <p className="text-xs text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {orders.map((order, i) => (
              <div
                key={order.id}
                className={`flex items-center justify-between px-4 py-3 ${i < orders.length - 1 ? 'border-b border-border/50' : ''}`}
              >
                <div>
                  <p className="text-[11px] font-semibold text-foreground">{order.id}</p>
                  <p className="text-[10px] text-muted-foreground">{order.items.length} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-foreground">${order.total.toFixed(2)}</p>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Products Tab ─────────────── */
function ProductsTab() {
  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
      {products.map((p, i) => (
        <div
          key={p.id}
          className={`flex items-center gap-3 px-4 py-3 ${i < products.length - 1 ? 'border-b border-border/50' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground line-clamp-1">{p.name}</p>
            <p className="text-[10px] text-muted-foreground">${p.price.toFixed(2)} · {p.category}</p>
          </div>
          <div className="flex gap-1.5">
            <button className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Edit size={11} />
            </button>
            <button className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Support Config Tab ─────────────── */
function SupportConfigTab() {
  const { config, updateConfig, addFaq, updateFaq, removeFaq } = useSupportConfig();
  const [saved, setSaved] = useState(false);
  const [editingFaq, setEditingFaq] = useState<string | null>(null);
  const [newFaq, setNewFaq] = useState({ q: '', a: '' });
  const [showAddFaq, setShowAddFaq] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const fields: { key: keyof typeof config; label: string; multiline?: boolean }[] = [
    { key: 'storeName', label: 'Store Name' },
    { key: 'tagline', label: 'Tagline' },
    { key: 'email', label: 'Support Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'telegram', label: 'Telegram Handle' },
    { key: 'whatsapp', label: 'WhatsApp Number' },
    { key: 'supportHours', label: 'Support Hours' },
    { key: 'aboutText', label: 'About Store', multiline: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Contact info */}
      <div>
        <h3 className="text-xs font-bold text-foreground font-condensed mb-2.5 uppercase tracking-wide">Store & Contact Info</h3>
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
          {fields.map((f, i) => (
            <div key={f.key} className={`px-4 py-3 ${i < fields.length - 1 ? 'border-b border-border/40' : ''}`}>
              <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{f.label}</p>
              {f.multiline ? (
                <textarea
                  value={config[f.key] as string}
                  onChange={(e) => updateConfig({ [f.key]: e.target.value })}
                  rows={3}
                  className="w-full text-[11px] text-foreground bg-transparent outline-none resize-none leading-relaxed"
                />
              ) : (
                <input
                  type="text"
                  value={config[f.key] as string}
                  onChange={(e) => updateConfig({ [f.key]: e.target.value })}
                  className="w-full text-[11px] text-foreground bg-transparent outline-none"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ items */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-foreground font-condensed uppercase tracking-wide">FAQ Items</h3>
          <button
            onClick={() => setShowAddFaq(!showAddFaq)}
            className="flex items-center gap-1 text-[10px] font-semibold text-primary"
          >
            <Plus size={12} /> Add FAQ
          </button>
        </div>

        <AnimatePresence>
          {showAddFaq && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-2.5"
            >
              <div className="bg-card border border-primary/30 rounded-2xl p-3.5 flex flex-col gap-2.5">
                <input
                  placeholder="Question..."
                  value={newFaq.q}
                  onChange={(e) => setNewFaq((p) => ({ ...p, q: e.target.value }))}
                  className="w-full text-[11px] bg-muted rounded-xl px-3 py-2 outline-none text-foreground"
                />
                <textarea
                  placeholder="Answer..."
                  value={newFaq.a}
                  onChange={(e) => setNewFaq((p) => ({ ...p, a: e.target.value }))}
                  rows={2}
                  className="w-full text-[11px] bg-muted rounded-xl px-3 py-2 outline-none text-foreground resize-none"
                />
                <button
                  onClick={() => {
                    if (newFaq.q && newFaq.a) {
                      addFaq(newFaq);
                      setNewFaq({ q: '', a: '' });
                      setShowAddFaq(false);
                    }
                  }}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-[11px] font-semibold"
                >
                  Add Question
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
          {config.faqItems.map((faq: FaqItem, i: number) => (
            <div
              key={faq.id}
              className={`px-4 py-3 ${i < config.faqItems.length - 1 ? 'border-b border-border/40' : ''}`}
            >
              {editingFaq === faq.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={faq.q}
                    onChange={(e) => updateFaq(faq.id, { q: e.target.value })}
                    className="w-full text-[11px] bg-muted rounded-lg px-2.5 py-1.5 outline-none text-foreground"
                  />
                  <textarea
                    value={faq.a}
                    onChange={(e) => updateFaq(faq.id, { a: e.target.value })}
                    rows={2}
                    className="w-full text-[11px] bg-muted rounded-lg px-2.5 py-1.5 outline-none text-foreground resize-none"
                  />
                  <button onClick={() => setEditingFaq(null)} className="text-[10px] font-semibold text-primary">Done</button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground leading-snug">{faq.q}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{faq.a}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditingFaq(faq.id)}
                      className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                    >
                      <Edit size={10} />
                    </button>
                    <button
                      onClick={() => removeFaq(faq.id)}
                      className="w-6 h-6 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        className={`w-full py-3.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
          saved ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground shadow-elevated'
        }`}
      >
        <Save size={14} />
        {saved ? 'Saved!' : 'Save Changes'}
      </motion.button>
    </div>
  );
}

/* ─────────────── Admin Dashboard ─────────────── */
const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-hero-gradient px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={17} className="text-primary-foreground/80" />
          </button>
          <div>
            <p className="text-primary-foreground/65 text-[10px] font-medium">Admin Panel</p>
            <h1 className="text-primary-foreground font-bold text-base font-condensed leading-tight">Dashboard</h1>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1.5 mt-4">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${
                activeTab === id
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-primary-foreground/20 text-primary-foreground/80'
              }`}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-5 pt-5 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'support' && <SupportConfigTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────── Main Export ─────────────── */
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
