import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import AdminSubHeader from '@/components/admin/AdminSubHeader';

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

export default function StoreStatusPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [hours, setHours] = useState(defaultHours);
  const [statusMsg, setStatusMsg] = useState('Welcome to our store!');

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Store Status" subtitle="Control store visibility & hours" />

      <div className="px-5 pt-5 pb-6 flex flex-col gap-4">

        {/* Main toggle */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOpen ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                <Store size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{isOpen ? 'Store is Open' : 'Store is Closed'}</p>
                <p className="text-[11px] text-muted-foreground">{isOpen ? 'Accepting new orders' : 'Not accepting orders'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isOpen ? 'bg-success' : 'bg-muted'}`}
            >
              <motion.div animate={{ x: isOpen ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm" />
            </button>
          </div>
        </div>

        {/* Maintenance mode */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${maintenance ? 'bg-amber-50 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Maintenance Mode</p>
                <p className="text-[11px] text-muted-foreground">Show maintenance page to customers</p>
              </div>
            </div>
            <button
              onClick={() => setMaintenance(!maintenance)}
              className={`w-12 h-6 rounded-full transition-colors relative ${maintenance ? 'bg-amber-400' : 'bg-muted'}`}
            >
              <motion.div animate={{ x: maintenance ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm" />
            </button>
          </div>
        </div>

        {/* Status message */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Status Message</p>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            <div className="flex items-center gap-2 px-4 py-3">
              <CheckCircle size={14} className="text-primary flex-shrink-0" />
              <input
                value={statusMsg}
                onChange={(e) => setStatusMsg(e.target.value)}
                className="flex-1 text-[11px] font-medium text-foreground bg-transparent outline-none"
              />
            </div>
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
              <div key={day} className={`flex items-center gap-3 px-4 py-3 ${i < DAYS.length - 1 ? 'border-b border-border/40' : ''}`}>
                <button
                  onClick={() => setHours(h => ({ ...h, [day]: { ...h[day], enabled: !h[day].enabled } }))}
                  className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${hours[day].enabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <motion.div animate={{ x: hours[day].enabled ? 16 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-sm" />
                </button>
                <span className={`text-[11px] font-semibold w-20 ${hours[day].enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{day.slice(0, 3)}</span>
                {hours[day].enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={hours[day].open} onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], open: e.target.value } }))}
                      className="text-[10px] font-medium text-foreground bg-muted rounded-lg px-2 py-1 outline-none border-0 flex-1" />
                    <span className="text-[10px] text-muted-foreground">–</span>
                    <input type="time" value={hours[day].close} onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], close: e.target.value } }))}
                      className="text-[10px] font-medium text-foreground bg-muted rounded-lg px-2 py-1 outline-none border-0 flex-1" />
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground flex-1">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl text-xs font-semibold shadow-elevated">
          Save Changes
        </button>
      </div>
    </div>
  );
}
