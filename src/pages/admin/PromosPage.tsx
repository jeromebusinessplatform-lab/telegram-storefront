import { useState } from 'react';
import { Tag, Plus, X, Copy, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSubHeader from '@/components/admin/AdminSubHeader';

interface PromoCode {
  id: string; code: string; type: 'percent' | 'fixed'; value: number;
  minOrder: number; uses: number; maxUses: number; expiry: string; active: boolean;
}

const INITIAL_PROMOS: PromoCode[] = [
  { id: '1', code: 'WELCOME10', type: 'percent', value: 10, minOrder: 0,   uses: 45, maxUses: 100, expiry: '2026-12-31', active: true },
  { id: '2', code: 'SAVE20',    type: 'fixed',   value: 20, minOrder: 100, uses: 12, maxUses: 50,  expiry: '2026-07-01', active: true },
  { id: '3', code: 'FLASH40',   type: 'percent', value: 40, minOrder: 50,  uses: 99, maxUses: 100, expiry: '2026-06-30', active: false },
];

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>(INITIAL_PROMOS);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', type: 'percent' as 'percent' | 'fixed', value: '', minOrder: '', maxUses: '', expiry: '' });

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1500); };
  const toggleActive = (id: string) => setPromos(p => p.map(x => x.id === id ? { ...x, active: !x.active } : x));
  const deletePromo = (id: string) => setPromos(p => p.filter(x => x.id !== id));

  const addPromo = () => {
    if (!form.code || !form.value) return;
    setPromos(p => [...p, { id: Date.now().toString(), code: form.code.toUpperCase(), type: form.type, value: Number(form.value), minOrder: Number(form.minOrder) || 0, uses: 0, maxUses: Number(form.maxUses) || 999, expiry: form.expiry || '2099-12-31', active: true }]);
    setForm({ code: '', type: 'percent', value: '', minOrder: '', maxUses: '', expiry: '' });
    setShowForm(false);
  };

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Promos & Discounts" subtitle={`${promos.filter(p => p.active).length} active codes`} />

      <div className="px-5 pt-5 pb-6 flex flex-col gap-3">
        <button onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary/30 rounded-2xl text-[11px] font-semibold text-primary">
          <Plus size={14} /> Add Promo Code
        </button>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-card border border-primary/30 rounded-2xl p-4 flex flex-col gap-2.5">
                <input placeholder="Code (e.g. SAVE20)" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  className="w-full bg-muted rounded-xl px-3 py-2 text-[11px] font-semibold text-foreground outline-none uppercase" />
                <div className="flex gap-2">
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}
                    className="flex-1 bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none">
                    <option value="percent">Percentage %</option>
                    <option value="fixed">Fixed $ off</option>
                  </select>
                  <input placeholder="Value" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} type="number"
                    className="flex-1 bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none" />
                </div>
                <div className="flex gap-2">
                  <input placeholder="Min order $" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} type="number"
                    className="flex-1 bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none" />
                  <input placeholder="Max uses" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} type="number"
                    className="flex-1 bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none" />
                </div>
                <input type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                  className="w-full bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none" />
                <button onClick={addPromo} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-[11px] font-semibold">
                  Create Code
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {promos.map((promo, i) => (
          <motion.div key={promo.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border/40 rounded-2xl p-4 shadow-card">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${promo.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Tag size={14} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-foreground font-condensed">{promo.code}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {promo.type === 'percent' ? `${promo.value}% off` : `$${promo.value} off`}
                    {promo.minOrder > 0 ? ` · min $${promo.minOrder}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => copyCode(promo.code)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  {copied === promo.code ? <CheckCircle size={12} className="text-success" /> : <Copy size={12} className="text-muted-foreground" />}
                </button>
                <button onClick={() => deletePromo(promo.id)} className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                  <X size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">{promo.uses}/{promo.maxUses} used</span>
                <span className="text-[10px] text-muted-foreground">Exp: {promo.expiry}</span>
              </div>
              <button onClick={() => toggleActive(promo.id)} className={`w-10 h-5 rounded-full transition-colors relative ${promo.active ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${promo.active ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
