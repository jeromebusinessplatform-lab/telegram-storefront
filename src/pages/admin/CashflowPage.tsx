import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminSubHeader from '@/components/admin/AdminSubHeader';
import { useCart } from '@/context/CartContext';

const PERIODS = ['Today', 'Week', 'Month', 'All Time'] as const;

const MOCK_EXPENSES = [
  { id: '1', label: 'Platform fee',    amount: 12.50,  date: '2026-05-30', type: 'expense' as const },
  { id: '2', label: 'Shipping subsidy',amount: 35.00,  date: '2026-05-29', type: 'expense' as const },
  { id: '3', label: 'Promo discount',  amount: 18.00,  date: '2026-05-28', type: 'expense' as const },
];

export default function CashflowPage() {
  const [period, setPeriod] = useState<typeof PERIODS[number]>('All Time');
  const { orders } = useCart();

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const expenses = MOCK_EXPENSES.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - expenses;

  const allTransactions = [
    ...orders.map(o => ({ id: o.id, label: `Order ${o.id}`, amount: o.total, date: o.date.slice(0, 10), type: 'income' as const })),
    ...MOCK_EXPENSES,
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Cashflow" subtitle="Revenue & expense overview" />

      <div className="px-5 pt-5 pb-6 flex flex-col gap-4">

        {/* Period filter */}
        <div className="flex gap-1.5">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${period === p ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
              {p}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Revenue',  value: revenue,  icon: TrendingUp,   color: 'text-success bg-success/10',  prefix: '₱' },
            { label: 'Expenses', value: expenses, icon: TrendingDown,  color: 'text-destructive bg-destructive/10', prefix: '₱' },
            { label: 'Profit',   value: profit,   icon: DollarSign,   color: profit >= 0 ? 'text-primary bg-primary/10' : 'text-destructive bg-destructive/10', prefix: '₱' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
              className="bg-card border border-border/40 rounded-2xl p-3 shadow-card">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.color}`}><s.icon size={14} /></div>
              <p className={`text-sm font-bold font-condensed ${s.color.split(' ')[0]}`}>{s.prefix}{Math.abs(s.value).toFixed(0)}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Visual bar */}
        {revenue > 0 && (
          <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-card">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
              <span>Profit margin</span>
              <span className="font-semibold text-foreground">{revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, (profit / revenue) * 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-primary rounded-full" />
            </div>
          </div>
        )}

        {/* Transaction list */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Transactions</p>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {allTransactions.length === 0 ? (
              <div className="px-4 py-5 text-center text-[11px] text-muted-foreground">No transactions yet</div>
            ) : allTransactions.map((t, i) => (
              <div key={t.id} className={`flex items-center justify-between px-4 py-3 ${i < allTransactions.length - 1 ? 'border-b border-border/40' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {t.type === 'income' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.date}</p>
                  </div>
                </div>
                <p className={`text-[12px] font-bold ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                  {t.type === 'income' ? '+' : '-'}₱{t.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
