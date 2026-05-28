import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersPage() {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!customer?.id) { setIsLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, payment_methods(name), delivery_providers(name)')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      setOrders((data as unknown as Order[]) ?? []);
      setIsLoading(false);
    };
    fetch();

    const channel = supabase.channel('orders-customer')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${customer.id}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [customer?.id]);

  return (
    <AppLayout title="My Orders">
      <div className="px-3 py-3 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-8 text-center">
            <Package className="w-14 h-14 text-muted-foreground/40 mb-3" />
            <p className="font-bold text-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-card rounded-xl border border-border p-3 shadow-brand-sm cursor-pointer active:scale-99 transition-transform"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm text-primary">{order.order_number}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <OrderStatusBadge status={order.status} />
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''} · {(order.payment_methods as {name: string} | null)?.name ?? ''}</p>
                  <p className="font-black text-sm text-foreground">₱{order.total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
