import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Voucher } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const EMPTY = { code: '', discount_type: 'fixed', discount_value: '', max_uses: '', min_order_amount: '0', expiry_date: '', is_active: true };

function generateCode() {
  return 'VC' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function AdminVouchersPage() {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.from('vouchers').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setVouchers((data as unknown as Voucher[]) ?? []);
    });
  }, []);

  const openAdd = () => { setEditVoucher(null); setForm({ ...EMPTY, code: generateCode() }); setShowForm(true); };
  const openEdit = (v: Voucher) => {
    setEditVoucher(v);
    setForm({ code: v.code, discount_type: v.discount_type, discount_value: String(v.discount_value), max_uses: String(v.max_uses ?? ''), min_order_amount: String(v.min_order_amount), expiry_date: v.expiry_date ? v.expiry_date.split('T')[0] : '', is_active: v.is_active });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.code || !form.discount_value) { toast({ description: 'Code and discount value required', variant: 'destructive' }); return; }
    setIsSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type as 'percent' | 'fixed',
      discount_value: parseFloat(form.discount_value),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : null,
      is_active: form.is_active,
    };
    if (editVoucher) {
      await supabase.from('vouchers').update(payload).eq('id', editVoucher.id);
      setVouchers(p => p.map(v => v.id === editVoucher.id ? { ...v, ...payload } : v));
      toast({ description: 'Voucher updated!' });
    } else {
      const { data } = await supabase.from('vouchers').insert(payload).select().maybeSingle();
      if (data) setVouchers(p => [data as unknown as Voucher, ...p]);
      toast({ description: 'Voucher created!' });
    }
    setShowForm(false);
    setIsSaving(false);
  };

  const toggleActive = async (v: Voucher) => {
    await supabase.from('vouchers').update({ is_active: !v.is_active }).eq('id', v.id);
    setVouchers(p => p.map(x => x.id === v.id ? { ...x, is_active: !v.is_active } : x));
  };

  const deleteVoucher = async () => {
    if (!deleteId) return;
    await supabase.from('vouchers').delete().eq('id', deleteId);
    setVouchers(p => p.filter(v => v.id !== deleteId));
    setDeleteId(null);
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
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {v.is_referral && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Referral</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {v.discount_type === 'percent' ? `${v.discount_value}% off` : `₱${v.discount_value} off`}
                  {v.min_order_amount > 0 && ` · Min ₱${v.min_order_amount}`}
                  {v.max_uses != null && ` · ${v.used_count}/${v.max_uses} used`}
                </p>
                {v.expiry_date && <p className="text-[11px] text-muted-foreground">Expires: {new Date(v.expiry_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
              </div>
              <div className="flex items-center gap-1.5">
                <Switch checked={v.is_active} onCheckedChange={() => toggleActive(v)} className="scale-75" />
                <Button size="sm" variant="ghost" onClick={() => openEdit(v)} className="w-7 h-7 p-0 hover:bg-primary-light hover:text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(v.id)} className="w-7 h-7 p-0 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
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
            <div>
              <Label className="text-xs">Expiry Date</Label>
              <Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} className="mt-1 h-8 text-sm" />
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
          <AlertDialogHeader><AlertDialogTitle>Delete Voucher?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteVoucher} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
