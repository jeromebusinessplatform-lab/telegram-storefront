import { useState } from 'react';
import { CreditCard, Banknote, Wallet, CheckCircle, TrendingUp } from 'lucide-react';
import AdminSubHeader from '@/components/admin/AdminSubHeader';
import { useCart } from '@/context/CartContext';

const PAYMENT_METHODS = [
  { id: 'cod',    label: 'Cash on Delivery', icon: Banknote,    desc: 'Pay when order arrives' },
  { id: 'card',   label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, AMEX' },
  { id: 'wallet', label: 'Digital Wallet',    icon: Wallet,     desc: 'GCash, Maya, PayMongo' },
  { id: 'stars',  label: 'Telegram Stars',    icon: CheckCircle, desc: 'Instant in-app payment' },
];

export default function PaymentManagementPage() {
  const { orders } = useCart();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ cod: true, card: true, wallet: true, stars: false });
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const toggle = (id: string) => setEnabled(e => ({ ...e, [id]: !e[id] }));

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Payment Management" subtitle="Methods & transactions" />

      <div className="px-5 pt-5 pb-6 flex flex-col gap-4">

        {/* Revenue summary */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-primary bg-primary/10' },
            { label: 'Orders Paid', value: orders.length, icon: CheckCircle, color: 'text-success bg-success/10' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border/40 rounded-2xl p-4 shadow-card">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}><s.icon size={16} /></div>
              <p className="text-lg font-bold text-foreground font-condensed">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Payment Methods</p>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {PAYMENT_METHODS.map((m, i) => (
              <div key={m.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < PAYMENT_METHODS.length - 1 ? 'border-b border-border/40' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${enabled[m.id] ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <m.icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-foreground">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                </div>
                <button onClick={() => toggle(m.id)} className={`w-11 h-6 rounded-full transition-colors relative ${enabled[m.id] ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${enabled[m.id] ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Recent Transactions</p>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {orders.length === 0 ? (
              <div className="px-4 py-5 text-center text-[11px] text-muted-foreground">No transactions yet</div>
            ) : orders.slice(0, 8).map((o, i) => (
              <div key={o.id} className={`flex items-center justify-between px-4 py-3 ${i < Math.min(orders.length, 8) - 1 ? 'border-b border-border/40' : ''}`}>
                <div>
                  <p className="text-[11px] font-semibold text-foreground">{o.id}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(o.date).toLocaleDateString()}</p>
                </div>
                <p className="text-[12px] font-bold text-success">+${o.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
