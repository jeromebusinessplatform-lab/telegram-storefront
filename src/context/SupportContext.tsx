import React, { createContext, useContext, useState, useCallback } from 'react';

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export interface SupportConfig {
  storeName: string;
  tagline: string;
  email: string;
  phone: string;
  telegram: string;
  whatsapp: string;
  supportHours: string;
  aboutText: string;
  faqItems: FaqItem[];
}

const defaultConfig: SupportConfig = {
  storeName: 'ShopBot Store',
  tagline: 'Your trusted mini store on Telegram',
  email: 'support@shopbot.store',
  phone: '+1 234 567 890',
  telegram: '@shopbot_support',
  whatsapp: '+1 234 567 890',
  supportHours: 'Mon–Fri, 9am–6pm UTC',
  aboutText:
    'ShopBot is a modern Telegram mini store offering quality products at great prices. We are committed to fast delivery, secure payments, and excellent customer service.',
  faqItems: [
    { id: '1', q: 'How do I place an order?', a: 'Browse our products, add items to your cart, then tap "Place Order" in the Cart tab.' },
    { id: '2', q: 'What payment methods do you accept?', a: 'We accept Telegram Stars, credit/debit cards, and selected digital wallets.' },
    { id: '3', q: 'How long does shipping take?', a: 'Standard shipping takes 3–7 business days. Express shipping is available at checkout.' },
    { id: '4', q: 'Can I return a product?', a: 'Yes, we offer a 30-day return policy on all items. Contact support to initiate a return.' },
    { id: '5', q: 'How do I track my order?', a: 'Go to the Orders tab in the app. Your order status updates in real time.' },
  ],
};

interface SupportContextType {
  config: SupportConfig;
  updateConfig: (partial: Partial<SupportConfig>) => void;
  addFaq: (item: Omit<FaqItem, 'id'>) => void;
  updateFaq: (id: string, item: Partial<FaqItem>) => void;
  removeFaq: (id: string) => void;
}

const SupportContext = createContext<SupportContextType | null>(null);

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SupportConfig>(defaultConfig);

  const updateConfig = useCallback((partial: Partial<SupportConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const addFaq = useCallback((item: Omit<FaqItem, 'id'>) => {
    setConfig((prev) => ({
      ...prev,
      faqItems: [...prev.faqItems, { ...item, id: Date.now().toString() }],
    }));
  }, []);

  const updateFaq = useCallback((id: string, item: Partial<FaqItem>) => {
    setConfig((prev) => ({
      ...prev,
      faqItems: prev.faqItems.map((f) => (f.id === id ? { ...f, ...item } : f)),
    }));
  }, []);

  const removeFaq = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      faqItems: prev.faqItems.filter((f) => f.id !== id),
    }));
  }, []);

  return (
    <SupportContext.Provider value={{ config, updateConfig, addFaq, updateFaq, removeFaq }}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupportConfig() {
  const ctx = useContext(SupportContext);
  if (!ctx) throw new Error('useSupportConfig must be used inside SupportProvider');
  return ctx;
}
