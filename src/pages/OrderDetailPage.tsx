import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Order, ReceiptFieldsConfig } from '@/types';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import ReceiptModal from '@/components/common/ReceiptModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, FileText, Image as ImageIcon, Truck, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptConfig, setReceiptConfig] = useState<ReceiptFieldsConfig | null>(null);
  const [storeName, setStoreName] = useState('PRIME CORE');
  const [isUploading, setIsUploading] = useState(false);
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      const [{ data: ord }, { data: rcfg }, { data: sinfo }] = await Promise.all([
        supabase.from('orders').select('*, customers(*), payment_methods(*), delivery_providers(*)').eq('id', id).maybeSingle(),
        supabase.from('app_settings').select('value').eq('key', 'receipt_fields_config').maybeSingle(),
        supabase.from('app_settings').select('value').eq('key', 'store_info').maybeSingle(),
      ]);
      setOrder(ord as unknown as Order);
      setReceiptConfig((rcfg?.value ?? null) as ReceiptFieldsConfig | null);
      setStoreName((sinfo?.value as {name: string} | null)?.name ?? 'PRIME CORE');
      setIsLoading(false);
    };
    fetchOrder();

    const channel = supabase.channel('order-detail')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, fetchOrder)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = ev => setProofPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submitProof = async () => {
    if (!order || !proofFile) {
      toast({ description: 'Please select a payment proof image', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      const fileExt = proofFile.name.split('.').pop() || 'jpg';
      const filePath = `payment-proofs/${order.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(filePath, proofFile, {
        cacheControl: '3600',
        contentType: proofFile.type || 'image/jpeg',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);
      const uploadUrl = publicUrlData.publicUrl;

      const { error } = await supabase.from('orders').update({
        payment_proof_url: uploadUrl,
        status: 'payment_submitted',
      }).eq('id', order.id);
      if (error) throw error;
      toast({ description: 'Payment proof submitted! Awaiting verification.' });
      setOrder(p => p ? { ...p, payment_proof_url: uploadUrl, status: 'payment_submitted' } : p);
      setProofPreviewUrl('');
      setProofFile(null);
    } catch {
      toast({ description: 'Failed to submit proof. Please try again.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.order_number);
      toast({ description: 'Order number copied.' });
    } catch {
      toast({ description: 'Copy failed. Please try again.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <AppLayout showBack title="Order Details">
        <div className="p-3 space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout showBack title="Order Details">
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground text-sm">Order not found</p>
        </div>
      </AppLayout>
    );
  }

  const paymentMethod = order.payment_methods as unknown as {name: string; type: string; details: {qr_image?: string; instructions?: string}} | null;
  const trackingUrl = order.delivery_tracking_url?.trim() ?? '';
  const usesManualQrPayment = paymentMethod?.type === 'qrph' || paymentMethod?.type === 'custom';
  const needsProof = usesManualQrPayment && order.status === 'pending';
  const canTrackCourier = order.status === 'dispatched' && !!trackingUrl;

  return (
    <AppLayout showBack title="Order Details">
      <div className="px-3 py-3 space-y-3 pb-4">
        {/* Status card */}
        <div className="bg-gradient-card rounded-xl p-4 border border-primary/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-black text-base text-primary">{order.order_number}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <OrderStatusBadge status={order.status} size="md" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyOrderNumber}
                className="h-6 px-2 text-[10px] gap-1 border-primary/30 text-primary"
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
          <h3 className="text-sm font-bold text-foreground mb-3">Items Ordered</h3>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <img src={item.image || '/placeholder.svg'} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0" onError={e => {(e.target as HTMLImageElement).src='/placeholder.svg';}} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">{item.name}</p>
                  {item.variant && <p className="text-[11px] text-muted-foreground">{item.variant}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold">x{item.quantity}</p>
                  <p className="text-xs font-black text-primary">₱{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm space-y-1.5">
          <h3 className="text-sm font-bold text-foreground mb-2">Price Breakdown</h3>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span>₱{order.subtotal.toFixed(2)}</span></div>
          {order.fees_applied?.map((f, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{f.name}</span>
              <span className={f.category === 'discount' ? 'text-green-600' : ''}>{f.category === 'discount' ? '-' : '+'}₱{f.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Delivery</span><span>₱{order.delivery_fee.toFixed(2)}</span></div>
          {order.voucher_discount > 0 && (
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Voucher</span><span className="text-green-600">-₱{order.voucher_discount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-bold text-sm">Total</span>
            <span className="font-black text-sm text-primary">₱{order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method - QR */}
        {usesManualQrPayment && paymentMethod?.details?.qr_image && (
          <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm text-center">
            <h3 className="text-sm font-bold text-foreground mb-3">Scan to Pay — {paymentMethod.name}</h3>
            <img src={paymentMethod.details.qr_image} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg object-contain" />
            <p className="text-xs text-muted-foreground mt-2">
              {paymentMethod.details.instructions ?? 'Scan the QR code, pay the order total, then upload your proof below.'}
            </p>
          </div>
        )}

        {/* Payment Proof Upload */}
        {needsProof && (
          <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Upload Payment Proof</h3>
            </div>
            {proofPreviewUrl ? (
              <div className="space-y-2">
                <img src={proofPreviewUrl} alt="proof" className="w-full rounded-lg object-cover max-h-48" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setProofPreviewUrl(''); setProofFile(null); }} className="flex-1 h-8 text-xs">Change</Button>
                  <Button size="sm" onClick={submitProof} disabled={isUploading} className="flex-1 h-8 text-xs btn-gradient">
                    {isUploading ? 'Submitting...' : 'Submit Proof'}
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-primary/30 bg-primary-light/50 cursor-pointer hover:border-primary/60 transition-colors">
                <ImageIcon className="w-8 h-8 text-primary/50" />
                <p className="text-xs font-semibold text-muted-foreground text-center">Tap to upload screenshot<br/>of your payment</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>
        )}

        {canTrackCourier && (
          <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Live Courier Tracking</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Your order is dispatched. Tap the button below to view the courier tracking link.
            </p>
            <Button asChild className="w-full btn-gradient font-semibold">
              <a href={trackingUrl} target="_blank" rel="noreferrer">
                Track Courier
              </a>
            </Button>
          </div>
        )}

        {order.payment_proof_url && order.status !== 'pending' && (
          <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
            <p className="text-xs font-bold text-foreground mb-2">Payment Proof Submitted</p>
            <img src={order.payment_proof_url} alt="proof" className="w-full rounded-lg object-cover max-h-32" onError={e => {(e.target as HTMLImageElement).style.display='none';}} />
          </div>
        )}

        <Button onClick={() => setShowReceipt(true)} variant="outline" className="w-full gap-2 border-primary/30 text-primary font-semibold">
          <FileText className="w-4 h-4" />
          View Receipt
        </Button>
      </div>

      {showReceipt && order && (
        <ReceiptModal
          open={showReceipt}
          onClose={() => setShowReceipt(false)}
          order={order}
          config={receiptConfig ?? undefined}
          storeName={storeName}
        />
      )}
    </AppLayout>
  );
}
