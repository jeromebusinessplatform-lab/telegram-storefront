import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, WrenchIcon, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import AdminSubHeader from '@/components/admin/AdminSubHeader';
import { useStoreStatus, type StoreStatus } from '@/context/StoreStatusContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultHours: Record<string, { open: string; close: string; enabled: boolean }> = {
  Monday:    { open: '09:00', close: '18:00', enabled: true },
  Tuesday:   { open: '09:00', close: '18:00', enabled: true },
  Wednesday: { open: '09:00', close: '18:00', enabled: true },
  Thursday:  { open: '09:00', close: '18:00', enabled: true },
  Friday:    { open: '09:00', close: '18:00', enabled: true },
  Saturday:  { open: '10:00', close: '16:00', enabled: true },
  Sunday:    { open: '10:00', close: '14:00', enabled: false },
};

const STATUS_OPTIONS: {
  id: StoreStatus;
  label: string;
  desc: string;
  icon: typeof CheckCircle;
  activeRing: string;
  activeBg: string;
  iconColor: string;
  iconBg: string;
  dot: string;
}[] = [
  {
    id: 'open',
    label: 'Store is Open',
    desc: 'Store is operating normally and accepting all orders.',
    icon: CheckCircle,
    activeRing: 'border-success ring-2 ring-success/30',
    activeBg: 'bg-success/5',
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    dot: 'bg-success',
  },
  {
    id: 'closed',
    label: 'Store is Closed',
    desc: 'Store is closed. Customers cannot checkout or place orders.',
    icon: XCircle,
    activeRing: 'border-destructive ring-2 ring-destructive/30',
    activeBg: 'bg-destructive/5',
    iconColor: 'text-destructive',
    iconBg: 'bg-destructive/10',
    dot: 'bg-destructive',
  },
  {
    id: 'limited',
    label: 'Limited Operation',
    desc: 'Store is experiencing issues with the system. Delays are expected.',
    icon: AlertTriangle,
    activeRing: 'border-amber-400 ring-2 ring-amber-400/30',
    activeBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    dot: 'bg-amber-400',
  },
  {
    id: 'maintenance',
    label: 'Maintenance Mode',
    desc: 'System is offline. No transactions of any type can be processed.',
    icon: WrenchIcon,
    activeRing: 'border-slate-400 ring-2 ring-slate-400/30',
    activeBg: 'bg-slate-50',
    iconColor: 'text-slate-600',
    iconBg: 'bg-slate-100',
    dot: 'bg-slate-500',
  },
];

export default function StoreStatusPage() {
  const { status, setStatus, statusMessage, setStatusMessage } = useStoreStatus();
  const [hours, setHours] = useState(defaultHours);

  const handleSave = () => {
    toast.success(`Status set to "${STATUS_OPTIONS.find(s => s.id === status)?.label}"`);
  };

  const current = STATUS_OPTIONS.find(s => s.id === status)!;

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Store Status" subtitle="Control how customers interact with your store" />

      <div className="px-5 pt-5 pb-6 flex flex-col gap-5">

        {/* Active status badge */}
        <div className={`rounded-2xl p-4 border flex items-center gap-3 ${current.activeBg} ${current.activeRing}`}>
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0 ${current.dot}`} />
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Status</p>
            <p className={`text-sm font-bold ${current.iconColor}`}>{current.label}</p>
          </div>
          <current.icon size={20} className={current.iconColor} />
        </div>

        {/* 4 status selector cards */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2.5 px-1">Select Status</p>
          <div className="flex flex-col gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = status === opt.id;
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full rounded-2xl border p-4 flex items-start gap-3 text-left transition-all ${
                    isSelected
                      ? `${opt.activeBg} ${opt.activeRing}`
                      : 'bg-card border-border/40 shadow-card'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? opt.iconBg : 'bg-muted'}`}>
                    <Icon size={17} className={isSelected ? opt.iconColor : 'text-muted-foreground'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-bold leading-tight ${isSelected ? opt.iconColor : 'text-foreground'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    isSelected ? `${opt.dot} border-transparent` : 'border-border bg-transparent'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Status message */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <MessageSquare size={12} className="text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Customer Message</p>
          </div>
          <div className="bg-card border border-border/40 rounded-2xl shadow-card">
            <textarea
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              rows={2}
              placeholder="Message shown to customers on the store banner..."
              className="w-full px-4 py-3 text-[11px] font-medium text-foreground bg-transparent outline-none resize-none rounded-2xl"
            />
          </div>
        </div>

        {/* Operating hours */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Clock size={12} className="text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Operating Hours</p>
          </div>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {DAYS.map((day, i) => (
              <div key={day} className={`flex items-center gap-3 px-4 py-2.5 ${i < DAYS.length - 1 ? 'border-b border-border/40' : ''}`}>
                <button
                  onClick={() => setHours(h => ({ ...h, [day]: { ...h[day], enabled: !h[day].enabled } }))}
                  className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${hours[day].enabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <motion.div animate={{ x: hours[day].enabled ? 16 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-sm" />
                </button>
                <span className={`text-[11px] font-semibold w-[52px] ${hours[day].enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {day.slice(0, 3)}
                </span>
                {hours[day].enabled ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input type="time" value={hours[day].open}
                      onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], open: e.target.value } }))}
                      className="text-[10px] font-medium text-foreground bg-muted rounded-lg px-2 py-1 outline-none border-0 flex-1" />
                    <span className="text-[10px] text-muted-foreground">–</span>
                    <input type="time" value={hours[day].close}
                      onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], close: e.target.value } }))}
                      className="text-[10px] font-medium text-foreground bg-muted rounded-lg px-2 py-1 outline-none border-0 flex-1" />
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground flex-1">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl text-xs font-semibold shadow-elevated">
          Apply Status
        </button>
      </div>
    </div>
  );
}
