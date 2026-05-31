import { useState } from 'react';
import { Truck, MapPin, Clock, Plus, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import AdminSubHeader from '@/components/admin/AdminSubHeader';

const COURIERS = [
  { id: '1', name: 'LBC Express',   active: true,  type: 'Standard & Express' },
  { id: '2', name: 'J&T Express',   active: true,  type: 'Standard' },
  { id: '3', name: 'Ninja Van',     active: false, type: 'Standard & Same-day' },
  { id: '4', name: 'GrabExpress',   active: true,  type: 'Same-day & On-demand' },
  { id: '5', name: 'Lalamove',      active: false, type: 'On-demand' },
];

export default function DeliveryManagementPage() {
  const [sameDay, setSameDay] = useState(true);
  const [cutoff, setCutoff] = useState('14:00');
  const [estimateMin, setEstimateMin] = useState('1');
  const [estimateMax, setEstimateMax] = useState('3');
  const [couriers, setCouriers] = useState(COURIERS);
  const [zones, setZones] = useState(['Metro Manila', 'Cebu City', 'Davao City']);
  const [newZone, setNewZone] = useState('');

  const toggleCourier = (id: string) => setCouriers(c => c.map(x => x.id === id ? { ...x, active: !x.active } : x));
  const addZone = () => { if (newZone.trim()) { setZones(z => [...z, newZone.trim()]); setNewZone(''); } };
  const removeZone = (z: string) => setZones(arr => arr.filter(x => x !== z));

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Delivery Management" subtitle="Zones, couriers & settings" />
      <div className="px-5 pt-5 pb-6 flex flex-col gap-4">

        {/* Same-day delivery */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${sameDay ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}><Zap size={16} /></div>
              <div>
                <p className="text-[11px] font-semibold text-foreground">Same-Day Delivery</p>
                <p className="text-[10px] text-muted-foreground">Available for metro orders</p>
              </div>
            </div>
            <button onClick={() => setSameDay(!sameDay)} className={`w-11 h-6 rounded-full transition-colors relative ${sameDay ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${sameDay ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
            </button>
          </div>
          {sameDay && (
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
              <Clock size={12} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Order cutoff:</span>
              <input type="time" value={cutoff} onChange={e => setCutoff(e.target.value)}
                className="text-[11px] font-semibold text-foreground bg-transparent outline-none" />
            </div>
          )}
        </div>

        {/* Delivery estimate */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-primary" />
            <p className="text-[11px] font-semibold text-foreground">Standard Delivery Estimate</p>
          </div>
          <div className="flex items-center gap-2">
            <input value={estimateMin} onChange={e => setEstimateMin(e.target.value)} type="number"
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-[12px] font-bold text-foreground outline-none text-center" />
            <span className="text-[11px] text-muted-foreground">to</span>
            <input value={estimateMax} onChange={e => setEstimateMax(e.target.value)} type="number"
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-[12px] font-bold text-foreground outline-none text-center" />
            <span className="text-[10px] text-muted-foreground">business days</span>
          </div>
        </div>

        {/* Delivery zones */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Coverage Zones</p>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {zones.map((z, i) => (
              <div key={z} className={`flex items-center gap-3 px-4 py-3 ${i < zones.length - 1 ? 'border-b border-border/40' : ''}`}>
                <MapPin size={13} className="text-primary flex-shrink-0" />
                <span className="text-[11px] font-medium text-foreground flex-1">{z}</span>
                <button onClick={() => removeZone(z)} className="w-6 h-6 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center"><X size={11} /></button>
              </div>
            ))}
            <div className="flex gap-2 px-4 py-3 border-t border-border/40">
              <input value={newZone} onChange={e => setNewZone(e.target.value)} onKeyDown={e => e.key === 'Enter' && addZone()} placeholder="Add zone..."
                className="flex-1 bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none" />
              <button onClick={addZone} className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"><Plus size={14} /></button>
            </div>
          </div>
        </div>

        {/* Couriers */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Courier Partners</p>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {couriers.map((c, i) => (
              <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${i < couriers.length - 1 ? 'border-b border-border/40' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}><Truck size={14} /></div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-foreground">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.type}</p>
                </div>
                <button onClick={() => toggleCourier(c.id)} className={`w-10 h-5 rounded-full transition-colors relative ${c.active ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${c.active ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => toast.success('Delivery settings saved!')} className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl text-xs font-semibold shadow-elevated">Save Settings</button>
      </div>
    </div>
  );
}
