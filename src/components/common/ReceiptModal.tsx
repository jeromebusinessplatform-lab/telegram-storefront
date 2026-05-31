import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Order, ReceiptFieldsConfig } from '@/types';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  order: Order;
  config?: ReceiptFieldsConfig;
  storeName?: string;
}

const DEFAULT_CONFIG: ReceiptFieldsConfig = {
  show_order_number: true,
  show_customer_name: true,
  show_customer_code: true,
  show_items: true,
  show_fees: true,
  show_delivery_fee: true,
  show_voucher: true,
  show_total: true,
  show_payment_method: true,
  show_date: true,
  show_store_name: true,
};

export default function ReceiptModal({ open, onClose, order, config = DEFAULT_CONFIG, storeName = 'PRIME CORE' }: ReceiptModalProps) {
  const customer = order.customers;
  const paymentMethod = order.payment_methods;
  const mayaReceipt = (order.receipt_data as Record<string, unknown> | null | undefined)?.maya as Record<string, unknown> | undefined;
  const enterpriseApiReceipt = (order.receipt_data as Record<string, unknown> | null | undefined)?.enterprise_api as Record<string, unknown> | undefined;
  const mayaPaymentStatus = String(mayaReceipt?.payment_status ?? '').trim();
  const mayaPaymentLabel = {
    PAYMENT_SUCCESS: 'Paid',
    PAYMENT_FAILED: 'Failed',
    PAYMENT_EXPIRED: 'Expired',
    PAYMENT_CANCELLED: 'Cancelled',
  }[mayaPaymentStatus] ?? (mayaPaymentStatus || null);
  const enterprisePaymentStatus = String(enterpriseApiReceipt?.payment_status ?? '').trim();
  const enterprisePaymentLabel = {
    PAYMENT_SUCCESS: 'Paid',
    PAYMENT_FAILED: 'Failed',
    PAYMENT_EXPIRED: 'Expired',
    PAYMENT_CANCELLED: 'Cancelled',
    SUCCESS: 'Paid',
    FAILED: 'Failed',
    EXPIRED: 'Expired',
    CANCELLED: 'Cancelled',
  }[enterprisePaymentStatus.toUpperCase()] ?? (enterprisePaymentStatus || null);
  const lastSix = (value?: string | null) => {
    const trimmed = value?.trim() ?? '';
    return trimmed ? trimmed.slice(-6) : '';
  };
  const enterprisePaymentRefLast6 = enterpriseApiReceipt?.payment_reference_last6
    || lastSix(String(enterpriseApiReceipt?.payment_reference_no ?? ''))
    || 'N/A';
  const enterpriseRequestRefLast6 = enterpriseApiReceipt?.request_reference_last6
    || lastSix(String(enterpriseApiReceipt?.request_reference_no ?? ''))
    || 'N/A';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <div className="bg-gradient-primary p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">Order Receipt</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {config.show_store_name && (
            <div className="text-center border-b border-border pb-3">
              <p className="font-black text-base text-foreground">{storeName}</p>
              <p className="text-[11px] text-muted-foreground">Official Receipt</p>
            </div>
          )}

          <div className="space-y-1 text-xs">
            {config.show_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-semibold">{new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {config.show_order_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order #</span>
                <span className="font-bold text-primary">{order.order_number}</span>
              </div>
            )}
            {config.show_customer_name && customer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-semibold">{customer.telegram_first_name} {customer.telegram_last_name ?? ''}</span>
              </div>
            )}
            {config.show_customer_code && customer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer ID</span>
                <span className="font-mono font-bold">{customer.customer_code}</span>
              </div>
            )}
          </div>

          {config.show_items && order.items?.length > 0 && (
            <div className="border-t border-dashed border-border pt-3 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Items</p>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="flex-1 text-foreground">
                    {item.name}{item.sub_name ? ` · ${item.sub_name}` : item.variant ? ` (${item.variant})` : ''} x{item.quantity}
                  </span>
                  <span className="font-semibold ml-2">{formatMoney(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-dashed border-border pt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatMoney(order.subtotal)}</span>
            </div>
            {config.show_fees && order.fees_applied?.map((fee, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{fee.name}</span>
                <span className={`font-semibold ${fee.category === 'discount' ? 'text-green-600' : ''}`}>
                  {fee.category === 'discount' ? '-' : '+'}{formatMoney(fee.amount)}
                </span>
              </div>
            ))}
            {config.show_delivery_fee && order.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-semibold">{formatMoney(order.delivery_fee)}</span>
              </div>
            )}
            {config.show_voucher && order.voucher_discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voucher ({order.voucher_code})</span>
                <span className="font-semibold text-green-600">-{formatMoney(order.voucher_discount)}</span>
              </div>
            )}
            {config.show_payment_method && paymentMethod && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-semibold">{paymentMethod.name}</span>
              </div>
            )}
          </div>

          {(paymentMethod?.type === 'maya' || mayaReceipt) && (
            <div className="border-t border-dashed border-border pt-3 space-y-1 text-xs">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Maya Payment</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-semibold ${mayaPaymentStatus === 'PAYMENT_SUCCESS' || order.status === 'payment_verified' ? 'text-green-600' : ''}`}>
                  {order.status === 'payment_verified' ? 'Paid' : (mayaPaymentLabel ?? 'Pending')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Checkout ID</span>
                <span className="font-mono font-semibold break-all">{String(mayaReceipt?.checkout_id ?? order.maya_checkout_id ?? 'N/A')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono font-semibold break-all">{String(mayaReceipt?.payment_id ?? 'N/A')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-semibold break-all">{String(mayaReceipt?.request_reference_number ?? order.id)}</span>
              </div>
            </div>
          )}

          {(paymentMethod?.type === 'enterprise_api' || enterpriseApiReceipt) && (
            <div className="border-t border-dashed border-border pt-3 space-y-1 text-xs">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Enterprise API Payment</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-semibold ${(order.status === 'payment_verified' || enterprisePaymentLabel === 'Paid') ? 'text-green-600' : ''}`}>
                  {order.status === 'payment_verified' ? 'Paid' : (enterprisePaymentLabel ?? 'Pending')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Ref (last 6)</span>
                <span className="font-mono font-semibold break-all">{enterprisePaymentRefLast6}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Request Ref (last 6)</span>
                <span className="font-mono font-semibold break-all">{enterpriseRequestRefLast6}</span>
              </div>
              {enterpriseApiReceipt?.qrph_invoice_no && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">QRPh Invoice No.</span>
                  <span className="font-mono font-semibold break-all">{String(enterpriseApiReceipt.qrph_invoice_no)}</span>
                </div>
              )}
            </div>
          )}

          {config.show_total && (
            <div className="border-t-2 border-border pt-2 flex justify-between">
              <span className="font-bold text-sm">TOTAL</span>
              <span className="font-black text-base text-primary">{formatMoney(order.total)}</span>
            </div>
          )}

          <div className="text-center pt-2 border-t border-dashed border-border">
            <p className="text-[10px] text-muted-foreground">Thank you for your order!</p>
            <p className="text-[10px] text-muted-foreground">{storeName}</p>
          </div>
        </div>

        <div className="p-3 border-t border-border">
          <Button onClick={onClose} className="w-full btn-gradient h-9 text-sm font-bold">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
