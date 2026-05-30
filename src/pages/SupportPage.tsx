import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MessageCircle, Clock, ChevronDown, Store, LifeBuoy } from 'lucide-react';
import { useSupportConfig } from '@/context/SupportContext';

function FaqAccordion() {
  const { config } = useSupportConfig();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {config.faqItems.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card"
        >
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          >
            <span className="text-[11px] font-semibold text-foreground leading-snug pr-3">{item.q}</span>
            <motion.span
              animate={{ rotate: openId === item.id ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 text-muted-foreground"
            >
              <ChevronDown size={14} />
            </motion.span>
          </button>
          <AnimatePresence>
            {openId === item.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-[11px] text-muted-foreground leading-relaxed px-4 pb-4 border-t border-border/40 pt-3">
                  {item.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

export default function SupportPage() {
  const { config } = useSupportConfig();

  const contactLinks = [
    { icon: Mail, label: 'Email Us', value: config.email, href: `mailto:${config.email}`, color: 'text-primary bg-primary/10' },
    { icon: Phone, label: 'Call Support', value: config.phone, href: `tel:${config.phone}`, color: 'text-success bg-success/10' },
    { icon: MessageCircle, label: 'Telegram', value: config.telegram, href: `https://t.me/${config.telegram.replace('@', '')}`, color: 'text-sky-500 bg-sky-50' },
    { icon: MessageCircle, label: 'WhatsApp', value: config.whatsapp, href: `https://wa.me/${config.whatsapp.replace(/\D/g, '')}`, color: 'text-emerald-500 bg-emerald-50' },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero */}
      <div className="bg-hero-gradient px-5 pt-6 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
            <LifeBuoy size={22} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-primary-foreground font-bold text-lg font-condensed leading-tight">Support Center</h1>
            <p className="text-primary-foreground/70 text-[10px] mt-0.5">{config.storeName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 bg-primary-foreground/15 rounded-xl px-3 py-2.5">
          <Clock size={12} className="text-primary-foreground/80 flex-shrink-0" />
          <span className="text-[10px] text-primary-foreground/90 font-medium">{config.supportHours}</span>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5 pt-5 pb-6">
        {/* Contact channels */}
        <div>
          <h2 className="text-sm font-bold text-foreground font-condensed mb-3">Contact Us</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {contactLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border border-border/40 rounded-2xl p-3.5 flex flex-col gap-2 shadow-card active:scale-95 transition-transform"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${link.color}`}>
                  <link.icon size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground">{link.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{link.value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-sm font-bold text-foreground font-condensed mb-3">Frequently Asked</h2>
          <FaqAccordion />
        </div>

        {/* About */}
        <div>
          <h2 className="text-sm font-bold text-foreground font-condensed mb-3">About the Store</h2>
          <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-card flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Store size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-foreground">{config.storeName}</p>
              <p className="text-[10px] text-muted-foreground italic mb-2">{config.tagline}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{config.aboutText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
