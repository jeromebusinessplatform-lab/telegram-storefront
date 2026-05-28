import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus } from '@/types';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import ReceiptModal from '@/components/common/ReceiptModal';
import ImagePreviewDialog from '@/components/common/ImagePreviewDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Check, X, FileText, AlertTriangle, Image as ImageIcon, Download } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { formatShippingAddress } from '@/lib/address';

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'payment_submitted', label: 'Payment Submitted' },
  { value: 'payment_verified', label: 'Payment Verified' },
  { value: 'processing', label: 'Processing' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [notes, setNotes] = useState('');
  const [deliveryFeeOverride, setDeliveryFeeOverride] = useState<string>('');
  const [deliveryTrackingUrl, setDeliveryTrackingUrl] = useState('');
  const [issueMessage, setIssueMessage] = useState('');
  const [isNotifyingIssue, setIsNotifyingIssue] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPaymentProof, setShowPaymentProof] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('orders').select('*, customers(*), payment_methods(*), delivery_providers(*)').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) {
        const ord = data as unknown as Order;
        setOrder(ord);
        setStatus(ord.status);
        setNotes(ord.notes ?? '');
        setDeliveryFeeOverride(String(ord.delivery_fee ?? 0));
        setDeliveryTrackingUrl(ord.delivery_tracking_url ?? '');
      }
    });
  }, [id]);

  const updateOrder = async () => {
    if (!order) return;
    setIsSaving(true);

    const parsedOverride = Number(deliveryFeeOverride);
    const newDeliveryFee = Number.isFinite(parsedOverride) ? Math.max(0, parsedOverride) : order.delivery_fee;
    const feeDiff = newDeliveryFee - order.delivery_fee;
    const newTotal = Math.max(0, order.total + feeDiff);
    await supabase.from('orders').update({
      status,
      notes,
      delivery_fee: newDeliveryFee,
      total: newTotal,
      delivery_tracking_url: deliveryTrackingUrl.trim() || null,
    }).eq('id', order.id);

    // Handle referral rewards on first delivery
    if (status === 'delivered' && order.status !== 'delivered') {
      const cust = order.customers as {id: string; telegram_id: string; referred_by?: string; customer_code: string} | null;
      if (cust?.referred_by) {
        try {
          // Check if this is the first completed order for this customer
          const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true })
            .eq('customer_id', cust.id).eq('status', 'delivered');
          if (!count || count === 0) {
            // First delivered order - generate referral rewards
            const { data: rcfg } = await supabase.from('app_settings').select('value').eq('key', 'referral_config').maybeSingle();
            const referralConfig = rcfg?.value as { enabled: boolean; referrer_reward_type: string; referrer_reward_value: number; referee_reward_type: string; referee_reward_value: number } | null;
            if (referralConfig?.enabled) {
              const makeCode = () => 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
              // Referrer reward
              const { data: referrer } = await supabase.from('customers').select('id').eq('customer_code', cust.referred_by).maybeSingle();
              if (referrer) {
                await supabase.from('vouchers').insert({
                  code: makeCode(), discount_type: referralConfig.referrer_reward_type,
                  discount_value: referralConfig.referrer_reward_value, is_active: true, is_referral: true,
                  referrer_customer_code: cust.referred_by, min_order_amount: 0, used_count: 0,
                });
                await supabase.from('notifications').insert({
                  customer_id: referrer.id, type: 'info',
                  title: 'Referral Reward!',
                  message: `You earned a reward voucher for referring a customer! Check your vouchers.`,
                });
              }
              // Referee reward
              await supabase.from('vouchers').insert({
                code: makeCode(), discount_type: referralConfig.referee_reward_type,
                discount_value: referralConfig.referee_reward_value, is_active: true, is_referral: true,
                referrer_customer_code: cust.referred_by, min_order_amount: 0, used_count: 0,
              });
              await supabase.from('notifications').insert({
                customer_id: cust.id, type: 'info',
                title: 'Welcome Reward!',
                message: `You earned a reward voucher for your first order! Check your vouchers.`,
              });
            }
          }
        } catch (e) { console.warn('Referral reward error', e); }
      }
    }

    // Send notification to customer
    if (order.customers) {
      const cust = order.customers as {telegram_id: string; id: string};
      const trackingLink = deliveryTrackingUrl.trim();
      const trackingNote = status === 'dispatched' && trackingLink
        ? ` Live tracking: ${trackingLink}`
        : '';
      await supabase.from('notifications').insert({
        customer_id: cust.id,
        title: `Order ${order.order_number} Update`,
        message: `Your order status has been updated to: ${status.replace(/_/g, ' ')}.${trackingNote}`,
        type: 'order',
      });
      // Try to send Telegram notification
      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            telegram_id: cust.telegram_id,
            message: `Order ${order.order_number} update: ${status.replace(/_/g, ' ')}.${trackingNote}`,
            notification_data: { type: 'order', order_id: order.id },
          },
        });
      } catch (e) {
        console.warn("Telegram notify failed", e);
      }
    }

    setOrder(p => p ? { ...p, status, notes, delivery_fee: newDeliveryFee, total: newTotal, delivery_tracking_url: deliveryTrackingUrl.trim() || null } : p);
    toast({ description: 'Order updated and customer notified!' });
    setIsSaving(false);
  };

  const verifyPayment = async () => {
    setStatus('payment_verified');
  };

  const rejectPayment = async () => {
    setStatus('pending');
  };

  const notifyIssue = async () => {
    if (!order || !issueMessage.trim()) return;
    setIsNotifyingIssue(true);
    try {
      const { error } = await supabase.functions.invoke('order-issue-notify', {
        body: {
          order_id: order.id,
          message: issueMessage.trim(),
        },
      });
      if (error) throw error;
      toast({ description: 'Customer notified through Telegram.' });
      setIssueMessage('');
    } catch {
      toast({ description: 'Failed to notify customer.', variant: 'destructive' });
    } finally {
      setIsNotifyingIssue(false);
    }
  };

  if (!order) return <AdminLayout title="Order Detail"><div className="py-10 text-center text-sm text-muted-foreground">Loading...</div></AdminLayout>;

  const customer = order.customers as {telegram_first_name?: string; telegram_username?: string; customer_code?: string; phone?: string; email?: string} | null;
  const paymentMethod = order.payment_methods as {name: string; type: string} | null;
  const deliveryProvider = order.delivery_providers as {name: string} | null;
  const shippingAddr = order.shipping_address;
  const isDispatched = status === 'dispatched';
  const effectiveDeliveryFee = Number.isFinite(Number(deliveryFeeOverride)) ? Math.max(0, Number(deliveryFeeOverride)) : order.delivery_fee;
  const deliveryFeeLabel = effectiveDeliveryFee <= 0 ? 'FREE' : `₱${effectiveDeliveryFee.toFixed(2)}`;
  const feeDiff = effectiveDeliveryFee - order.delivery_fee;
  const liveTotal = Math.max(0, order.total + feeDiff);

  return (
    <AdminLayout title={`Order ${order.order_number}`}>
      <div className="max-w-2xl space-y-4">
        {/* Status */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">Order Status</h3>
            <OrderStatusBadge status={order.status} size="md" />
          </div>
          <Select value={status} onValueChange={v => setStatus(v as OrderStatus)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Proof */}
        {order.payment_proof_url && (
          <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm">
            <h3 className="text-sm font-bold mb-3">Payment Proof</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPaymentProof(true)}
              className="w-full h-9 gap-2 border-primary/30 text-primary"
            >
              <ImageIcon className="w-4 h-4" />
              Open Payment Proof
            </Button>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={verifyPayment} className="flex-1 h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-3.5 h-3.5" /> Verify Payment
              </Button>
              <Button size="sm" asChild variant="outline" className="flex-1 h-8 text-xs gap-1.5">
                <a href={order.payment_proof_url} download={`payment-proof-${order.order_number}`} target="_blank" rel="noreferrer">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={rejectPayment} className="flex-1 h-8 text-xs gap-1.5 border-destructive text-destructive hover:bg-destructive/10">
                <X className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm">
          <h3 className="text-sm font-bold mb-3">Items ({order.items?.length})</h3>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <img src={item.image || '/placeholder.svg'} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-muted" onError={e=>{(e.target as HTMLImageElement).src='/placeholder.svg';}} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{item.name}</p>
                  {item.sub_name && <p className="text-[11px] text-muted-foreground">{item.sub_name}</p>}
                  {item.variant && <p className="text-[11px] text-muted-foreground">{item.variant}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs">x{item.quantity}</p>
                  <p className="text-xs font-bold">₱{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3 space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₱{order.subtotal.toFixed(2)}</span></div>
            {order.fees_applied?.map((f,i) => <div key={i} className="flex justify-between"><span className="text-muted-foreground">{f.name}</span><span className={f.category==='discount'?'text-green-600':''}>{f.category==='discount'?'-':'+'}₱{f.amount.toFixed(2)}</span></div>)}
            {/* Editable Delivery Fee */}
            <div className="flex items-center justify-between gap-3 py-1.5 border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-2 mt-1">
              <div className="flex items-center gap-1.5 flex-1">
                <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                <Label className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Delivery Fee Override</Label>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">₱</span>
                <Input
                  type="number"
                  value={deliveryFeeOverride}
                  onChange={e => setDeliveryFeeOverride(e.target.value)}
                  className="h-6 w-20 text-xs font-bold text-right border-amber-400 focus:border-amber-500"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            {effectiveDeliveryFee !== order.delivery_fee && (
              <p className="text-[10px] text-amber-600 text-right">
                Original: ₱{order.delivery_fee.toFixed(2)} → New total: ₱{liveTotal.toFixed(2)}
              </p>
            )}
            {order.voucher_discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Voucher</span><span className="text-green-600">-₱{order.voucher_discount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Delivery Fee</span><span className="font-semibold">{deliveryFeeLabel}</span></div>
            <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>Total</span><span className="text-primary">₱{liveTotal.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Customer & Shipping */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm">
          <h3 className="text-sm font-bold mb-3">Customer & Shipping</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-semibold">{customer?.telegram_first_name ?? 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Customer ID</span><span className="font-mono font-bold">{customer?.customer_code ?? 'N/A'}</span></div>
            {customer?.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{customer.phone}</span></div>}
            {shippingAddr && (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Recipient</span><span>{shippingAddr.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{shippingAddr.phone}</span></div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-right">{formatShippingAddress(shippingAddr)}</span>
                </div>
              </>
            )}
            {paymentMethod && <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{paymentMethod.name}</span></div>}
            {deliveryProvider && <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{deliveryProvider.name}</span></div>}
          </div>
        </div>

        {isDispatched && (
          <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm">
            <h3 className="text-sm font-bold mb-2">Courier Tracking Link</h3>
            <p className="text-[11px] text-muted-foreground mb-2">
              Paste the courier or live tracking link here. The customer Track button will appear once the order is saved as Dispatched.
            </p>
            <Input
              value={deliveryTrackingUrl}
              onChange={e => setDeliveryTrackingUrl(e.target.value)}
              placeholder="https://..."
              className="h-9 text-sm"
            />
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm">
          <h3 className="text-sm font-bold mb-2">Order Issue Relay</h3>
          <p className="text-[11px] text-muted-foreground mb-2">
            Send an issue notice to the customer through the storefront bot. Their reply will come back to your Telegram account through the bot.
          </p>
          <Textarea
            value={issueMessage}
            onChange={e => setIssueMessage(e.target.value)}
            placeholder="Describe the issue, what the customer should reply with, or any instructions..."
            className="text-sm h-20 resize-none mb-2"
          />
          <Button
            onClick={notifyIssue}
            disabled={isNotifyingIssue || !issueMessage.trim()}
            className="btn-gradient"
          >
            {isNotifyingIssue ? 'Sending...' : 'Notify Customer via Telegram'}
          </Button>
        </div>

        {/* Notes */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm">
          <h3 className="text-sm font-bold mb-2">Admin Notes</h3>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes about this order..." className="text-sm h-20 resize-none" />
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setShowReceipt(true)} variant="outline" className="flex-1 gap-2 border-primary/30 text-primary">
            <FileText className="w-4 h-4" /> Receipt
          </Button>
          <Button onClick={updateOrder} disabled={isSaving} className="flex-1 btn-gradient font-bold">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {showReceipt && order && (
        <ReceiptModal open={showReceipt} onClose={() => setShowReceipt(false)} order={order} />
      )}

      {order.payment_proof_url && (
        <ImagePreviewDialog
          open={showPaymentProof}
          onOpenChange={setShowPaymentProof}
          title={`Payment Proof - ${order.order_number}`}
          imageUrl={order.payment_proof_url}
          alt={`Payment proof for order ${order.order_number}`}
          downloadFileName={`payment-proof-${order.order_number}`}
          showDownload
        />
      )}
    </AdminLayout>
  );
}
