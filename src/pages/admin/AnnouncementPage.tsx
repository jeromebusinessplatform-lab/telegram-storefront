import { useState } from 'react';
import { Megaphone, Plus, X, Info, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSubHeader from '@/components/admin/AdminSubHeader';

type AnnouncementType = 'info' | 'sale' | 'alert';

interface Announcement {
  id: string; title: string; message: string; type: AnnouncementType;
  active: boolean; startDate: string; endDate: string;
}

const TYPE_STYLES: Record<AnnouncementType, { label: string; icon: typeof Info; color: string; bg: string }> = {
  info:  { label: 'Info',  icon: Info,          color: 'text-primary',    bg: 'bg-primary/10' },
  sale:  { label: 'Sale',  icon: Zap,            color: 'text-success',    bg: 'bg-success/10' },
  alert: { label: 'Alert', icon: AlertTriangle,  color: 'text-amber-600',  bg: 'bg-amber-50' },
};

const INITIAL: Announcement[] = [
  { id: '1', title: 'Free Shipping Weekend', message: 'Enjoy free shipping on all orders this weekend!', type: 'sale', active: true, startDate: '2026-05-30', endDate: '2026-06-01' },
  { id: '2', title: 'New Arrivals',           message: 'Check out our latest collection of summer essentials.',  type: 'info', active: true, startDate: '2026-05-28', endDate: '2026-06-30' },
];

export default function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' as AnnouncementType, startDate: '', endDate: '' });

  const toggle = (id: string) => setAnnouncements(a => a.map(x => x.id === id ? { ...x, active: !x.active } : x));
  const remove = (id: string) => setAnnouncements(a => a.filter(x => x.id !== id));
  const add = () => {
    if (!form.title || !form.message) return;
    setAnnouncements(a => [...a, { ...form, id: Date.now().toString(), active: true }]);
    setForm({ title: '', message: '', type: 'info', startDate: '', endDate: '' });
    setShowForm(false);
  };

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Announcements" subtitle={`${announcements.filter(a => a.active).length} active`} />

      <div className="px-5 pt-5 pb-6 flex flex-col gap-3">
        <button onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary/30 rounded-2xl text-[11px] font-semibold text-primary">
          <Plus size={14} /> New Announcement
        </button>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-card border border-primary/30 rounded-2xl p-4 flex flex-col gap-2.5">
                <input placeholder="Announcement title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-muted rounded-xl px-3 py-2 text-[11px] font-semibold text-foreground outline-none" />
                <textarea placeholder="Message content..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3}
                  className="w-full bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none resize-none" />
                <div className="flex gap-2">
                  {(['info', 'sale', 'alert'] as AnnouncementType[]).map(t => {
                    const s = TYPE_STYLES[t];
                    const Icon = s.icon;
                    return (
                      <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-semibold border transition-all ${form.type === t ? s.bg + ' ' + s.color + ' border-transparent' : 'border-border text-muted-foreground'}`}>
                        <Icon size={11} /> {s.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="flex-1 bg-muted rounded-xl px-3 py-2 text-[10px] text-foreground outline-none" />
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="flex-1 bg-muted rounded-xl px-3 py-2 text-[10px] text-foreground outline-none" />
                </div>
                <button onClick={add} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-[11px] font-semibold">
                  Publish Announcement
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {announcements.map((ann, i) => {
          const s = TYPE_STYLES[ann.type];
          const Icon = s.icon;
          return (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border/40 rounded-2xl p-4 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}><Icon size={14} /></div>
                  <div>
                    <p className="text-[12px] font-bold text-foreground">{ann.title}</p>
                    <span className={`text-[9px] font-semibold ${s.color}`}>{s.label.toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => toggle(ann.id)} className={`w-9 h-5 rounded-full transition-colors relative ${ann.active ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${ann.active ? 'translate-x-[17px]' : 'translate-x-[2px]'}`} />
                  </button>
                  <button onClick={() => remove(ann.id)} className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center"><X size={12} /></button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground ml-10 mb-1.5">{ann.message}</p>
              {(ann.startDate || ann.endDate) && (
                <p className="text-[9px] text-muted-foreground ml-10">{ann.startDate} → {ann.endDate || '∞'}</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
