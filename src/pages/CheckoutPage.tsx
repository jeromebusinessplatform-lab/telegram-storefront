import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PaymentMethod, DeliveryProvider, FeeConfig, AppliedFee, Voucher, CheckoutFieldsConfig, ShippingAddress } from '@/types';
import { CreditCard, Truck, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddressSection from '@/components/common/AddressSection';

function generateOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const rand = Math.random().toString(36).substring(2,7).toUpperCase();
  return `ORD-${date}-${rand}`;
}

const isDynamic = (type: string) => type === 'dynamic' || type === 'lalamove';

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { customer } = useAuth();
  const { toast } = useToast();

  const appliedVoucher: Voucher | null = state?.voucher ?? null;

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [deliveryProviders, setDeliveryProviders] = useState<DeliveryProvider[]>([]);
  const [feesConfig, setFeesConfig] = useState<FeeConfig[]>([]);
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutFieldsConfig | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryProvider | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [trafficActive, setTrafficActive] = useState(false);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  const [address, setAddress] = useState<ShippingAddress>({
    name: customer ? `${customer.telegram_first_name ?? ''} ${customer.telegram_last_name ?? ''}`.trim() : '',
    phone: customer?.phone ?? '',
    address: customer?.address ?? '',
    city: '',
    province: '',
    zip: '',
  });
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: pm }, { data: dp }, { data: fc }, { data: cfg }] = await Promise.all([
        supabase.from('payment_methods').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('delivery_providers').select('*').eq('is_active', true),
        supabase.from('fees_config').select('*').eq('is_active', true).eq('applies_always', true),
        supabase.from('app_settings').select('value').eq('key', 'checkout_fields_config').maybeSingle(),
      ]);
      setPaymentMethods((pm ?? []) as unknown as PaymentMethod[]);
      setDeliveryProviders((dp ?? []) as unknown as DeliveryProvider[]);
      setFeesConfig((fc ?? []) as unknown as FeeConfig[]);
      setCheckoutConfig((cfg?.value ?? null) as CheckoutFieldsConfig | null);
      if (pm?.length) setSelectedPayment((pm[0] as unknown) as PaymentMethod);
      if (dp?.length) {
        const first = (dp[0] as unknown) as DeliveryProvider;
        setSelectedDelivery(first);
        if (!isDynamic(first.type)) setDeliveryFee(first.config?.fee ?? 0);
      }
    };
    fetchData();
  }, []);

  // Recalculate fee when delivery provider or address coords change
  useEffect(() => {
    if (!selectedDelivery) return;
    if (!isDynamic(selectedDelivery.type)) {
      setDeliveryFee(selectedDelivery.config?.fee ?? 0);
      setDeliveryDistance(null);
      return;
    }
    // Auto-calculate if coords are available
    if (addressCoords) {
      calculateFee(addressCoords.lat, addressCoords.lng);
    } else if (address.address && address.city) {
      calculateFeeByText();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDelivery, addressCoords]);

  const calculateFee = async (lat: number, lng: number) => {
    setIsCalculatingFee(true);
    try {
      const { data } = await supabase.functions.invoke('lalamove-quote', {
        body: {
          dest_lat: lat,
          dest_lng: lng,
          destination_address: `${address.address}, ${address.city}`,
          delivery_provider_id: selectedDelivery?.id,
        },
      });
      if (data?.fee) {
        setDeliveryFee(data.fee);
        setDeliveryDistance(data.distance_km ?? null);
        setTrafficActive(data.traffic_active ?? false);
      }
    } catch { /* use fallback */ }
    setIsCalculatingFee(false);
  };

  const calculateFeeByText = async () => {
    if (!address.address || !address.city) return;
    setIsCalculatingFee(true);
    try {
      const { data } = await supabase.functions.invoke('lalamove-quote', {
        body: {
          destination_address: `${address.address}, ${address.city}${address.province ? ', ' + address.province : ''}`,
          delivery_provider_id: selectedDelivery?.id,
        },
      });
      if (data?.fee) {
        setDeliveryFee(data.fee);
        setDeliveryDistance(data.distance_km ?? null);
        setTrafficActive(data.traffic_active ?? false);
      }
    } catch { /* use fallback */ }
    setIsCalculatingFee(false);
  };

  const handleCoordsChange = (c: { lat: number; lng: number } | null) => {
    setAddressCoords(c);
  };

  const computeFees = (): AppliedFee[] => {
    return feesConfig.map(f => {
      const amount = f.value_type === 'percent' ? (subtotal * f.value) / 100 : f.value;
      return { name: f.name, category: f.category, value_type: f.value_type, amount };
    });
  };

  const fees = computeFees();
  const feesTotal = fees.reduce((s, f) => s + (f.category === 'discount' ? -f.amount : f.amount), 0);
  const voucherDiscount = appliedVoucher
    ? appliedVoucher.discount_type === 'percent'
      ? (subtotal * appliedVoucher.discount_value) / 100
      : appliedVoucher.discount_value
    : 0;
  const total = Math.max(0, subtotal + feesTotal + deliveryFee - voucherDiscount);

  const placeOrder = async () => {
    if (!customer) { toast({ description: 'Please login via Telegram first', variant: 'destructive' }); return; }
    if (!selectedPayment) { toast({ description: 'Please select a payment method', variant: 'destructive' }); return; }
    if (!selectedDelivery) { toast({ description: 'Please select a delivery option', variant: 'destructive' }); return; }
    if (!address.name || !address.phone || !address.address || !address.city) {
      toast({ description: 'Please fill in your delivery details', variant: 'destructive' }); return;
    }
    if (isDynamic(selectedDelivery.type) && deliveryFee === 0) {
      toast({ description: 'Delivery fee not calculated. Please confirm your address.', variant: 'destructive' }); return;
    }

    setIsPlacing(true);
    try {
      const orderItems = items.map(i => ({
        product_id: i.product_id,
        name: i.product_name,
        sub_name: i.sub_name,
        price: i.price,
        quantity: i.quantity,
        variant: i.sub_name ?? i.variant?.option,
        image: i.product_image,
      }));

      const { data: order, error } = await supabase.from('orders').insert({
        order_number: generateOrderNumber(),
        customer_id: customer.id,
        items: orderItems,
        subtotal,
        fees_applied: fees,
        voucher_code: appliedVoucher?.code ?? null,
        voucher_discount: voucherDiscount,
        delivery_fee: deliveryFee,
        delivery_provider_id: selectedDelivery.id,
        total,
        status: 'pending',
        payment_method_id: selectedPayment.id,
        shipping_address: address,
        notes,
      }).select().maybeSingle();

      if (error || !order) throw error ?? new Error('Order creation failed');

      if (appliedVoucher) {
        await supabase.from('vouchers').update({ used_count: appliedVoucher.used_count + 1 }).eq('id', appliedVoucher.id);
      }

      if (selectedPayment.type === 'maya') {
        const { data: mayaData } = await supabase.functions.invoke('maya-checkout', {
          body: {
            order_id: order.id,
            amount: total,
            description: `Order ${order.order_number}`,
            success_url: `${window.location.origin}/orders/${order.id}?success=true`,
            cancel_url: `${window.location.origin}/orders/${order.id}`,
          },
        });
        if (mayaData?.checkout_url) {
          clearCart();
          window.location.href = mayaData.checkout_url;
          return;
        }
      }

      clearCart();
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err) {
      console.error('Order error:', err);
      toast({ description: 'Failed to place order. Please try again.', variant: 'destructive' });
    } finally { setIsPlacing(false); }
  };

  return (
    <AppLayout showBack title="Checkout">
      <div className="px-3 py-3 space-y-3">

        {/* Delivery Address */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Delivery Address</h2>
          </div>
          <AddressSection
            address={address}
            onChange={setAddress}
            coords={addressCoords}
            onCoordsChange={handleCoordsChange}
            customer={customer}
            checkoutConfig={checkoutConfig}
            notes={notes}
            onNotesChange={setNotes}
          />
        </div>

        {/* Delivery Method — 3×3 grid */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Delivery Method</h2>
            </div>
            {isCalculatingFee && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Calculating...
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {deliveryProviders.map(dp => {
              const isSelected = selectedDelivery?.id === dp.id;
              const logo = (dp as unknown as { logo_url?: string }).logo_url ?? dp.config?.logo_url;
              return (
                <button
                  key={dp.id}
                  onClick={() => {
                    setSelectedDelivery(dp);
                    if (!isDynamic(dp.type)) {
                      setDeliveryFee(dp.config?.fee ?? 0);
                      setDeliveryDistance(null);
                    } else if (addressCoords) {
                      calculateFee(addressCoords.lat, addressCoords.lng);
                    } else if (address.address && address.city) {
                      calculateFeeByText();
                    }
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${isSelected ? 'border-primary bg-primary-light' : 'border-border hover:border-primary/30'}`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {logo ? (
                      <img src={logo} alt={dp.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    ) : (
                      <Truck className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  <p className={`text-[10px] font-bold leading-tight text-center line-clamp-2 ${isSelected ? 'text-primary' : 'text-foreground'}`}>{dp.name}</p>
                  {isSelected && deliveryFee > 0 && (
                    <span className="text-[10px] font-bold text-primary">
                      ₱{deliveryFee.toFixed(2)}
                      {deliveryDistance != null && ` · ${deliveryDistance}km`}
                    </span>
                  )}
                  {isSelected && isDynamic(dp.type) && deliveryFee === 0 && !isCalculatingFee && (
                    <span className="text-[10px] text-muted-foreground">Enter address</span>
                  )}
                </button>
              );
            })}
          </div>
          {trafficActive && (
            <div className="mt-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                Rush hour surcharge applied — +₱2.00/km beyond 5 km threshold
              </p>
            </div>
          )}
          {selectedDelivery && selectedDelivery.config?.instructions && (
            <p className="text-[11px] text-muted-foreground mt-2 px-1">{selectedDelivery.config.instructions}</p>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Payment Method</h2>
          </div>
          <div className="space-y-2">
            {paymentMethods.map(pm => (
              <label key={pm.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedPayment?.id === pm.id ? 'border-primary bg-primary-light' : 'border-border hover:border-primary/30'}`}>
                <input type="radio" name="payment" className="accent-primary w-3.5 h-3.5" checked={selectedPayment?.id === pm.id} onChange={() => setSelectedPayment(pm)} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">{pm.name}</p>
                  <p className="text-[11px] text-muted-foreground">{pm.details?.instructions}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm space-y-1.5">
          <h2 className="text-sm font-bold text-foreground mb-2">Order Summary</h2>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal ({items.length} items)</span><span className="font-semibold">₱{subtotal.toFixed(2)}</span></div>
          {fees.map((f, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{f.name}</span>
              <span className={`font-semibold ${f.category === 'discount' ? 'text-green-600' : ''}`}>
                {f.category === 'discount' ? '-' : '+'}₱{f.amount.toFixed(2)}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              Delivery{deliveryDistance != null ? ` (${deliveryDistance}km)` : ''}
              {trafficActive && <span className="text-amber-600 font-bold">[Rush Hr]</span>}
            </span>
            <span className="font-semibold">{isCalculatingFee ? '...' : `₱${deliveryFee.toFixed(2)}`}</span>
          </div>
          {voucherDiscount > 0 && (
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Voucher ({appliedVoucher?.code})</span><span className="font-semibold text-green-600">-₱{voucherDiscount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-sm font-bold">Total</span>
            <span className="text-sm font-black text-primary">₱{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 p-3 border-t border-border bg-background shadow-brand-lg">
        <Button onClick={placeOrder} disabled={isPlacing || isCalculatingFee} className="w-full h-12 btn-gradient text-sm font-bold rounded-xl gap-2">
          {isPlacing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPlacing ? 'Placing Order...' : `Place Order — ₱${total.toFixed(2)}`}
        </Button>
      </div>
    </AppLayout>
  );
}
