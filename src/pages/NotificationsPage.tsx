import { motion } from 'framer-motion';
import { Bell, Tag, Package, Star } from 'lucide-react';

const mockNotifications = [
  { id: '1', icon: Tag, color: 'text-primary bg-primary/10', title: 'Flash Sale is Live!', body: 'Up to 40% off on selected electronics. Limited time.', time: '2m ago' },
  { id: '2', icon: Package, color: 'text-success bg-success/10', title: 'Order Shipped', body: 'Your order ORD-001 is on its way.', time: '1h ago' },
  { id: '3', icon: Star, color: 'text-amber-500 bg-amber-50', title: 'Leave a Review', body: 'How was your AirPods Studio? Share your thoughts.', time: '3h ago' },
  { id: '4', icon: Tag, color: 'text-primary bg-primary/10', title: 'New Arrivals', body: 'Check out our latest Rosé Eau de Parfum — just dropped!', time: 'Yesterday' },
];

export default function NotificationsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground font-condensed">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{mockNotifications.length} unread</p>
      </div>

      <div className="px-4 flex flex-col gap-2.5">
        {mockNotifications.map((n, i) => {
          const Icon = n.icon;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border/40 rounded-2xl p-3.5 flex gap-3 shadow-card"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.color}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground leading-snug">{n.title}</p>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
              </div>
            </motion.div>
          );
        })}

        {/* Empty state placeholder */}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <Bell size={24} className="text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">All caught up! Check back later.</p>
        </div>
      </div>
    </div>
  );
}
