import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaymentMethod, DeliveryProvider, FeeConfig, AppliedFee, Voucher, CheckoutFieldsConfig, ShippingAddress, DeliveryFeePaymentMode } from '@/types';
import { CreditCard, Truck, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddressSection from '@/components/common/AddressSection';
import { generateOrderNumber } from '@/lib/order-number';
import { formatShippingAddress } from '@/lib/address';
import { validateVoucherRules } from '@/lib/voucher';
import PaymentMethodDetailsDialog from '@/components/common/PaymentMethodDetailsDialog';
import { getPaymentMethodTileImage, isRedirectPaymentMethod } from '@/lib/payment-method';
import { formatMoney } from '@/lib/money';

const isDynamic = (type: string) => type === 'dynamic' || type === 'lalamove';

type DeliveryQuote = {
  fee: number;
  distance_km: number | null;
  traffic_active: boolean;
  breakdown: Record<string, number> | null;
};

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
  const [deliveryBreakdown, setDeliveryBreakdown] = useState<Record<string, number> | null>(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [providerQuotes, setProviderQuotes] = useState<Record<string, DeliveryQuote>>({});
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [deliveryFeeMode, setDeliveryFeeMode] = useState<DeliveryFeePaymentMode>('pay_now');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod | null>(null);
  const [showEnterprisePrompt, setShowEnterprisePrompt] = useState(false);
  const [enterprisePendingMethod, setEnterprisePendingMethod] = useState<PaymentMethod | null>(null);
  const [enterprisePromptAcknowledged, setEnterprisePromptAcknowledged] = useState(false);
  const quoteRunId = useRef(0);

  const [address, setAddress] = useState<ShippingAddress>({
    name: customer ? `${customer.telegram_first_name ?? ''} ${customer.telegram_last_name ?? ''}`.trim() : '',
    phone: customer?.phone ?? '',
    other_contact_no: '',
    referral_code: '',
    house_number: '',
    street_name: '',
    street_type: '',
    subdivision_village: '',
    barangay_town: '',
    city_municipality: '',
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
      if (pm?.length) {
        const first = (pm[0] as unknown) as PaymentMethod;
        if (first.type !== 'enterprise_api') {
          setSelectedPayment(first);
        }
        setActivePaymentMethod(first);
      }
    };
    fetchData();
  }, []);

  const quoteDeliveryProvider = async (provider: DeliveryProvider, destinationAddress: string, coords: { lat: number; lng: number } | null) => {
    if (!isDynamic(provider.type)) {
      return {
        fee: provider.config?.fee ?? 0,
        distance_km: null,
        traffic_active: false,
        breakdown: null,
      } as DeliveryQuote;
    }

    const { data } = await supabase.functions.invoke('lalamove-quote', {
      body: {
        destination_address: destinationAddress,
        ...(coords ? { dest_lat: coords.lat, dest_lng: coords.lng } : {}),
        delivery_provider_id: provider.id,
      },
    });

    return {
      fee: Number(data?.fee ?? 0),
      distance_km: data?.distance_km ?? null,
      traffic_active: Boolean(data?.traffic_active),
      breakdown: (data?.breakdown ?? null) as Record<string, number> | null,
    } as DeliveryQuote;
  };

  const currentDestination = formatShippingAddress(address);

  useEffect(() => {
    let active = true;
    const runId = ++quoteRunId.current;

    const dynamicProviders = deliveryProviders.filter(provider => isDynamic(provider.type));
    const shouldQuote = Boolean(currentDestination.trim()) || Boolean(addressCoords);

    if (!shouldQuote || dynamicProviders.length === 0) {
      setProviderQuotes(prev => {
        const next = { ...prev };
        for (const provider of dynamicProviders) delete next[provider.id];
        return next;
      });
      if (selectedDelivery) {
        if (!isDynamic(selectedDelivery.type)) {
          setDeliveryFee(selectedDelivery.config?.fee ?? 0);
        } else {
          setDeliveryFee(0);
        }
        setDeliveryDistance(null);
        setTrafficActive(false);
        setDeliveryBreakdown(null);
      }
      return () => { active = false; };
    }

    setIsCalculatingFee(true);
    const timer = setTimeout(async () => {
      try {
        const entries = await Promise.all(
          dynamicProviders.map(async provider => {
            try {
              const quote = await quoteDeliveryProvider(provider, currentDestination, addressCoords);
              return [provider.id, quote] as const;
            } catch (error) {
              console.error(`Quote failed for ${provider.id}:`, error);
              return [provider.id, {
                fee: 0,
                distance_km: null,
                traffic_active: false,
                breakdown: null,
              } as DeliveryQuote] as const;
            }
          })
        );
        if (!active || quoteRunId.current !== runId) return;
        setProviderQuotes(Object.fromEntries(entries));
      } finally {
        if (active && quoteRunId.current === runId) {
          setIsCalculatingFee(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentDestination, addressCoords, deliveryProviders, selectedDelivery]);

  useEffect(() => {
    if (!selectedDelivery) return;
    if (!isDynamic(selectedDelivery.type)) {
      setDeliveryFee(selectedDelivery.config?.fee ?? 0);
      setDeliveryDistance(null);
      setTrafficActive(false);
      setDeliveryBreakdown(null);
      return;
    }
    const quote = providerQuotes[selectedDelivery.id];
    setDeliveryFee(quote?.fee ?? 0);
    setDeliveryDistance(quote?.distance_km ?? null);
    setTrafficActive(quote?.traffic_active ?? false);
    setDeliveryBreakdown(quote?.breakdown ?? null);
  }, [selectedDelivery, providerQuotes]);

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
  const adminFeeTotal = fees.reduce((s, f) => s + (f.category === 'discount' ? 0 : f.amount), 0);
  const adminDiscountTotal = fees.reduce((s, f) => s + (f.category === 'discount' ? f.amount : 0), 0);
  const voucherDiscount = appliedVoucher
    ? appliedVoucher.discount_type === 'percent'
      ? (subtotal * appliedVoucher.discount_value) / 100
      : appliedVoucher.discount_value
    : 0;
  const deliveryFeeToPay = deliveryFeeMode === 'pay_now' ? deliveryFee : 0;
  const discountsTotal = adminDiscountTotal + voucherDiscount;
  const total = Math.max(0, subtotal + adminFeeTotal + deliveryFeeToPay - discountsTotal);

  const placeOrder = async () => {
    if (!customer) { toast({ description: 'Please login via Telegram first', variant: 'destructive' }); return; }
    if (!selectedPayment) { toast({ description: 'Please select a payment method', variant: 'destructive' }); return; }
    if (!selectedDelivery) { toast({ description: 'Please select a delivery option', variant: 'destructive' }); return; }
    if (selectedPayment?.type === 'enterprise_api' && !enterprisePromptAcknowledged) {
      setEnterprisePendingMethod(selectedPayment);
      setShowEnterprisePrompt(true);
      return;
    }
    if (!address.name || !address.phone || !address.street_name || !address.barangay_town || !address.city_municipality) {
      toast({ description: 'Please fill in your delivery details', variant: 'destructive' }); return;
    }
    if (isDynamic(selectedDelivery.type) && deliveryFee === 0) {
      toast({ description: 'Delivery fee not calculated. Please confirm your address.', variant: 'destructive' }); return;
    }
    if (appliedVoucher) {
      const { data: liveVoucher } = await supabase.from('vouchers').select('*').eq('id', appliedVoucher.id).maybeSingle();
      const voucher = liveVoucher as Voucher | null;
      if (!voucher || !voucher.is_active || voucher.revoked || voucher.revoked_at) {
        toast({ description: 'Voucher is no longer valid. Please apply a new code.', variant: 'destructive' });
        return;
      }
      if (voucher.starts_at && new Date(voucher.starts_at) > new Date()) {
        toast({ description: 'This voucher is not active yet', variant: 'destructive' });
        return;
      }
      if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
        toast({ description: 'This voucher has expired', variant: 'destructive' });
        return;
      }
      if (voucher.max_uses != null && voucher.used_count >= voucher.max_uses) {
        toast({ description: 'This voucher has reached its usage limit', variant: 'destructive' });
        return;
      }
      const eligibility = await validateVoucherRules(
        voucher,
        customer.id,
        items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      );
      if (!eligibility.ok) {
        toast({ description: eligibility.message, variant: 'destructive' });
        return;
      }
    }

    setIsPlacing(true);
    try {
      const shippingAddress = {
        ...address,
        address: currentDestination,
        city: address.city_municipality || address.city,
      };
      const orderItems = items.map(i => ({
        product_id: i.product_id,
        name: i.product_name,
        sub_name: i.sub_name,
        price: i.price,
        quantity: i.quantity,
        variant: i.variant?.option,
        image: i.product_image,
      }));

      const { data: order, error } = await supabase.from('orders').insert({
        order_number: generateOrderNumber(),
        customer_id: customer.id,
        items: orderItems,
        subtotal,
        fees_applied: fees,
        voucher_code: appliedVoucher?.code ?? null,
        voucher_id: appliedVoucher?.id ?? null,
        voucher_discount: voucherDiscount,
        delivery_fee: deliveryFee,
        delivery_fee_payment_mode: deliveryFeeMode,
        delivery_provider_id: selectedDelivery.id,
        total,
        status: 'pending',
        payment_method_id: selectedPayment.id,
        shipping_address: shippingAddress,
        notes,
      }).select().maybeSingle();

      if (error || !order) throw error ?? new Error('Order creation failed');

      const submittedMessage = [
        '<b>Order Submitted</b>',
        `<b>Order #:</b> ${order.order_number}`,
        `<b>Subtotal:</b> ${formatMoney(subtotal)}`,
        `<b>Fees:</b> ${formatMoney(adminFeeTotal + deliveryFeeToPay)}`,
        `<b>Discounts:</b> ${formatMoney(discountsTotal)}`,
        `<b>Grand Total:</b> ${formatMoney(total)}`,
        deliveryFeeMode === 'upon_fulfillment'
          ? `<b>Delivery Fee:</b> ${formatMoney(deliveryFee)} (upon fulfillment)`
          : deliveryFee > 0
            ? `<b>Delivery Fee:</b> ${formatMoney(deliveryFee)} (paid now)`
            : '<b>Delivery Fee:</b> FREE',
        '',
        'Your order has been received by the store.',
      ].join('\n');

      await supabase.from('notifications').insert({
        customer_id: customer.id,
        title: 'Order Submitted',
        message: `Your order #${order.order_number} has been received.`,
        type: 'order',
      });

      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            telegram_id: customer.telegram_id,
            message: submittedMessage,
            notification_data: {
              type: 'order',
              order_id: order.id,
              order_number: order.order_number,
            },
            reply_markup: {
              inline_keyboard: [[{
                text: 'View Order',
                web_app: { url: `${window.location.origin}/orders/${order.id}` },
              }]],
            },
          },
        });
      } catch (telegramError) {
        console.warn('Telegram order notification failed:', telegramError);
      }

      if (appliedVoucher) {
        await supabase.from('vouchers').update({ used_count: appliedVoucher.used_count + 1 }).eq('id', appliedVoucher.id);
        await supabase.from('voucher_audit_logs').insert({
          voucher_id: appliedVoucher.id,
          voucher_uid: appliedVoucher.internal_voucher_uid ?? null,
          order_id: order.id,
          action: 'used',
          reason: 'Applied during checkout',
          actor_type: 'customer',
          actor_identifier: customer.id,
          meta: { order_number: order.order_number, voucher_code: appliedVoucher.code },
        });
      }

      if (saveForFuture) {
        const savedAddresses = customer.saved_addresses ?? [];
        const nextSaved = [
          ...savedAddresses,
          {
            id: crypto.randomUUID(),
            label: address.street_name ? `${address.street_name} ${address.street_type}`.trim() : 'Checkout Address',
            house_number: address.house_number,
            street_name: address.street_name,
            street_type: address.street_type,
            subdivision_village: address.subdivision_village,
            barangay_town: address.barangay_town,
            city_municipality: address.city_municipality,
            province: address.province,
            zip: address.zip,
            address: shippingAddress.address,
            city: shippingAddress.city,
            lat: addressCoords?.lat,
            lng: addressCoords?.lng,
          },
        ];
        await supabase.from('customers').update({ saved_addresses: nextSaved }).eq('id', customer.id);
      }

      if (selectedPayment.type === 'maya') {
        const { data: mayaCheckout, error: mayaError } = await supabase.functions.invoke('maya-checkout', {
          body: {
            order_id: order.id,
            order_number: order.order_number,
            amount: total,
            description: `Order ${order.order_number}`,
            success_url: `${window.location.origin}/orders/${order.id}?payment=maya&status=success`,
            cancel_url: `${window.location.origin}/orders/${order.id}?payment=maya&status=cancelled`,
          },
        });

        if (mayaError || !mayaCheckout?.checkout_url) {
          throw mayaError ?? new Error('Maya checkout creation failed');
        }

        await supabase.from('orders').update({
          maya_checkout_id: mayaCheckout.checkout_id ?? null,
        }).eq('id', order.id);

        clearCart();
        window.location.assign(mayaCheckout.checkout_url);
        return;
      }

      if (selectedPayment.type === 'enterprise_api' && selectedPayment.details?.gateway_url) {
        clearCart();
        window.location.assign(selectedPayment.details.gateway_url);
        return;
      }

      if (isRedirectPaymentMethod(selectedPayment) && selectedPayment.details?.gateway_url) {
        clearCart();
        window.open(selectedPayment.details.gateway_url, '_blank', 'noopener,noreferrer');
        navigate(`/orders/${order.id}`, { replace: true, state: { justSubmitted: true } });
        return;
      }

      clearCart();
      navigate(`/orders/${order.id}`, { replace: true, state: { justSubmitted: true } });
    } catch (err) {
      console.error('Order error:', err);
      toast({ description: 'Failed to place order. Please try again.', variant: 'destructive' });
    } finally { setIsPlacing(false); }
  };

  return (
    <AppLayout showBack title="Checkout">
      <div className="px-3 py-3 space-y-3">

        {/* STEP 1: Customer Details */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">Step 1 | Customer Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-center">
              <p className="text-[11px] text-muted-foreground">Telegram Username</p>
              <p className="text-sm font-black text-primary">
                {customer?.telegram_username ? `@${customer.telegram_username}` : 'N/A'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">Telegram ID</p>
              <p className="text-xs font-bold text-foreground text-left break-all">{customer?.telegram_id ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-right">
              <p className="text-[11px] text-muted-foreground">Customer ID</p>
              <p className="text-xs font-bold text-foreground break-all">{customer?.customer_code ?? 'N/A'}</p>
            </div>
            <div className="col-span-2 rounded-lg border border-border bg-background px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">Internal Customer ID</p>
              <p className="text-xs font-bold text-foreground break-all">{customer?.id ?? 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="col-span-2">
              <label className="text-[11px] font-medium text-foreground">Name *</label>
              <Input
                value={address.name}
                onChange={e => setAddress(p => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
                className="mt-0.5 h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-foreground">Contact No. *</label>
              <Input
                value={address.phone}
                onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))}
                placeholder="09XXXXXXXXX"
                className="mt-0.5 h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-foreground">Other Contact No. <span className="text-muted-foreground">(Optional)</span></label>
              <Input
                value={address.other_contact_no ?? ''}
                onChange={e => setAddress(p => ({ ...p, other_contact_no: e.target.value }))}
                placeholder="Alternative number"
                className="mt-0.5 h-9 text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-medium text-foreground">Referral Code <span className="text-muted-foreground">(Optional)</span></label>
              <Input
                value={address.referral_code ?? ''}
                onChange={e => setAddress(p => ({ ...p, referral_code: e.target.value }))}
                placeholder="Enter referral code"
                className="mt-0.5 h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* STEP 2: Delivery Details */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Step 2 | Delivery Details</h2>
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
            saveForFuture={saveForFuture}
            onSaveForFutureChange={setSaveForFuture}
          />
          <div className="mt-3 rounded-xl border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-foreground">Delivery Method</p>
                <p className="text-[11px] text-muted-foreground">Select a provider after the fee is calculated.</p>
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
                const quote = providerQuotes[dp.id];
                const shownFee = isDynamic(dp.type) ? quote?.fee ?? null : (dp.config?.fee ?? 0);
                return (
                  <button
                    key={dp.id}
                    onClick={() => {
                      setSelectedDelivery(dp);
                      if (!isDynamic(dp.type)) {
                        setDeliveryFee(dp.config?.fee ?? 0);
                        setDeliveryDistance(null);
                        setDeliveryBreakdown(null);
                      } else {
                        const quote = providerQuotes[dp.id];
                        if (quote) {
                          setDeliveryFee(quote.fee);
                          setDeliveryDistance(quote.distance_km);
                          setTrafficActive(quote.traffic_active);
                          setDeliveryBreakdown(quote.breakdown);
                        } else {
                          setDeliveryFee(0);
                          setDeliveryDistance(null);
                          setTrafficActive(false);
                          setDeliveryBreakdown(null);
                        }
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
                    {shownFee != null && (
                      <span className="text-[10px] font-bold text-primary">
                        {formatMoney(shownFee)}
                        {isSelected && deliveryDistance != null && ` · ${deliveryDistance}km`}
                      </span>
                    )}
                    {isDynamic(dp.type) && shownFee == null && !isCalculatingFee && (
                      <span className="text-[10px] text-muted-foreground">Enter address</span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDelivery && (
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-foreground">Delivery Fee Payment</p>
                    <p className="text-[11px] text-muted-foreground">
                      Choose whether the delivery fee is paid now or upon fulfillment.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryFeeMode('pay_now')}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${deliveryFeeMode === 'pay_now' ? 'border-primary bg-primary-light' : 'border-border hover:border-primary/30'}`}
                  >
                    <p className="text-xs font-bold text-foreground">Pay now</p>
                    <p className="text-[11px] text-muted-foreground">Add the delivery fee to the order total</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryFeeMode('upon_fulfillment')}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${deliveryFeeMode === 'upon_fulfillment' ? 'border-primary bg-primary-light' : 'border-border hover:border-primary/30'}`}
                  >
                    <p className="text-xs font-bold text-foreground">Upon fulfillment</p>
                    <p className="text-[11px] text-muted-foreground">Keep fee due later after delivery</p>
                  </button>
                </div>
              </div>
            )}
            {trafficActive && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                  Traffic adjustment applied based on the selected delivery provider settings
                </p>
              </div>
            )}
            {selectedDelivery && selectedDelivery.config?.instructions && (
              <p className="text-[11px] text-muted-foreground mt-2 px-1">{selectedDelivery.config.instructions}</p>
            )}
          </div>
        </div>

        {/* STEP 3: Order Summary */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Step 3 | Order Summary</h2>
          </div>
          <div className="space-y-2.5">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <h3 className="text-xs font-bold text-foreground mb-2">Items Ordered</h3>
              <div className="space-y-2">
                {items.map(item => {
                  const unitPrice = item.price + (item.variant?.price_modifier ?? 0);
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <div key={`${item.product_id}__${item.variant?.option ?? ''}`} className="flex items-start gap-2.5">
                      <img src={item.product_image || '/placeholder.svg'} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0" onError={e => {(e.target as HTMLImageElement).src='/placeholder.svg';}} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">{item.product_name}</p>
                        {item.sub_name && (
                          <p className="text-[11px] text-muted-foreground leading-tight line-clamp-1">{item.sub_name}</p>
                        )}
                        {item.variant?.option && (
                          <p className="text-[11px] text-muted-foreground leading-tight line-clamp-1">{item.variant.option}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold">x{item.quantity}</p>
                        <p className="text-[11px] text-muted-foreground">{formatMoney(unitPrice)} each</p>
                        <p className="text-xs font-black text-primary">{formatMoney(lineTotal)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3 space-y-1.5">
              <h3 className="text-xs font-bold text-foreground mb-1">Pricing Breakdown</h3>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal ({items.length} items)</span><span className="font-semibold">{formatMoney(subtotal)}</span></div>
              {fees.map((f, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{f.name}</span>
                  <span className={`font-semibold ${f.category === 'discount' ? 'text-green-600' : ''}`}>
                    {f.category === 'discount' ? '-' : '+'}{formatMoney(f.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  Delivery{deliveryDistance != null ? ` (${deliveryDistance}km)` : ''}
                  {trafficActive && <span className="text-amber-600 font-bold">[Traffic]</span>}
                </span>
                <span className="font-semibold">{isCalculatingFee ? '...' : deliveryFeeMode === 'pay_now' ? formatMoney(deliveryFee) : 'Upon Fulfillment'}</span>
              </div>
              {deliveryBreakdown && (
                <div className="space-y-1 pt-1">
                  {typeof deliveryBreakdown.base === 'number' && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Base fare</span>
                      <span>{formatMoney(deliveryBreakdown.base)}</span>
                    </div>
                  )}
                  {typeof deliveryBreakdown.first_fee === 'number' && deliveryBreakdown.first_fee > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Distance charge</span>
                      <span>{formatMoney(deliveryBreakdown.first_fee)}</span>
                    </div>
                  )}
                  {typeof deliveryBreakdown.extra_fee === 'number' && deliveryBreakdown.extra_fee > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Extra distance</span>
                      <span>{formatMoney(deliveryBreakdown.extra_fee)}</span>
                    </div>
                  )}
                  {typeof deliveryBreakdown.traffic_fee === 'number' && deliveryBreakdown.traffic_fee > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Traffic surcharge</span>
                      <span>{formatMoney(deliveryBreakdown.traffic_fee)}</span>
                    </div>
                  )}
                  {typeof deliveryBreakdown.platform_fee === 'number' && deliveryBreakdown.platform_fee > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Platform fee</span>
                      <span>{formatMoney(deliveryBreakdown.platform_fee)}</span>
                    </div>
                  )}
                </div>
              )}
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Voucher ({appliedVoucher?.code})</span><span className="font-semibold text-green-600">-{formatMoney(voucherDiscount)}</span></div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-sm font-bold">Total</span>
                <span className="text-sm font-black text-primary">{formatMoney(total)}</span>
              </div>
              {deliveryFeeMode === 'upon_fulfillment' && (
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-semibold">Upon Fulfillment</span>
                </div>
              )}
              {deliveryFeeMode === 'pay_now' && deliveryFee === 0 && (
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-semibold">FREE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STEP 4: Payment Method */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Step 4 | Payment Method</h2>
          </div>
          <div className="rounded-xl border border-border bg-background p-3 mb-3 space-y-1.5">
            <h3 className="text-xs font-bold text-foreground mb-1">Final Recap</h3>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Fees</span>
              <span className="font-semibold">
                {formatMoney(adminFeeTotal + deliveryFeeToPay)}
                {deliveryFeeMode === 'upon_fulfillment' && deliveryFee > 0 ? ' (delivery due later)' : ''}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Discounts</span>
              <span className="font-semibold text-green-600">-{formatMoney(discountsTotal)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-sm font-bold">Grand Total</span>
              <span className="text-sm font-black text-primary">{formatMoney(total)}</span>
            </div>
          </div>
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/20 p-3 mb-3">
            <p className="text-[11px] font-black text-amber-800 dark:text-amber-300 text-center tracking-[0.18em] uppercase">
              Payment Proof Upload Reminder
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-200 text-center mt-1 leading-snug">
              Please prepare your payment proof after paying so you can upload it for verification.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map(pm => (
              <button
                key={pm.id}
                type="button"
                aria-label={pm.name}
                title={pm.name}
                onClick={() => {
                  setActivePaymentMethod(pm);
                  if (pm.type === 'enterprise_api') {
                    setEnterprisePendingMethod(pm);
                    setShowEnterprisePrompt(true);
                    return;
                  }
                  setEnterprisePromptAcknowledged(false);
                  setSelectedPayment(pm);
                  setShowPaymentDetails(true);
                }}
                className={`group aspect-square rounded-xl border p-2 transition-all ${
                  selectedPayment?.id === pm.id
                    ? 'border-primary bg-primary-light ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40 hover:bg-primary-light/50'
                }`}
              >
                <div className="h-full w-full rounded-lg bg-background flex items-center justify-center overflow-hidden">
                  {getPaymentMethodTileImage(pm) ? (
                    <img
                      src={getPaymentMethodTileImage(pm)}
                      alt={pm.name}
                      className="h-full w-full object-contain p-1.5"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <CreditCard className={`w-5 h-5 ${selectedPayment?.id === pm.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <PaymentMethodDetailsDialog
        open={showPaymentDetails}
        onOpenChange={setShowPaymentDetails}
        method={activePaymentMethod}
      />

      <Dialog open={showEnterprisePrompt} onOpenChange={open => {
        setShowEnterprisePrompt(open);
        if (!open) setEnterprisePendingMethod(null);
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Secure Payment Gateway</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              You will be redirected to a secure payment gateway. Your payment is validated in real time, so there is no need to send a screenshot.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEnterprisePrompt(false);
                  setEnterprisePendingMethod(null);
                  setEnterprisePromptAcknowledged(false);
                  if (selectedPayment?.type === 'enterprise_api') {
                    setSelectedPayment(null);
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 btn-gradient"
                onClick={() => {
                  if (enterprisePendingMethod) {
                    setSelectedPayment(enterprisePendingMethod);
                    setActivePaymentMethod(enterprisePendingMethod);
                  }
                  setEnterprisePromptAcknowledged(true);
                  setShowEnterprisePrompt(false);
                }}
              >
                I Agree
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="sticky bottom-0 p-3 border-t border-border bg-background shadow-brand-lg">
        <Button onClick={placeOrder} disabled={isPlacing || isCalculatingFee} className="w-full h-12 btn-gradient text-sm font-bold rounded-xl gap-2">
          {isPlacing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPlacing ? 'Placing Order...' : `Place Order — ${formatMoney(total)}`}
        </Button>
      </div>
    </AppLayout>
  );
}
