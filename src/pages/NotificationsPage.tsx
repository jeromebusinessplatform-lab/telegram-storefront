import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types';
import { Bell, Package, MessageCircle, Info, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_ICONS: Record<string, React.ElementType> = {
  order: Package,
  support: MessageCircle,
  info: Info,
};

export default function NotificationsPage() {
  const { customer } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!customer?.id) { setIsLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false });
      setNotifications((data as unknown as Notification[]) ?? []);
      setIsLoading(false);
    };
    fetch();
  }, [customer?.id]);

  const markAllRead = async () => {
    if (!customer?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('customer_id', customer.id).eq('is_read', false);
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppLayout showBack title="Notifications">
      <div>
        {unreadCount > 0 && (
          <div className="px-3 pt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary gap-1.5 h-7">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          </div>
        )}
        <div className="px-3 py-2 space-y-2">
          {isLoading ? (
            Array.from({length: 4}).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="font-bold text-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You'll see updates here</p>
            </div>
          ) : (
            notifications.map(notif => {
              const Icon = TYPE_ICONS[notif.type] ?? Info;
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                  className={`rounded-xl p-3 border shadow-brand-sm cursor-pointer transition-colors ${
                    notif.is_read ? 'bg-card border-border' : 'bg-primary-light border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.is_read ? 'bg-muted' : 'bg-primary/10'}`}>
                      <Icon className={`w-4 h-4 ${notif.is_read ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${notif.is_read ? 'text-foreground' : 'text-primary'}`}>{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {new Date(notif.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
