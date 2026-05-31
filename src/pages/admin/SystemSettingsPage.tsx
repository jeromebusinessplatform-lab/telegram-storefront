import { useState } from 'react';
import { Shield, Bell, Globe, Download, Eye, EyeOff, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import AdminSubHeader from '@/components/admin/AdminSubHeader';

export default function SystemSettingsPage() {
  const [currency, setCurrency] = useState('USD');
  const [lang, setLang] = useState('en');
  const [notifications, setNotifications] = useState({ newOrder: true, lowStock: true, review: false, promo: true });
  const [oldCode, setOldCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [codeSaved, setCodeSaved] = useState(false);

  const saveCode = () => {
    if (oldCode !== 'PRIME2026ADMIN') { toast.error('Current code is incorrect'); return; }
    if (newCode.length < 6) { toast.error('New code must be at least 6 characters'); return; }
    if (newCode !== confirmCode) { toast.error('Codes do not match'); return; }
    setCodeSaved(true);
    toast.success('Admin code updated successfully');
    setTimeout(() => setCodeSaved(false), 2000);
    setOldCode(''); setNewCode(''); setConfirmCode('');
  };

  const toggleNotif = (key: keyof typeof notifications) => setNotifications(n => ({ ...n, [key]: !n[key] }));

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="System Settings" subtitle="Security, preferences & data" />

      <div className="px-5 pt-5 pb-6 flex flex-col gap-4">

        {/* Store preferences */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Store Preferences</p>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
              <Globe size={14} className="text-primary flex-shrink-0" />
              <span className="text-[11px] font-semibold text-foreground flex-1">Currency</span>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="bg-muted rounded-lg px-2 py-1 text-[11px] font-medium text-foreground outline-none">
                {['USD', 'PHP', 'EUR', 'GBP', 'SGD', 'AUD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <Globe size={14} className="text-primary flex-shrink-0" />
              <span className="text-[11px] font-semibold text-foreground flex-1">Language</span>
              <select value={lang} onChange={e => setLang(e.target.value)}
                className="bg-muted rounded-lg px-2 py-1 text-[11px] font-medium text-foreground outline-none">
                <option value="en">English</option>
                <option value="fil">Filipino</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Bell size={12} className="text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Notifications</p>
          </div>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {[
              { key: 'newOrder', label: 'New Order',       desc: 'Alert when a customer places an order' },
              { key: 'lowStock', label: 'Low Stock Alert',  desc: 'When product drops below 5 units' },
              { key: 'review',   label: 'New Review',       desc: 'Customer leaves a product review' },
              { key: 'promo',    label: 'Promo Expiry',     desc: 'When a promo code is about to expire' },
            ].map(({ key, label, desc }, i) => (
              <div key={key} className={`flex items-center gap-3 px-4 py-3 ${i < 3 ? 'border-b border-border/40' : ''}`}>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
                <button onClick={() => toggleNotif(key as keyof typeof notifications)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${notifications[key as keyof typeof notifications] ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${notifications[key as keyof typeof notifications] ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Change admin code */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Shield size={12} className="text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Change Admin Code</p>
          </div>
          <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-card flex flex-col gap-2.5">
            {[
              { label: 'Current Code', val: oldCode, set: setOldCode, show: showOld, toggle: () => setShowOld(!showOld) },
              { label: 'New Code',     val: newCode, set: setNewCode, show: showNew, toggle: () => setShowNew(!showNew) },
              { label: 'Confirm New Code', val: confirmCode, set: setConfirmCode, show: showNew, toggle: () => setShowNew(!showNew) },
            ].map(f => (
              <div key={f.label} className="relative">
                <p className="text-[9px] text-muted-foreground mb-1">{f.label}</p>
                <div className="flex items-center bg-muted rounded-xl overflow-hidden">
                  <input type={f.show ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)}
                    className="flex-1 px-3 py-2 text-[11px] font-semibold text-foreground bg-transparent outline-none" />
                  <button onClick={f.toggle} className="px-3 py-2 text-muted-foreground">
                    {f.show ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>
            ))}
            <button onClick={saveCode} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5">
              <AnimatePresence mode="wait">
                {codeSaved ? (
                  <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                    <Check size={12} /> Code Updated
                  </motion.span>
                ) : (
                  <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Update Code</motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Data export */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Download size={12} className="text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Data Export</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Export Orders', 'Export Customers', 'Export Products', 'Export Transactions'].map(label => (
              <button key={label} className="bg-card border border-border/40 rounded-2xl px-3 py-3 text-[10px] font-semibold text-foreground flex items-center gap-2 shadow-card">
                <Download size={12} className="text-primary flex-shrink-0" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
