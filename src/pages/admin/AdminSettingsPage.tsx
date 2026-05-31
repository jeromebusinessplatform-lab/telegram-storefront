import { useState, useEffect, useRef, type DragEvent } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { CheckoutFieldsConfig, ReceiptFieldsConfig, BotConfig, StoreInfo, ReferralConfig, AnnouncementConfig, GlobalDesignConfig } from '@/types';
import { Bold, Italic, List, ListOrdered, Heading2, Link as LinkIcon, Save, Store, FileText, Bot, Gift, Shield, Megaphone, Palette, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import ImageUploadInput from '@/components/common/ImageUploadInput';
import { renderRichTextMarkdown } from '@/lib/rich-text';
import { DEFAULT_GLOBAL_DESIGN_CONFIG, GLOBAL_DESIGN_SETTING_KEY, normalizeGlobalDesignConfig } from '@/lib/global-design';

const DECORATOR_PALETTE = [
  { label: 'Sparkles', value: '✨' },
  { label: 'Fire', value: '🔥' },
  { label: 'Star', value: '⭐' },
  { label: 'Rocket', value: '🚀' },
  { label: 'Heart', value: '❤️' },
  { label: 'Check', value: '✅' },
  { label: 'Lightning', value: '⚡' },
  { label: 'Megaphone', value: '📣' },
  { label: 'Gift', value: '🎁' },
  { label: 'Crown', value: '👑' },
  { label: 'Diamond', value: '💎' },
  { label: 'Target', value: '🎯' },
] as const;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const toDateTimeLocal = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };
  const toIsoDateTime = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  };

  const [storeInfo, setStoreInfo] = useState<StoreInfo>({ name: 'PRIME CORE', tagline: '', pickup_lat: 14.7103888, pickup_lng: 121.0544856, currency: 'PHP', currency_symbol: '₱' });
  const [designCfg, setDesignCfg] = useState<GlobalDesignConfig>(DEFAULT_GLOBAL_DESIGN_CONFIG);
  const [checkoutCfg, setCheckoutCfg] = useState<CheckoutFieldsConfig>({ show_phone: true, show_email: true, show_address: true, show_city: true, show_province: true, show_zip: true, show_notes: true });
  const [receiptCfg, setReceiptCfg] = useState<ReceiptFieldsConfig>({ show_order_number: true, show_customer_name: true, show_customer_code: true, show_items: true, show_fees: true, show_delivery_fee: true, show_voucher: true, show_total: true, show_payment_method: true, show_date: true, show_store_name: true });
  const [botCfg, setBotCfg] = useState<BotConfig>({ support_bot_username: '@PrimeCoreSupportBot', bot_token: '', notifications_enabled: false, support_relay_enabled: false });
  const [referralCfg, setReferralCfg] = useState<ReferralConfig>({ enabled: true, referrer_reward_type: 'fixed', referrer_reward_value: 50, referee_reward_type: 'fixed', referee_reward_value: 30 });
  const [announcementCfg, setAnnouncementCfg] = useState<AnnouncementConfig>({
    enabled: false,
    display_mode: 'both',
    title: '',
    body_markdown: '',
    banner_image_url: '',
    banner_alt: 'Store announcement',
    auto_publish: false,
    publish_at: '',
    auto_takedown: false,
    takedown_at: '',
    font_family: 'nunito',
    font_style: 'normal',
    font_size: 16,
    text_color: '#172033',
    accent_color: '#1687ff',
    text_align: 'left',
    visual_style: 'clean',
  });
  const [adminCode, setAdminCode] = useState('PRIME2026ADMIN');
  const [isSaving, setIsSaving] = useState(false);
  const announcementBodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('app_settings').select('*');
      if (!data) return;
      data.forEach(row => {
        if (row.key === 'store_info') setStoreInfo(row.value as StoreInfo);
        if (row.key === 'global_design_config') setDesignCfg(normalizeGlobalDesignConfig(row.value));
        if (row.key === 'checkout_fields_config') setCheckoutCfg(row.value as CheckoutFieldsConfig);
        if (row.key === 'receipt_fields_config') setReceiptCfg(row.value as ReceiptFieldsConfig);
        if (row.key === 'bot_config') setBotCfg(row.value as BotConfig);
        if (row.key === 'referral_config') setReferralCfg(row.value as ReferralConfig);
        if (row.key === 'announcement_config') setAnnouncementCfg(row.value as AnnouncementConfig);
        if (row.key === 'admin_access_code') setAdminCode((row.value as {code: string}).code);
      });
    };
    load();
  }, []);

  const saveSetting = async (key: string, value: unknown) => {
    await supabase.from('app_settings').upsert({ key, value }, { onConflict: 'key' });
  };

  const saveAll = async () => {
    setIsSaving(true);
    await Promise.all([
      saveSetting('store_info', storeInfo),
      saveSetting(GLOBAL_DESIGN_SETTING_KEY, designCfg),
      saveSetting('checkout_fields_config', checkoutCfg),
      saveSetting('receipt_fields_config', receiptCfg),
      saveSetting('bot_config', botCfg),
      saveSetting('referral_config', referralCfg),
      saveSetting('announcement_config', announcementCfg),
      saveSetting('admin_access_code', { code: adminCode }),
    ]);
    toast({ description: 'Settings saved!' });
    setIsSaving(false);
  };

  const CheckboxField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-1.5">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  const addRichText = (template: string) => {
    const textarea = announcementBodyRef.current;
    setAnnouncementCfg((prev) => {
      const current = prev.body_markdown ?? '';
      if (!textarea) {
        return {
          ...prev,
          body_markdown: current ? `${current}\n${template}` : template,
        };
      }

      const start = textarea.selectionStart ?? current.length;
      const end = textarea.selectionEnd ?? current.length;
      const next = `${current.slice(0, start)}${template}${current.slice(end)}`;
      requestAnimationFrame(() => {
        const position = start + template.length;
        textarea.focus();
        textarea.setSelectionRange(position, position);
      });

      return {
        ...prev,
        body_markdown: next,
      };
    });
  };
  const insertDecorator = (value: string) => addRichText(value);
  const handlePaletteDragStart = (event: DragEvent<HTMLButtonElement>, value: string) => {
    event.dataTransfer.setData('text/plain', value);
    event.dataTransfer.effectAllowed = 'copy';
  };
  const handlePaletteDrop = (event: DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const value = event.dataTransfer.getData('text/plain');
    if (value) insertDecorator(value);
  };
  const hasAnnouncementSchedule = Boolean(announcementCfg.auto_publish || announcementCfg.auto_takedown);

  return (
    <AdminLayout title="Settings">
      <Tabs defaultValue="store">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="store" className="text-xs gap-1.5"><Store className="w-3 h-3" />Store</TabsTrigger>
          <TabsTrigger value="designer" className="text-xs gap-1.5"><Palette className="w-3 h-3" />Designer</TabsTrigger>
          <TabsTrigger value="checkout" className="text-xs gap-1.5"><FileText className="w-3 h-3" />Checkout</TabsTrigger>
          <TabsTrigger value="receipt" className="text-xs gap-1.5"><FileText className="w-3 h-3" />Receipt</TabsTrigger>
          <TabsTrigger value="bot" className="text-xs gap-1.5"><Bot className="w-3 h-3" />Bot</TabsTrigger>
          <TabsTrigger value="referral" className="text-xs gap-1.5"><Gift className="w-3 h-3" />Referral</TabsTrigger>
          <TabsTrigger value="announcement" className="text-xs gap-1.5"><Megaphone className="w-3 h-3" />Announcement</TabsTrigger>
          <TabsTrigger value="security" className="text-xs gap-1.5"><Shield className="w-3 h-3" />Security</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm space-y-3">
            <h3 className="text-sm font-bold">Store Information</h3>
            <div><Label className="text-xs">Store Name</Label><Input value={storeInfo.name} onChange={e => setStoreInfo(p => ({ ...p, name: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            <div><Label className="text-xs">Tagline</Label><Input value={storeInfo.tagline} onChange={e => setStoreInfo(p => ({ ...p, tagline: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Pickup Latitude</Label><Input type="number" value={storeInfo.pickup_lat} onChange={e => setStoreInfo(p => ({ ...p, pickup_lat: parseFloat(e.target.value) }))} className="mt-1 h-8 text-sm" /></div>
              <div><Label className="text-xs">Pickup Longitude</Label><Input type="number" value={storeInfo.pickup_lng} onChange={e => setStoreInfo(p => ({ ...p, pickup_lng: parseFloat(e.target.value) }))} className="mt-1 h-8 text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Currency Code</Label><Input value={storeInfo.currency} onChange={e => setStoreInfo(p => ({ ...p, currency: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
              <div><Label className="text-xs">Currency Symbol</Label><Input value={storeInfo.currency_symbol} onChange={e => setStoreInfo(p => ({ ...p, currency_symbol: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="designer">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold">Global Designer</h3>
                <p className="text-[11px] text-muted-foreground">
                  These settings affect the whole app. Save once, then the storefront and admin shell update live.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Logo</Label>
                  <ImageUploadInput
                    label="Upload Logo"
                    value={designCfg.logo_url}
                    onChange={(url) => setDesignCfg((prev) => ({ ...prev, logo_url: url }))}
                  />
                </div>
                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs">Primary Color</Label>
                    <Input type="color" value={designCfg.primary_color} onChange={(e) => setDesignCfg((prev) => ({ ...prev, primary_color: e.target.value }))} className="mt-1 h-8 p-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Accent Color</Label>
                    <Input type="color" value={designCfg.accent_color} onChange={(e) => setDesignCfg((prev) => ({ ...prev, accent_color: e.target.value }))} className="mt-1 h-8 p-1" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label className="text-xs">Background</Label>
                  <Input type="color" value={designCfg.background_color} onChange={(e) => setDesignCfg((prev) => ({ ...prev, background_color: e.target.value }))} className="mt-1 h-8 p-1" />
                </div>
                <div>
                  <Label className="text-xs">Foreground</Label>
                  <Input type="color" value={designCfg.foreground_color} onChange={(e) => setDesignCfg((prev) => ({ ...prev, foreground_color: e.target.value }))} className="mt-1 h-8 p-1" />
                </div>
                <div>
                  <Label className="text-xs">Card Color</Label>
                  <Input type="color" value={designCfg.card_color} onChange={(e) => setDesignCfg((prev) => ({ ...prev, card_color: e.target.value }))} className="mt-1 h-8 p-1" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label className="text-xs">Border Color</Label>
                  <Input type="color" value={designCfg.border_color} onChange={(e) => setDesignCfg((prev) => ({ ...prev, border_color: e.target.value }))} className="mt-1 h-8 p-1" />
                </div>
                <div>
                  <Label className="text-xs">Primary Light</Label>
                  <Input type="color" value={designCfg.primary_light_color} onChange={(e) => setDesignCfg((prev) => ({ ...prev, primary_light_color: e.target.value }))} className="mt-1 h-8 p-1" />
                </div>
                <div>
                  <Label className="text-xs">Glow Color</Label>
                  <Input type="color" value={designCfg.primary_glow_color} onChange={(e) => setDesignCfg((prev) => ({ ...prev, primary_glow_color: e.target.value }))} className="mt-1 h-8 p-1" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label className="text-xs">Body Font</Label>
                  <select
                    value={designCfg.body_font_family}
                    onChange={(e) => setDesignCfg((prev) => ({ ...prev, body_font_family: e.target.value as GlobalDesignConfig['body_font_family'] }))}
                    className="mt-1 h-8 text-sm w-full border border-border rounded-md px-2 bg-background"
                  >
                    <option value="roboto">Roboto</option>
                    <option value="condensed">Roboto Condensed</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Section Font</Label>
                  <select
                    value={designCfg.section_font_family}
                    onChange={(e) => setDesignCfg((prev) => ({ ...prev, section_font_family: e.target.value as GlobalDesignConfig['section_font_family'] }))}
                    className="mt-1 h-8 text-sm w-full border border-border rounded-md px-2 bg-background"
                  >
                    <option value="condensed">Roboto Condensed</option>
                    <option value="roboto">Roboto</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Radius: {designCfg.radius}px</Label>
                  <Input
                    type="range"
                    min="0"
                    max="32"
                    step="1"
                    value={designCfg.radius}
                    onChange={(e) => setDesignCfg((prev) => ({ ...prev, radius: parseInt(e.target.value, 10) }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Header Height: {designCfg.header_height}px</Label>
                  <Input
                    type="range"
                    min="44"
                    max="96"
                    step="1"
                    value={designCfg.header_height}
                    onChange={(e) => setDesignCfg((prev) => ({ ...prev, header_height: parseInt(e.target.value, 10) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Bottom Nav Height: {designCfg.bottom_nav_height}px</Label>
                  <Input
                    type="range"
                    min="48"
                    max="96"
                    step="1"
                    value={designCfg.bottom_nav_height}
                    onChange={(e) => setDesignCfg((prev) => ({ ...prev, bottom_nav_height: parseInt(e.target.value, 10) }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm">
              <div className="rounded-2xl border border-border p-4" style={{ background: designCfg.background_color, color: designCfg.foreground_color, borderRadius: `${designCfg.radius}px` }}>
                <div className="flex items-center gap-3">
                  <img src={designCfg.logo_url || '/prime-core-logo.svg'} alt="Logo preview" className="h-8 w-auto object-contain" />
                  <div>
                    <p className="text-sm font-black">PRIME CORE</p>
                    <p className="text-[11px] opacity-70">Global designer preview</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl p-3" style={{ background: designCfg.card_color, border: `1px solid ${designCfg.border_color}` }}>
                  <p className="text-xs font-bold">This preview updates the app shell colors and logo.</p>
                  <p className="mt-1 text-[11px] opacity-70">
                    Save the designer to apply the brand system across the storefront and admin panel.
                  </p>
                  <button className="mt-3 rounded-lg px-3 py-2 text-[11px] font-bold text-white" style={{ background: designCfg.primary_color }}>
                    Sample Primary Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checkout">
          <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm space-y-1">
            <h3 className="text-sm font-bold mb-2">Checkout Fields Visibility</h3>
            <CheckboxField label="Phone Number" checked={checkoutCfg.show_phone} onChange={v => setCheckoutCfg(p => ({ ...p, show_phone: v }))} />
            <CheckboxField label="Email Address" checked={checkoutCfg.show_email} onChange={v => setCheckoutCfg(p => ({ ...p, show_email: v }))} />
            <CheckboxField label="Street Address" checked={checkoutCfg.show_address} onChange={v => setCheckoutCfg(p => ({ ...p, show_address: v }))} />
            <CheckboxField label="City" checked={checkoutCfg.show_city} onChange={v => setCheckoutCfg(p => ({ ...p, show_city: v }))} />
            <CheckboxField label="Province" checked={checkoutCfg.show_province} onChange={v => setCheckoutCfg(p => ({ ...p, show_province: v }))} />
            <CheckboxField label="ZIP Code" checked={checkoutCfg.show_zip} onChange={v => setCheckoutCfg(p => ({ ...p, show_zip: v }))} />
            <CheckboxField label="Order Notes" checked={checkoutCfg.show_notes} onChange={v => setCheckoutCfg(p => ({ ...p, show_notes: v }))} />
          </div>
        </TabsContent>

        <TabsContent value="receipt">
          <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm space-y-1">
            <h3 className="text-sm font-bold mb-2">Receipt Fields Visibility</h3>
            <CheckboxField label="Order Number" checked={receiptCfg.show_order_number} onChange={v => setReceiptCfg(p => ({ ...p, show_order_number: v }))} />
            <CheckboxField label="Customer Name" checked={receiptCfg.show_customer_name} onChange={v => setReceiptCfg(p => ({ ...p, show_customer_name: v }))} />
            <CheckboxField label="Customer ID" checked={receiptCfg.show_customer_code} onChange={v => setReceiptCfg(p => ({ ...p, show_customer_code: v }))} />
            <CheckboxField label="Items List" checked={receiptCfg.show_items} onChange={v => setReceiptCfg(p => ({ ...p, show_items: v }))} />
            <CheckboxField label="Fees & Charges" checked={receiptCfg.show_fees} onChange={v => setReceiptCfg(p => ({ ...p, show_fees: v }))} />
            <CheckboxField label="Delivery Fee" checked={receiptCfg.show_delivery_fee} onChange={v => setReceiptCfg(p => ({ ...p, show_delivery_fee: v }))} />
            <CheckboxField label="Voucher Discount" checked={receiptCfg.show_voucher} onChange={v => setReceiptCfg(p => ({ ...p, show_voucher: v }))} />
            <CheckboxField label="Total Amount" checked={receiptCfg.show_total} onChange={v => setReceiptCfg(p => ({ ...p, show_total: v }))} />
            <CheckboxField label="Payment Method" checked={receiptCfg.show_payment_method} onChange={v => setReceiptCfg(p => ({ ...p, show_payment_method: v }))} />
            <CheckboxField label="Order Date" checked={receiptCfg.show_date} onChange={v => setReceiptCfg(p => ({ ...p, show_date: v }))} />
            <CheckboxField label="Store Name" checked={receiptCfg.show_store_name} onChange={v => setReceiptCfg(p => ({ ...p, show_store_name: v }))} />
          </div>
        </TabsContent>

        <TabsContent value="bot">
          <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm space-y-3">
            <h3 className="text-sm font-bold">Telegram Bot Configuration</h3>
            <div><Label className="text-xs">Support Bot Username</Label><Input value={botCfg.support_bot_username} onChange={e => setBotCfg(p => ({ ...p, support_bot_username: e.target.value }))} placeholder="@YourBotName" className="mt-1 h-8 text-sm" /></div>
            <div><Label className="text-xs">Bot Token (stored securely)</Label><Input type="password" value={botCfg.bot_token} onChange={e => setBotCfg(p => ({ ...p, bot_token: e.target.value }))} placeholder="••••••••" className="mt-1 h-8 text-sm" /></div>
            <div className="flex items-center justify-between py-1"><Label className="text-sm">Enable Order Notifications</Label><Switch checked={botCfg.notifications_enabled} onCheckedChange={v => setBotCfg(p => ({ ...p, notifications_enabled: v }))} /></div>
            <div className="flex items-center justify-between py-1"><Label className="text-sm">Enable Support Relay</Label><Switch checked={botCfg.support_relay_enabled} onCheckedChange={v => setBotCfg(p => ({ ...p, support_relay_enabled: v }))} /></div>
          </div>
        </TabsContent>

        <TabsContent value="referral">
          <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm space-y-3">
            <h3 className="text-sm font-bold">Referral Program</h3>
            <div className="flex items-center justify-between"><Label className="text-sm">Enable Referral Program</Label><Switch checked={referralCfg.enabled} onCheckedChange={v => setReferralCfg(p => ({ ...p, enabled: v }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Referrer Reward Type</Label>
                <select value={referralCfg.referrer_reward_type} onChange={e => setReferralCfg(p => ({ ...p, referrer_reward_type: e.target.value as 'fixed' | 'percent' }))} className="mt-1 h-8 text-sm w-full border border-border rounded-md px-2">
                  <option value="fixed">Fixed (₱)</option><option value="percent">Percent (%)</option>
                </select>
              </div>
              <div><Label className="text-xs">Reward Value</Label><Input type="number" value={referralCfg.referrer_reward_value} onChange={e => setReferralCfg(p => ({ ...p, referrer_reward_value: parseFloat(e.target.value) || 0 }))} className="mt-1 h-8 text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Referee Reward Type</Label>
                <select value={referralCfg.referee_reward_type} onChange={e => setReferralCfg(p => ({ ...p, referee_reward_type: e.target.value as 'fixed' | 'percent' }))} className="mt-1 h-8 text-sm w-full border border-border rounded-md px-2">
                  <option value="fixed">Fixed (₱)</option><option value="percent">Percent (%)</option>
                </select>
              </div>
              <div><Label className="text-xs">Reward Value</Label><Input type="number" value={referralCfg.referee_reward_value} onChange={e => setReferralCfg(p => ({ ...p, referee_reward_value: parseFloat(e.target.value) || 0 }))} className="mt-1 h-8 text-sm" /></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="announcement">
          <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">Announcement Panel</h3>
                <p className="text-[11px] text-muted-foreground">Publish an image banner, a rich text announcement, or both on the Products page.</p>
              </div>
              <Switch checked={announcementCfg.enabled} onCheckedChange={v => setAnnouncementCfg(p => ({ ...p, enabled: v }))} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <Label className="text-xs font-semibold">Auto Publish</Label>
                  <p className="text-[11px] text-muted-foreground">Show the banner once the publish time is reached.</p>
                </div>
                <Switch checked={announcementCfg.auto_publish ?? false} onCheckedChange={v => setAnnouncementCfg(p => ({ ...p, auto_publish: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <Label className="text-xs font-semibold">Auto Takedown</Label>
                  <p className="text-[11px] text-muted-foreground">Hide the banner once the takedown time is reached.</p>
                </div>
                <Switch checked={announcementCfg.auto_takedown ?? false} onCheckedChange={v => setAnnouncementCfg(p => ({ ...p, auto_takedown: v }))} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs">Publish At</Label>
                <Input
                  type="datetime-local"
                  value={toDateTimeLocal(announcementCfg.publish_at)}
                  onChange={e => setAnnouncementCfg(p => ({ ...p, publish_at: toIsoDateTime(e.target.value) }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Takedown At</Label>
                <Input
                  type="datetime-local"
                  value={toDateTimeLocal(announcementCfg.takedown_at)}
                  onChange={e => setAnnouncementCfg(p => ({ ...p, takedown_at: toIsoDateTime(e.target.value) }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Display Mode</Label>
              <select
                value={announcementCfg.display_mode}
                onChange={e => setAnnouncementCfg(p => ({ ...p, display_mode: e.target.value as AnnouncementConfig['display_mode'] }))}
                className="mt-1 h-8 text-sm w-full border border-border rounded-md px-2 bg-background"
              >
                <option value="both">Image + Text</option>
                <option value="image">Image Only</option>
                <option value="text">Text Only</option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={announcementCfg.title}
                onChange={e => setAnnouncementCfg(p => ({ ...p, title: e.target.value }))}
                placeholder="Weekend Sale"
                className="mt-1 h-8 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">Announcement Body</Label>
              <div className="mt-1 mb-2 flex flex-wrap gap-1.5">
                <Button type="button" size="sm" variant="outline" onClick={() => addRichText('**Bold text**')} className="h-8 w-8 p-0"><Bold className="h-3.5 w-3.5" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => addRichText('*Italic text*')} className="h-8 w-8 p-0"><Italic className="h-3.5 w-3.5" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => addRichText('## Heading')} className="h-8 w-8 p-0"><Heading2 className="h-3.5 w-3.5" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => addRichText('- Bullet item')} className="h-8 w-8 p-0"><List className="h-3.5 w-3.5" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => addRichText('1. Numbered item')} className="h-8 w-8 p-0"><ListOrdered className="h-3.5 w-3.5" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => addRichText('[Link text](https://example.com)')} className="h-8 w-8 p-0"><LinkIcon className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="mb-2 rounded-lg border border-dashed border-border bg-muted/20 p-2">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Drag emoticons and icons into the body
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DECORATOR_PALETTE.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      draggable
                      title={`Drag ${item.label}`}
                      onClick={() => insertDecorator(item.value)}
                      onDragStart={(event) => handlePaletteDragStart(event, item.value)}
                      className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-medium shadow-sm transition-transform hover:-translate-y-0.5"
                    >
                      <span aria-hidden="true" className="text-base leading-none">{item.value}</span>
                      <span className="text-[11px] text-muted-foreground">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                ref={announcementBodyRef}
                value={announcementCfg.body_markdown}
                onChange={e => setAnnouncementCfg(p => ({ ...p, body_markdown: e.target.value }))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handlePaletteDrop}
                placeholder={"Use markdown for rich text.\n\nExample:\n**Bold text**\n*Italic text*\n- Bullet 1\n- Bullet 2\n[Link text](https://example.com)"}
                className="mt-1 text-sm h-32 resize-none"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Supports bold, italic, bullet lists, headings, code, and links.</p>
            </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Font</Label>
                  <select
                    value={announcementCfg.font_family ?? 'nunito'}
                  onChange={e => setAnnouncementCfg(p => ({ ...p, font_family: e.target.value as AnnouncementConfig['font_family'] }))}
                  className="mt-1 h-8 text-sm w-full border border-border rounded-md px-2 bg-background"
                >
                  <option value="nunito">Nunito</option>
                  <option value="noto">Noto Sans</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Mono</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Font Style</Label>
                <select
                  value={announcementCfg.font_style ?? 'normal'}
                  onChange={e => setAnnouncementCfg(p => ({ ...p, font_style: e.target.value as AnnouncementConfig['font_style'] }))}
                  className="mt-1 h-8 text-sm w-full border border-border rounded-md px-2 bg-background"
                  >
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Font Size: {announcementCfg.font_size ?? 16}px</Label>
                  <Input
                    type="range"
                    min="12"
                    max="28"
                    step="1"
                    value={announcementCfg.font_size ?? 16}
                    onChange={e => setAnnouncementCfg(p => ({ ...p, font_size: parseInt(e.target.value, 10) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Text Color</Label>
                  <Input type="color" value={announcementCfg.text_color ?? '#172033'} onChange={e => setAnnouncementCfg(p => ({ ...p, text_color: e.target.value }))} className="mt-1 h-8 p-1" />
                </div>
                <div>
                  <Label className="text-xs">Accent Color</Label>
                  <Input type="color" value={announcementCfg.accent_color ?? '#1687ff'} onChange={e => setAnnouncementCfg(p => ({ ...p, accent_color: e.target.value }))} className="mt-1 h-8 p-1" />
                </div>
                <div>
                  <Label className="text-xs">Alignment</Label>
                  <div className="mt-1 flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={announcementCfg.text_align === 'left' ? 'default' : 'outline'}
                      className="h-8 w-8 p-0"
                      onClick={() => setAnnouncementCfg((p) => ({ ...p, text_align: 'left' }))}
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={announcementCfg.text_align === 'center' ? 'default' : 'outline'}
                      className="h-8 w-8 p-0"
                      onClick={() => setAnnouncementCfg((p) => ({ ...p, text_align: 'center' }))}
                    >
                      <AlignCenter className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={announcementCfg.text_align === 'right' ? 'default' : 'outline'}
                      className="h-8 w-8 p-0"
                      onClick={() => setAnnouncementCfg((p) => ({ ...p, text_align: 'right' }))}
                    >
                      <AlignRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Visual Style</Label>
                  <select
                    value={announcementCfg.visual_style ?? 'clean'}
                    onChange={e => setAnnouncementCfg(p => ({ ...p, visual_style: e.target.value as AnnouncementConfig['visual_style'] }))}
                  className="mt-1 h-8 text-sm w-full border border-border rounded-md px-2 bg-background"
                >
                  <option value="clean">Clean</option>
                  <option value="soft">Soft</option>
                  <option value="bold">Bold</option>
                  <option value="outlined">Outlined</option>
                </select>
              </div>
            </div>

            <ImageUploadInput
              value={announcementCfg.banner_image_url}
              onChange={url => setAnnouncementCfg(p => ({ ...p, banner_image_url: url }))}
              label="Banner Image"
            />

            <div>
              <Label className="text-xs">Banner Alt Text</Label>
              <Input
                value={announcementCfg.banner_alt}
                onChange={e => setAnnouncementCfg(p => ({ ...p, banner_alt: e.target.value }))}
                placeholder="Announcement banner"
                className="mt-1 h-8 text-sm"
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Preview</div>
              {hasAnnouncementSchedule && (
                <p className="mb-2 text-[11px] text-muted-foreground">
                  {announcementCfg.auto_publish && announcementCfg.publish_at ? `Publishes at ${new Date(announcementCfg.publish_at).toLocaleString()}. ` : ''}
                  {announcementCfg.auto_takedown && announcementCfg.takedown_at ? `Takes down at ${new Date(announcementCfg.takedown_at).toLocaleString()}.` : ''}
                </p>
              )}
              <div className="space-y-2">
                {announcementCfg.banner_image_url && announcementCfg.display_mode !== 'text' && (
                  <img
                    src={announcementCfg.banner_image_url}
                    alt={announcementCfg.banner_alt || announcementCfg.title || 'Announcement preview'}
                    className="w-full h-36 object-cover rounded-lg border border-border"
                  />
                )}
                {(announcementCfg.title || announcementCfg.body_markdown) && announcementCfg.display_mode !== 'image' && (
                  <div
                    className="rounded-lg border border-border bg-card p-3"
                    style={{
                      color: announcementCfg.text_color,
                      fontStyle: announcementCfg.font_style === 'italic' ? 'italic' : 'normal',
                      fontSize: `${announcementCfg.font_size ?? 16}px`,
                      textAlign: announcementCfg.text_align ?? 'left',
                    }}
                  >
                    {announcementCfg.title && <h4 className="font-black" style={{ color: announcementCfg.accent_color }}>{announcementCfg.title}</h4>}
                    {announcementCfg.body_markdown && (
                      <div
                        className="announcement-copy mt-2"
                        style={{ textAlign: announcementCfg.text_align ?? 'left' }}
                        dangerouslySetInnerHTML={{ __html: renderRichTextMarkdown(announcementCfg.body_markdown) }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm space-y-3">
            <h3 className="text-sm font-bold">Security</h3>
            <div>
              <Label className="text-xs">Admin Access Code</Label>
              <Input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)} placeholder="New access code" className="mt-1 h-8 text-sm font-mono" />
              <p className="text-[11px] text-muted-foreground mt-1">Change this code to update admin login. Keep it secure!</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button onClick={saveAll} disabled={isSaving} className="w-full btn-gradient font-bold gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </AdminLayout>
  );
}
