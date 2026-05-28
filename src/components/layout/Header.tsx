import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Bell } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  storeName?: string;
  showBack?: boolean;
  title?: string;
}

export default function Header({ storeName = 'PRIME CORE', showBack, title }: HeaderProps) {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { customer } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!customer?.id) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customer.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();

    const channel = supabase
      .channel('notifications-header')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `customer_id=eq.${customer.id}` },
        () => fetchUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [customer?.id]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 bg-background/95 backdrop-blur-sm border-b border-border"
      style={{ height: 'var(--header-height)' }}
    >
      {showBack ? (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-primary font-semibold text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-white text-xs font-black">PC</span>
          </div>
          <span className="font-black text-base text-foreground tracking-tight">{title ?? storeName}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-1.5 rounded-full hover:bg-primary-light transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center badge-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/cart')}
          className="relative p-1.5 rounded-full hover:bg-primary-light transition-colors"
        >
          <ShoppingCart className="w-5 h-5 text-muted-foreground" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
