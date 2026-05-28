import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus } from '@/types';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';

const ALL_STATUSES: { value: string; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'payment_submitted', label: 'Payment Submitted' },
  { value: 'payment_verified', label: 'Verified' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      let q = supabase.from('orders').select('*, customers(telegram_first_name, telegram_username, customer_code), payment_methods(name)').order('created_at', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data } = await q;
      setOrders((data as unknown as Order[]) ?? []);
      setIsLoading(false);
    };
    fetchOrders();

    const channel = supabase.channel('admin-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [statusFilter]);

  const filtered = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.customers as {telegram_first_name?: string} | null)?.telegram_first_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Orders">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order / customer..." className="h-8 text-sm pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-sm w-40 flex-shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 rounded-xl bg-muted animate-pulse"/>)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => {
            const cust = order.customers as {telegram_first_name?: string; telegram_username?: string; customer_code?: string} | null;
            return (
              <div key={order.id} onClick={() => navigate(`/admin/orders/${order.id}`)}
                className="bg-card rounded-xl border border-border p-3 flex items-center gap-3 shadow-brand-sm cursor-pointer hover:border-primary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-primary">{order.order_number}</p>
                    <OrderStatusBadge status={order.status as OrderStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cust?.telegram_first_name ?? 'Unknown'} · {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <p className="font-black text-sm">₱{order.total.toFixed(2)}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No orders found</div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
