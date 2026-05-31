import { useState } from 'react';
import { DollarSign, Truck, Package } from 'lucide-react';
import { toast } from 'sonner';
import AdminSubHeader from '@/components/admin/AdminSubHeader';

export default function ChargeManagementPage() {
  const [freeShippingMin, setFreeShippingMin] = useState('150');
  const [serviceFee, setServiceFee] = useState('2.5');
  const [feeType, setFeeType] = useState<'percent' | 'fixed'>('percent');
  const [minOrder, setMinOrder] = useState('50');
  const [codFee, setCodFee] = useState('15');
  const [zones, setZones] = useState([
    { id: '1', name: 'Metro Area',   rate: '5.00',  days: '1–2' },
    { id: '2', name: 'Provincial',   rate: '15.00', days: '3–5' },
    { id: '3', name: 'Remote Area',  rate: '25.00', days: '5–7' },
    { id: '4', name: 'International',rate: '50.00', days: '7–14' },
  ]);

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Charge Management" subtitle="Shipping rates & fees" />
      <div className="px-5 pt-5 pb-6 flex flex-col gap-4">

        {/* Shipping zones */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Shipping Zones</p>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {zones.map((z, i) => (
              <div key={z.id} className={`flex items-center gap-3 px-4 py-3 ${i < zones.length - 1 ? 'border-b border-border/40' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"><Truck size={14} /></div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-foreground">{z.name}</p>
                  <p className="text-[10px] text-muted-foreground">{z.days} business days</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">$</span>
                  <input value={z.rate} onChange={e => setZones(zs => zs.map(zx => zx.id === z.id ? { ...zx, rate: e.target.value } : zx))} type="number"
                    className="w-14 bg-muted rounded-lg px-2 py-1 text-[11px] font-bold text-foreground outline-none text-right" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free shipping threshold */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center"><Package size={14} /></div>
            <div>
              <p className="text-[11px] font-semibold text-foreground">Free Shipping Threshold</p>
              <p className="text-[10px] text-muted-foreground">Orders above this get free shipping</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">$</span>
            <input value={freeShippingMin} onChange={e => setFreeShippingMin(e.target.value)} type="number"
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-[12px] font-bold text-foreground outline-none" />
          </div>
        </div>

        {/* Service fee */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><DollarSign size={14} /></div>
            <div>
              <p className="text-[11px] font-semibold text-foreground">Service Fee</p>
              <p className="text-[10px] text-muted-foreground">Applied to all orders</p>
            </div>
          </div>
          <div className="flex gap-2">
            <select value={feeType} onChange={e => setFeeType(e.target.value as 'percent' | 'fixed')}
              className="bg-muted rounded-xl px-3 py-2 text-[11px] font-medium text-foreground outline-none">
              <option value="percent">% Percent</option>
              <option value="fixed">$ Fixed</option>
            </select>
            <input value={serviceFee} onChange={e => setServiceFee(e.target.value)} type="number"
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-[12px] font-bold text-foreground outline-none" />
          </div>
        </div>

        {/* Min order + COD fee */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Min Order ($)', value: minOrder, set: setMinOrder },
            { label: 'COD Fee ($)', value: codFee, set: setCodFee },
          ].map(f => (
            <div key={f.label} className="bg-card border border-border/40 rounded-2xl p-3.5 shadow-card">
              <p className="text-[10px] text-muted-foreground mb-1">{f.label}</p>
              <input value={f.value} onChange={e => f.set(e.target.value)} type="number"
                className="w-full bg-muted rounded-xl px-2.5 py-1.5 text-[12px] font-bold text-foreground outline-none" />
            </div>
          ))}
        </div>

        <button onClick={() => toast.success('Charge settings saved!')} className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl text-xs font-semibold shadow-elevated">
          Save Charges
        </button>
      </div>
    </div>
  );
}
