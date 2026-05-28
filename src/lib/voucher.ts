import { supabase } from '@/integrations/supabase/client';
import { Voucher } from '@/types';

export async function validateVoucherRules(voucher: Voucher, customerId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase.functions.invoke('voucher-eligibility', {
    body: {
      voucher_id: voucher.id,
      customer_id: customerId,
    },
  });

  if (error) {
    console.error('Voucher validation error:', error);
    return { ok: false, message: 'Unable to validate voucher right now. Please try again.' };
  }

  if (data?.ok === false) {
    return { ok: false, message: String(data?.message ?? 'Voucher is not eligible') };
  }

  return { ok: true };
}
