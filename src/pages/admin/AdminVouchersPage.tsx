import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Voucher } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Tag, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const EMPTY = {
  code: '',
  internal_voucher_uid: crypto.randomUUID(),
  discount_type: 'fixed',
  discount_value: '',
  max_uses: '',
  min_order_amount: '0',
  starts_at: '',
  expiry_date: '',
  auto_start: false,
  auto_end: false,
  is_active: true,
};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export default function AdminVouchersPage() {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [revokeVoucherId, setRevokeVoucherId] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.from('vouchers').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setVouchers((data as unknown as Voucher[]) ?? []);
    });
  }, []);

  const auditVoucher = async (payload: {
    voucher_id: string;
    voucher_uid?: string | null;
    action: string;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }) => {
    await supabase.from('voucher_audit_logs').insert({
      ...payload,
      actor_type: 'admin',
      actor_identifier: 'admin-panel',
    });
  };

  const openAdd = () => { setEditVoucher(null); setForm({ ...EMPTY, code: generateCode(), internal_voucher_uid: crypto.randomUUID() }); setShowForm(true); };
  const openEdit = (v: Voucher) => {
    setEditVoucher(v);
    setForm({
      code: v.code,
      internal_voucher_uid: v.internal_voucher_uid ?? crypto.randomUUID(),
      discount_type: v.discount_type,
      discount_value: String(v.discount_value),
      max_uses: String(v.max_uses ?? ''),
      min_order_amount: String(v.min_order_amount),
      starts_at: v.starts_at ? new Date(v.starts_at).toISOString().slice(0, 16) : '',
      expiry_date: v.expiry_date ? new Date(v.expiry_date).toISOString().slice(0, 16) : '',
      auto_start: Boolean(v.starts_at),
      auto_end: Boolean(v.expiry_date),
      is_active: v.is_active,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.code || !form.discount_value) { toast({ description: 'Code and discount value required', variant: 'destructive' }); return; }
    if (form.auto_start && !form.starts_at) { toast({ description: 'Start date/time is required when auto start is enabled', variant: 'destructive' }); return; }
    if (form.auto_end && !form.expiry_date) { toast({ description: 'End date/time is required when auto end is enabled', variant: 'destructive' }); return; }
    setIsSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      internal_voucher_uid: form.internal_voucher_uid ?? crypto.randomUUID(),
      discount_type: form.discount_type as 'percent' | 'fixed',
      discount_value: parseFloat(form.discount_value),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      starts_at: form.auto_start && form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expiry_date: form.auto_end && form.expiry_date ? new Date(form.expiry_date).toISOString() : null,
      is_active: editVoucher?.revoked ? false : form.is_active,
      revoked: editVoucher?.revoked ?? false,
      revoked_at: editVoucher?.revoked_at ?? null,
      revoked_reason: editVoucher?.revoked_reason ?? null,
    };
    if (editVoucher) {
      await supabase.from('vouchers').update(payload).eq('id', editVoucher.id);
      setVouchers(p => p.map(v => v.id === editVoucher.id ? { ...v, ...payload } : v));
      await auditVoucher({
        voucher_id: editVoucher.id,
        voucher_uid: payload.internal_voucher_uid,
        action: 'updated',
        reason: 'Edited in admin panel',
        metadata: { code: payload.code, discount_type: payload.discount_type, discount_value: payload.discount_value, starts_at: payload.starts_at, expiry_date: payload.expiry_date },
      });
      toast({ description: 'Voucher updated!' });
    } else {
      const { data } = await supabase.from('vouchers').insert(payload).select().maybeSingle();
      if (data) setVouchers(p => [data as unknown as Voucher, ...p]);
      if (data) {
        await auditVoucher({
          voucher_id: data.id,
          voucher_uid: (data as unknown as Voucher).internal_voucher_uid ?? payload.internal_voucher_uid,
          action: 'created',
          reason: 'Created in admin panel',
          metadata: { code: payload.code, discount_type: payload.discount_type, discount_value: payload.discount_value, starts_at: payload.starts_at, expiry_date: payload.expiry_date },
        });
      }
      toast({ description: 'Voucher created!' });
    }
    setShowForm(false);
    setIsSaving(false);
  };

  const copyVoucherUid = async (uid?: string | null) => {
    if (!uid) return;
    await navigator.clipboard.writeText(uid);
    toast({ description: 'Voucher UID copied' });
  };

  const toggleActive = async (v: Voucher) => {
    if (v.revoked) return;
    await supabase.from('vouchers').update({ is_active: !v.is_active }).eq('id', v.id);
    setVouchers(p => p.map(x => x.id === v.id ? { ...x, is_active: !v.is_active } : x));
    await auditVoucher({
      voucher_id: v.id,
      voucher_uid: v.internal_voucher_uid ?? null,
      action: !v.is_active ? 'activated' : 'deactivated',
      reason: !v.is_active ? 'Activated from admin panel' : 'Deactivated from admin panel',
      metadata: { code: v.code },
    });
  };

  const deleteVoucher = async () => {
    if (!deleteId) return;
    const voucher = vouchers.find(v => v.id === deleteId);
    if (!voucher) return;
    if (revokeVoucherId) {
      const revoked_at = new Date().toISOString();
      await supabase.from('vouchers').update({
        is_active: false,
        revoked: true,
        revoked_at,
        revoked_reason: 'Revoked from admin panel',
      }).eq('id', deleteId);
      setVouchers(p => p.map(v => v.id === deleteId ? { ...v, is_active: false, revoked: true, revoked_at, revoked_reason: 'Revoked from admin panel' } : v));
      await auditVoucher({
        voucher_id: voucher.id,
        voucher_uid: voucher.internal_voucher_uid ?? null,
        action: 'revoked',
        reason: 'Revoked from admin panel',
        metadata: { code: voucher.code },
      });
    } else {
      await supabase.from('vouchers').update({
        is_active: false,
      }).eq('id', deleteId);
      setVouchers(p => p.map(v => v.id === deleteId ? { ...v, is_active: false } : v));
      await auditVoucher({
        voucher_id: voucher.id,
        voucher_uid: voucher.internal_voucher_uid ?? null,
        action: 'deactivated',
        reason: 'Deactivated from admin panel',
        metadata: { code: voucher.code },
      });
    }
    setDeleteId(null);
    setRevokeVoucherId(false);
  };

  return (
    <AdminLayout title="Vouchers">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">{vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={openAdd} className="btn-gradient gap-1.5"><Plus className="w-3.5 h-3.5" /> Create Voucher</Button>
      </div>

      <div className="space-y-2">
        {vouchers.map(v => (
          <div key={v.id} className="bg-card rounded-xl border border-border p-3 shadow-brand-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black font-mono text-foreground">{v.code}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyVoucherUid(v.internal_voucher_uid)}
                    className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                  >
                    <Copy className="w-3 h-3" />
                    UID
                  </Button>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {v.is_referral && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Referral</span>}
                  {v.revoked && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">Revoked</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {v.discount_type === 'percent' ? `${v.discount_value}% off` : `₱${v.discount_value} off`}
                  {v.min_order_amount > 0 && ` · Min ₱${v.min_order_amount}`}
                  {v.max_uses != null && ` · ${v.used_count}/${v.max_uses} used`}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono break-all">
                  UID: {v.internal_voucher_uid ?? 'N/A'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {v.starts_at ? `Starts: ${new Date(v.starts_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Starts immediately'}
                  {v.expiry_date ? ` · Ends: ${new Date(v.expiry_date).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ' · No end date'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch checked={v.is_active} onCheckedChange={() => toggleActive(v)} className="scale-75" disabled={Boolean(v.revoked)} />
                <Button size="sm" variant="ghost" onClick={() => openEdit(v)} className="w-7 h-7 p-0 hover:bg-primary-light hover:text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { setDeleteId(v.id); setRevokeVoucherId(false); }} className="w-7 h-7 p-0 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </div>
        ))}
        {vouchers.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No vouchers yet</div>}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editVoucher ? 'Edit Voucher' : 'Create Voucher'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Code</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="VOUCHER123" className="h-8 text-sm font-mono uppercase" />
                <Button size="sm" variant="outline" onClick={() => setForm(p => ({ ...p, code: generateCode() }))} className="h-8 text-xs px-2 flex-shrink-0">Gen</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Internal Voucher UID</Label>
              <Input value={form.internal_voucher_uid} readOnly className="mt-1 h-8 text-sm font-mono bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Switch checked={form.auto_start} onCheckedChange={v => setForm(p => ({ ...p, auto_start: v }))} />
                <Label className="text-xs">Auto Start</Label>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Switch checked={form.auto_end} onCheckedChange={v => setForm(p => ({ ...p, auto_end: v }))} />
                <Label className="text-xs">Auto End</Label>
              </div>
            </div>
            {form.auto_start && (
              <div>
                <Label className="text-xs">Start At</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(p => ({ ...p, starts_at: e.target.value }))} className="mt-1 h-8 text-sm" />
              </div>
            )}
            {form.auto_end && (
              <div>
                <Label className="text-xs">End At</Label>
                <Input type="datetime-local" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} className="mt-1 h-8 text-sm" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(p => ({ ...p, discount_type: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (₱)</SelectItem>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Value</Label>
                <Input type="number" value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))} placeholder={form.discount_type === 'percent' ? '10' : '50'} className="mt-1 h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Max Uses</Label>
                <Input type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} placeholder="Unlimited" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Min Order (₱)</Label>
                <Input type="number" value={form.min_order_amount} onChange={e => setForm(p => ({ ...p, min_order_amount: e.target.value }))} placeholder="0" className="mt-1 h-8 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
              <Label className="text-xs">Active</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={save} disabled={isSaving} className="flex-1 btn-gradient">{isSaving ? 'Saving...' : editVoucher ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Deactivate Voucher?</AlertDialogTitle><AlertDialogDescription>You can only deactivate it, or revoke the internal voucher ID so it can no longer be used.</AlertDialogDescription></AlertDialogHeader>
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3">
            <Checkbox id="revoke-voucher" checked={revokeVoucherId} onCheckedChange={v => setRevokeVoucherId(Boolean(v))} />
            <Label htmlFor="revoke-voucher" className="text-xs leading-tight">
              Revoke voucher ID
              <span className="block text-[11px] text-muted-foreground">This makes the voucher unusable even if it is reactivated later.</span>
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteVoucher} className="bg-destructive text-destructive-foreground">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
