import { PaymentMethod } from '@/types';

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  static_qr_code: 'Static QR Code',
  wallet_address: 'Wallet Address',
  payment_gateway: 'Payment Gateway',
  business_deposit: 'Business Deposit',
  qrph: 'QRPH / GCash',
  maya: 'Maya',
  cod: 'Cash on Delivery',
  custom: 'Manual QR Code',
};

export function getPaymentMethodTileImage(method: PaymentMethod): string | undefined {
  return method.details?.logo_url || method.details?.qr_image;
}

export function isManualPaymentMethod(method: PaymentMethod | { type: string } | null | undefined): boolean {
  if (!method) return false;
  return ['static_qr_code', 'wallet_address', 'business_deposit', 'qrph', 'custom'].includes(method.type);
}

export function isRedirectPaymentMethod(method: PaymentMethod | { type: string } | null | undefined): boolean {
  if (!method) return false;
  return ['payment_gateway', 'maya'].includes(method.type);
}
