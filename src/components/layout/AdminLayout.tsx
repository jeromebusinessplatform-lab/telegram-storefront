import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, CreditCard, Truck,
  DollarSign, Settings, MessageCircle, Bell, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: Tag, label: 'Vouchers', path: '/admin/vouchers' },
  { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
  { icon: Truck, label: 'Delivery', path: '/admin/delivery' },
  { icon: DollarSign, label: 'Fees & Charges', path: '/admin/fees' },
  { icon: MessageCircle, label: 'Support', path: '/admin/support' },
  { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeLabel = useMemo(() => {
    const pad = (value: number) => String(value).padStart(2, '0');
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const year = String(now.getFullYear());
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const time = `${pad(hours)}:${minutes}:${seconds} ${period}`;
    return `${month}${day}${year} | ${time}`;
  }, [now]);

  const storeStatus = useMemo(() => (isAdmin ? 'STORE IS OPEN' : ''), [isAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-black">PC</span>
            </div>
            <div>
          <div className="section-font text-[8px] text-foreground">PRIME CORE</div>
          <div className="text-[8px] text-muted-foreground font-medium">Admin Panel</div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <button
              key={path}
              onClick={() => { navigate(path); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-brand-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left text-[8px]">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex w-full h-full bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 h-full bg-background border-r border-border flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-background border-r border-border">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2 bg-background border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-md hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
            <img src="/prime-core-logo.svg" alt="Prime Core logo" className="h-9 w-auto object-contain" />
          </div>

          <h1 className="section-font text-[8px] text-foreground text-center whitespace-nowrap">
            {title}
          </h1>

          <div className="flex flex-col items-end justify-center text-right leading-none min-w-0">
            <div className="text-[8px] font-semibold text-foreground tabular-nums whitespace-nowrap">
              {timeLabel}
            </div>
            {storeStatus && (
              <div className="mt-1 text-[8px] font-black tracking-wide text-emerald-500 whitespace-nowrap">
                {storeStatus}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
