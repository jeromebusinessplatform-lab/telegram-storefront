import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { CheckoutFieldsConfig, ReceiptFieldsConfig, BotConfig, StoreInfo, ReferralConfig, AnnouncementConfig } from '@/types';
import { Bold, Italic, List, Heading2, Link as LinkIcon, Save, Store, FileText, Bot, Gift, Shield, Megaphone } from 'lucide-react';
import ImageUploadInput from '@/components/common/ImageUploadInput';
import { renderRichTextMarkdown } from '@/lib/rich-text';

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const [storeInfo, setStoreInfo] = useState<StoreInfo>({ name: 'PRIME CORE', tagline: '', pickup_lat: 14.7103888, pickup_lng: 121.0544856, currency: 'PHP', currency_symbol: '₱' });
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
    font_family: 'nunito',
    font_style: 'normal',
    text_color: '#172033',
    accent_color: '#1687ff',
    visual_style: 'clean',
  });
  const [adminCode, setAdminCode] = useState('PRIME2026ADMIN');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('app_settings').select('*');
      if (!data) return;
      data.forEach(row => {
        if (row.key === 'store_info') setStoreInfo(row.value as StoreInfo);
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
    setAnnouncementCfg(p => ({
      ...p,
      body_markdown: p.body_markdown ? `${p.body_markdown}\n${template}` : template,
    }));
  };

  return (
    <AdminLayout title="Settings">
      <Tabs defaultValue="store">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="store" className="text-xs gap-1.5"><Store className="w-3 h-3" />Store</TabsTrigger>
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
                <Button type="button" size="sm" variant="outline" onClick={() => addRichText('[Link text](https://example.com)')} className="h-8 w-8 p-0"><LinkIcon className="h-3.5 w-3.5" /></Button>
              </div>
              <Textarea
                value={announcementCfg.body_markdown}
                onChange={e => setAnnouncementCfg(p => ({ ...p, body_markdown: e.target.value }))}
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
                <Label className="text-xs">Text Color</Label>
                <Input type="color" value={announcementCfg.text_color ?? '#172033'} onChange={e => setAnnouncementCfg(p => ({ ...p, text_color: e.target.value }))} className="mt-1 h-8 p-1" />
              </div>
              <div>
                <Label className="text-xs">Accent Color</Label>
                <Input type="color" value={announcementCfg.accent_color ?? '#1687ff'} onChange={e => setAnnouncementCfg(p => ({ ...p, accent_color: e.target.value }))} className="mt-1 h-8 p-1" />
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
              <div className="space-y-2">
                {announcementCfg.banner_image_url && announcementCfg.display_mode !== 'text' && (
                  <img
                    src={announcementCfg.banner_image_url}
                    alt={announcementCfg.banner_alt || announcementCfg.title || 'Announcement preview'}
                    className="w-full h-36 object-cover rounded-lg border border-border"
                  />
                )}
                {(announcementCfg.title || announcementCfg.body_markdown) && announcementCfg.display_mode !== 'image' && (
                  <div className="rounded-lg border border-border bg-card p-3" style={{ color: announcementCfg.text_color, fontStyle: announcementCfg.font_style === 'italic' ? 'italic' : 'normal' }}>
                    {announcementCfg.title && <h4 className="text-sm font-black" style={{ color: announcementCfg.accent_color }}>{announcementCfg.title}</h4>}
                    {announcementCfg.body_markdown && (
                      <div
                        className="announcement-copy mt-2"
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
