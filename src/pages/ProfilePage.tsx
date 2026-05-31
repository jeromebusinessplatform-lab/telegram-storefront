import { motion } from 'framer-motion';
import { User, Package, Heart, MapPin, CreditCard, Bell, Shield, ChevronRight, Hash } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useTelegramAuth } from '@/context/TelegramAuthContext';
import { fmtPrice } from '@/utils/format';

const menuSections = [
  {
    title: 'Account',
    items: [
      { icon: MapPin,       label: 'Saved Addresses',   color: 'text-primary bg-primary/10'    },
      { icon: CreditCard,   label: 'Payment Methods',   color: 'text-success bg-success/10'    },
      { icon: Heart,        label: 'Wishlist',           color: 'text-rose-500 bg-rose-500/10'  },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: Bell,    label: 'Notifications',    color: 'text-amber-500 bg-amber-500/10' },
      { icon: Shield,  label: 'Privacy & Security', color: 'text-muted-foreground bg-muted' },
    ],
  },
];

export default function ProfilePage() {
  const { orders }               = useCart();
  const { user, customerId }     = useTelegramAuth();
  const totalSpent               = orders.reduce((s, o) => s + o.total, 0);

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ')
    : 'Guest User';
  const displayUsername = user?.username ? `@${user.username}` : 'Telegram User';

  return (
    <div className="flex flex-col min-h-full pb-6">

      {/* User card */}
      <div className="mx-4 mt-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-hero-gradient rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={displayName}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-primary-foreground/30 flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <User size={26} className="text-primary-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-primary-foreground font-bold text-base font-condensed leading-tight">{displayName}</h2>
              <p className="text-primary-foreground/70 text-xs mt-0.5">{displayUsername}</p>
            </div>
          </div>

          {/* Customer ID */}
          {customerId && (
            <div className="mt-3 flex items-center gap-1.5 bg-primary-foreground/10 rounded-xl px-3 py-1.5">
              <Hash size={11} className="text-primary-foreground/60 flex-shrink-0" />
              <div className="flex items-baseline gap-2">
                <span className="text-[9px] font-semibold text-primary-foreground/60 uppercase tracking-wide">Customer ID</span>
                <span className="text-[11px] font-bold text-primary-foreground font-condensed tracking-widest">{customerId}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 px-4 mt-3">
        {[
          { label: 'Orders',       value: orders.length,            icon: Package    },
          { label: 'Total Spent',  value: `₱${fmtPrice(totalSpent)}`, icon: CreditCard },
        ].map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card border border-border/40 rounded-2xl p-3.5 flex items-center gap-2.5 shadow-card">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <stat.icon size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground font-condensed">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Menu sections */}
      <div className="px-4 mt-4 flex flex-col gap-4">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
              {section.items.map((item, i) => (
                <button key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors ${
                    i < section.items.length - 1 ? 'border-b border-border/50' : ''
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon size={15} />
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1 text-left">{item.label}</span>
                  <ChevronRight size={15} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
