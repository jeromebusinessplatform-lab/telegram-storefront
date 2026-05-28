import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Voucher } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const discount = appliedVoucher
    ? appliedVoucher.discount_type === 'percent'
      ? (subtotal * appliedVoucher.discount_value) / 100
      : appliedVoucher.discount_value
    : 0;

  const total = Math.max(0, subtotal - discount);

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsApplying(true);
    setVoucherError('');
    const { data } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', voucherCode.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (!data) {
      setVoucherError('Invalid or expired voucher code');
      setIsApplying(false);
      return;
    }

    const v = data as unknown as Voucher;
    if (v.expiry_date && new Date(v.expiry_date) < new Date()) {
      setVoucherError('This voucher has expired');
      setIsApplying(false);
      return;
    }
    if (v.max_uses != null && v.used_count >= v.max_uses) {
      setVoucherError('This voucher has reached its usage limit');
      setIsApplying(false);
      return;
    }
    if (subtotal < v.min_order_amount) {
      setVoucherError(`Minimum order of ₱${v.min_order_amount.toFixed(2)} required`);
      setIsApplying(false);
      return;
    }

    setAppliedVoucher(v);
    setIsApplying(false);
    toast({ description: 'Voucher applied successfully!' });
  };

  if (items.length === 0) {
    return (
      <AppLayout showBack title="Cart">
        <div className="flex flex-col items-center justify-center h-full pb-8 text-center px-6">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/40 mb-4" />
          <p className="font-bold text-foreground mb-1">Your cart is empty</p>
          <p className="text-sm text-muted-foreground mb-6">Add some products to get started</p>
          <Button onClick={() => navigate('/')} className="btn-gradient px-8">
            Browse Products
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBack title="Cart">
      <div className="px-3 py-3 space-y-2">
        {items.map((item) => {
            const key = `${item.product_id}__${item.variant?.option ?? ''}`;
            const unitPrice = item.price + (item.variant?.price_modifier ?? 0);
            return (
              <div key={key} className="bg-card rounded-xl p-3 border border-border flex gap-3 shadow-brand-sm">
                <img
                  src={item.product_image || '/placeholder.svg'}
                  alt={item.product_name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-muted"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground leading-tight line-clamp-1">{item.product_name}</p>
                  {(item.sub_name || item.variant) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.sub_name ?? item.variant?.option}</p>
                  )}
                  <p className="text-sm font-black text-primary mt-1">₱{unitPrice.toFixed(2)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 bg-muted rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.variant?.option, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-background flex items-center justify-center shadow-brand-sm"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.variant?.option, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-background flex items-center justify-center shadow-brand-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id, item.variant?.option)}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Voucher */}
          <div className="bg-card rounded-xl p-3 border border-border shadow-brand-sm">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">Voucher Code</span>
            </div>
            {appliedVoucher ? (
              <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                <div>
                  <span className="text-xs font-bold text-green-700">{appliedVoucher.code}</span>
                  <span className="text-[11px] text-green-600 ml-2">
                    -{appliedVoucher.discount_type === 'percent' ? `${appliedVoucher.discount_value}%` : `₱${appliedVoucher.discount_value}`}
                  </span>
                </div>
                <button onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }} className="text-[11px] text-destructive font-semibold">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={voucherCode}
                  onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); }}
                  placeholder="Enter code"
                  className="h-8 text-xs uppercase font-mono"
                />
                <Button onClick={applyVoucher} disabled={isApplying} size="sm" className="h-8 px-3 text-xs btn-gradient">
                  Apply
                </Button>
              </div>
            )}
            {voucherError && <p className="text-[11px] text-destructive mt-1">{voucherError}</p>}
          </div>

          {/* Order summary */}
          <div className="bg-card rounded-xl p-3 border border-border shadow-brand-sm space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">₱{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-semibold text-green-600">-₱{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1.5">
              <span className="text-sm font-bold">Total</span>
              <span className="text-sm font-black text-primary">₱{total.toFixed(2)}</span>
            </div>
          </div>
      </div>

      <div className="sticky bottom-0 p-3 border-t border-border bg-background shadow-brand-lg">
        <Button
          onClick={() => navigate('/checkout', { state: { voucher: appliedVoucher } })}
          className="w-full h-12 btn-gradient text-sm font-bold rounded-xl"
        >
          Checkout — ₱{total.toFixed(2)}
        </Button>
      </div>
    </AppLayout>
  );
}
