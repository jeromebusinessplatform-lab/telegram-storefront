import { useState } from 'react';
import { Search, User, ShoppingBag, TrendingUp, ChevronRight } from 'lucide-react';
import AdminSubHeader from '@/components/admin/AdminSubHeader';

const MOCK_CUSTOMERS = [
  { id: '1', name: 'Alex Rivera',    email: 'alex@example.com',  orders: 5, spent: 342.50, avatar: 'AR' },
  { id: '2', name: 'Maria Santos',   email: 'maria@example.com', orders: 8, spent: 589.99, avatar: 'MS' },
  { id: '3', name: 'James Lim',      email: 'james@example.com', orders: 2, spent: 124.00, avatar: 'JL' },
  { id: '4', name: 'Sofia Cruz',     email: 'sofia@example.com', orders: 12, spent: 899.75, avatar: 'SC' },
  { id: '5', name: 'David Reyes',    email: 'david@example.com', orders: 3, spent: 210.30, avatar: 'DR' },
  { id: '6', name: 'Angela Torres',  email: 'angela@example.com', orders: 7, spent: 430.00, avatar: 'AT' },
];

export default function CustomerManagementPage() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.includes(search)
  );

  const totalCustomers = MOCK_CUSTOMERS.length;
  const totalSpent = MOCK_CUSTOMERS.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Customers" subtitle={`${totalCustomers} registered`} />

      <div className="px-5 pt-5 pb-6 flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Customers', value: totalCustomers, icon: User, color: 'text-primary bg-primary/10' },
            { label: 'Avg Orders', value: (MOCK_CUSTOMERS.reduce((s, c) => s + c.orders, 0) / totalCustomers).toFixed(1), icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' },
            { label: 'Total LTV', value: `$${(totalSpent / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-success bg-success/10' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border/40 rounded-2xl p-3 shadow-card">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${s.color}`}><s.icon size={13} /></div>
              <p className="text-sm font-bold text-foreground font-condensed">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full bg-card border border-border rounded-xl pl-8 pr-3 py-2 text-[11px] text-foreground outline-none focus:border-primary/50 shadow-card" />
        </div>

        {/* Customer list */}
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
          {filtered.map((c, i) => (
            <div key={c.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < filtered.length - 1 ? 'border-b border-border/40' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-hero-gradient flex items-center justify-center text-[11px] font-bold text-primary-foreground flex-shrink-0">
                {c.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[11px] font-bold text-foreground">${c.spent.toFixed(0)}</p>
                <p className="text-[9px] text-muted-foreground">{c.orders} orders</p>
              </div>
              <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
