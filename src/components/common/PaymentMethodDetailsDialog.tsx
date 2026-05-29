import { useMemo } from 'react';
import { Download, ExternalLink, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaymentMethod } from '@/types';
import { getPaymentMethodTileImage, isRedirectPaymentMethod, isManualPaymentMethod } from '@/lib/payment-method';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: PaymentMethod | null;
}

function buildDepositSvg(method: PaymentMethod) {
  const details = method.details ?? {};
  const lines = [
    method.name,
    details.bank_name ? `Bank: ${details.bank_name}` : '',
    details.account_name ? `Account Name: ${details.account_name}` : '',
    details.account_number ? `Account Number: ${details.account_number}` : '',
    details.account_type ? `Account Type: ${details.account_type}` : '',
  ].filter(Boolean);

  const width = 1200;
  const height = Math.max(500, 220 + lines.length * 78);
  const rows = lines.map((line, index) => `<text x="80" y="${260 + index * 78}" font-family="Arial, sans-serif" font-size="44" fill="#172033">${line}</text>`).join('');
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" rx="36" fill="#f8fbff"/>
      <rect x="36" y="36" width="${width - 72}" height="${height - 72}" rx="28" fill="#ffffff" stroke="#d7e4ff" stroke-width="4"/>
      <text x="80" y="150" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#0f1f45">${method.name}</text>
      ${rows}
    </svg>
  `)}`;
}

export default function PaymentMethodDetailsDialog({ open, onOpenChange, method }: PaymentMethodDetailsDialogProps) {
  const { toast } = useToast();
  const tileImage = method ? getPaymentMethodTileImage(method) : '';

  const downloadHref = useMemo(() => {
    if (!method) return '';
    if (method.type === 'business_deposit') {
      return buildDepositSvg(method);
    }
    return method.details?.qr_image || method.details?.logo_url || '';
  }, [method]);

  const copyText = async (value?: string | null, label = 'Value') => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast({ description: `${label} copied` });
  };

  if (!method) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-base">{method.name}</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4 space-y-3">
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-center rounded-lg bg-background overflow-hidden min-h-36">
              {tileImage ? (
                <img src={tileImage} alt={method.name} className="max-h-48 w-full object-contain p-2" />
              ) : (
                <div className="text-xs text-muted-foreground text-center px-4">No logo uploaded for this payment method.</div>
              )}
            </div>
          </div>

          {method.details?.instructions && (
            <p className="text-xs text-muted-foreground">{method.details.instructions}</p>
          )}

          {method.type === 'static_qr_code' && method.details?.qr_image && (
            <div className="flex gap-2">
              <Button asChild className="flex-1 gap-2 btn-gradient">
                <a href={method.details.qr_image} download={`${method.name}-qr`} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" />
                  Download QR
                </a>
              </Button>
            </div>
          )}

          {method.type === 'wallet_address' && (
            <div className="rounded-xl border border-border bg-background p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Wallet Address</p>
              <p className="text-xs font-mono break-all">{method.details.wallet_address || 'N/A'}</p>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => copyText(method.details.wallet_address, 'Wallet address')}
                disabled={!method.details.wallet_address}
              >
                <Copy className="h-4 w-4" />
                Copy Address
              </Button>
            </div>
          )}

          {isRedirectPaymentMethod(method) && (
            <div className="rounded-xl border border-border bg-background p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {method.type === 'enterprise_api' ? 'Enterprise API Gateway' : 'Payment Gateway'}
              </p>
              {method.details?.gateway_channel && (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Channel</span>
                  <span className="font-semibold uppercase">{method.details.gateway_channel}</span>
                </div>
              )}
              <Button asChild className="w-full gap-2 btn-gradient">
                <a href={method.details.gateway_url || '#'} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open Gateway
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => copyText(method.details.gateway_url, 'Gateway link')}
                disabled={!method.details.gateway_url}
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          )}

          {method.type === 'business_deposit' && (
            <div className="rounded-xl border border-border bg-background p-3 space-y-2">
              <div className="grid grid-cols-1 gap-2 text-xs">
                {[
                  ['Bank Name', method.details.bank_name],
                  ['Account Name', method.details.account_name],
                  ['Account Number', method.details.account_number],
                  ['Account Type', method.details.account_type],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="font-semibold break-all">{value || 'N/A'}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => copyText(value, label)}
                      disabled={!value}
                      className="h-7 px-2 text-[10px]"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button asChild className="flex-1 gap-2 btn-gradient">
                  <a href={downloadHref} download={`${method.name}-deposit`} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}

          {!isManualPaymentMethod(method) && !isRedirectPaymentMethod(method) && method.type !== 'business_deposit' && (
            <p className="text-xs text-muted-foreground">No additional payment details configured.</p>
          )}

          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full gap-2">
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
