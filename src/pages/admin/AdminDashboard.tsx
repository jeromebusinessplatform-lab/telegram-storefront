import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Users, DollarSign, Package, TrendingUp, Clock } from 'lucide-react';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { Order, OrderStatus } from '@/types';
import { useNavigate } from 'react-router-dom';

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, customers: 0, products: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: orderCount }, { data: revenue }, { count: customerCount }, { count: productCount }, { count: pendingCount }, { data: recent }] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total').neq('status', 'cancelled'),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*, customers(telegram_first_name, telegram_username), payment_methods(name)').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalRevenue = (revenue ?? []).reduce((s: number, o: {total: number}) => s + Number(o.total), 0);
      setStats({
        orders: orderCount ?? 0,
        revenue: totalRevenue,
        customers: customerCount ?? 0,
        products: productCount ?? 0,
        pendingOrders: pendingCount ?? 0,
      });
      setRecentOrders((recent as unknown as Order[]) ?? []);
      setIsLoading(false);
    };
    fetchStats();
  }, []);

  const statCards: StatCard[] = [
    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
    { label: 'Revenue', value: `₱${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Customers', value: stats.customers, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Active Products', value: stats.products, icon: Package, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <AdminLayout title="Dashboard">
      {stats.pendingOrders > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800 font-semibold">
            {stats.pendingOrders} pending order{stats.pendingOrders !== 1 ? 's' : ''} awaiting action
          </p>
          <button onClick={() => navigate('/admin/orders')} className="ml-auto text-xs text-yellow-700 font-bold hover:underline">View</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold">{label}</p>
            <p className="text-xl font-black text-foreground mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-brand-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Recent Orders
          </h2>
          <button onClick={() => navigate('/admin/orders')} className="text-xs text-primary font-semibold hover:underline">View all</button>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({length:3}).map((_,i) => <div key={i} className="p-3 h-14 animate-pulse bg-muted/30" />)
          ) : recentOrders.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No orders yet</div>
          ) : recentOrders.map(order => {
            const customer = order.customers as {telegram_first_name?: string; telegram_username?: string} | null;
            return (
              <div
                key={order.id}
                onClick={() => navigate(`/admin/orders/${order.id}`)}
                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary">{order.order_number}</p>
                  <p className="text-[11px] text-muted-foreground">{customer?.telegram_first_name ?? 'Customer'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold">₱{order.total.toFixed(2)}</p>
                  <OrderStatusBadge status={order.status as OrderStatus} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
