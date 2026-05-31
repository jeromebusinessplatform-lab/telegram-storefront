import { motion } from 'framer-motion';
import { User, Package, Heart, MapPin, CreditCard, Bell, Shield, ChevronRight, LogOut } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const menuSections = [
  {
    title: 'Account',
    items: [
      { icon: MapPin, label: 'Saved Addresses', color: 'text-primary bg-primary/10' },
      { icon: CreditCard, label: 'Payment Methods', color: 'text-success bg-success/10' },
      { icon: Heart, label: 'Wishlist', color: 'text-rose-500 bg-rose-50' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: Bell, label: 'Notifications', color: 'text-amber-500 bg-amber-50' },
      { icon: Shield, label: 'Privacy & Security', color: 'text-slate-500 bg-slate-100' },
    ],
  },
];

export default function ProfilePage() {
  const { orders } = useCart();
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="flex flex-col min-h-full">
      {/* User card */}
      <div className="mx-4 mt-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-hero-gradient rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
            <User size={26} className="text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-primary-foreground font-bold text-base font-condensed">Guest User</h2>
            <p className="text-primary-foreground/70 text-xs mt-0.5">@shopbot_user</p>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 px-4 mt-3">
        {[
          { label: 'Orders', value: orders.length, icon: Package },
          { label: 'Spent', value: `₱${totalSpent.toFixed(2)}`, icon: CreditCard },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-border/40 rounded-2xl p-3.5 flex items-center gap-2.5 shadow-card"
          >
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
        {menuSections.map((section, si) => (
          <div key={section.title}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors ${
                    i < section.items.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
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

        {/* Logout */}
        <button className="w-full flex items-center justify-center gap-2 py-3.5 text-destructive text-sm font-semibold border border-destructive/30 rounded-2xl hover:bg-destructive/5 transition-colors mb-4">
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </div>
  );
}
