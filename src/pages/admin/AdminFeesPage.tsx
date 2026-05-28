import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { FeeConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const EMPTY = { name: '', category: 'charge', value_type: 'fixed', value: '', is_active: true, applies_always: true };
const PREVIEW_BASE = 1000;

const CATEGORY_COLORS: Record<string, string> = {
  charge: 'bg-orange-100 text-orange-700',
  discount: 'bg-green-100 text-green-700',
  fee: 'bg-blue-100 text-blue-700',
};

export default function AdminFeesPage() {
  const { toast } = useToast();
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editFee, setEditFee] = useState<FeeConfig | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const previewValue = form.value ? parseFloat(form.value) || 0 : 0;
  const previewAmount = form.value_type === 'percent' ? (PREVIEW_BASE * previewValue) / 100 : previewValue;
  const previewSignedAmount = form.category === 'discount' ? -previewAmount : previewAmount;

  useEffect(() => {
    supabase.from('fees_config').select('*').order('created_at').then(({ data }) => {
      setFees((data as unknown as FeeConfig[]) ?? []);
    });
  }, []);

  const openEdit = (f: FeeConfig) => {
    setEditFee(f);
    setForm({ name: f.name, category: f.category, value_type: f.value_type, value: String(f.value), is_active: f.is_active, applies_always: f.applies_always });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.value) { toast({ description: 'Name and value required', variant: 'destructive' }); return; }
    setIsSaving(true);
    const payload = {
      name: form.name,
      category: form.category as FeeConfig['category'],
      value_type: form.value_type as FeeConfig['value_type'],
      value: parseFloat(form.value),
      is_active: form.is_active,
      applies_always: form.applies_always,
    };
    if (editFee) {
      await supabase.from('fees_config').update(payload).eq('id', editFee.id);
      setFees(p => p.map(f => f.id === editFee.id ? { ...f, ...payload } : f));
    } else {
      const { data } = await supabase.from('fees_config').insert(payload).select().maybeSingle();
      if (data) setFees(p => [...p, data as unknown as FeeConfig]);
    }
    toast({ description: editFee ? 'Updated!' : 'Added!' });
    setShowForm(false);
    setIsSaving(false);
  };

  const deleteFee = async () => {
    if (!deleteId) return;
    await supabase.from('fees_config').delete().eq('id', deleteId);
    setFees(p => p.filter(f => f.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <AdminLayout title="Fees & Charges">
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => { setEditFee(null); setForm(EMPTY); setShowForm(true); }} className="btn-gradient gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Charge / Discount</Button>
      </div>

      <div className="space-y-2">
        {fees.map(f => (
          <div key={f.id} className="bg-card rounded-xl border border-border p-3 shadow-brand-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{f.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[f.category] ?? ''}`}>{f.category}</span>
                {!f.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Inactive</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                {f.value_type === 'percent' ? `${f.value}%` : `₱${f.value}`}
                {f.applies_always && ' · Applied to all orders'}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => openEdit(f)} className="w-7 h-7 p-0 hover:bg-primary-light hover:text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleteId(f.id)} className="w-7 h-7 p-0 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
        {fees.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No fees or charges configured</div>}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editFee ? 'Edit' : 'Add'} Charge / Discount</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Service Charge" className="mt-1 h-8 text-sm" /></div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="charge">Charge (adds to total)</SelectItem>
                  <SelectItem value="discount">Discount (deducts from total)</SelectItem>
                  <SelectItem value="fee">Fee (informational)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Value Type</Label>
                <Select value={form.value_type} onValueChange={v => setForm(p => ({ ...p, value_type: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (₱)</SelectItem>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Value *</Label><Input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder={form.value_type === 'percent' ? '5' : '50'} className="mt-1 h-8 text-sm" /></div>
            </div>
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2">
              <p className="text-[11px] font-bold text-foreground">Live preview on ₱{PREVIEW_BASE.toFixed(2)}</p>
              <p className="text-[11px] text-muted-foreground">
                {form.value_type === 'percent' ? `${previewValue}%` : `₱${previewValue.toFixed(2)}`} {form.category === 'discount' ? 'discounts' : 'charges'} {form.category === 'discount' ? 'subtract' : 'add'} {previewAmount > 0 ? `₱${previewAmount.toFixed(2)}` : '₱0.00'}.
              </p>
              <p className={`text-[11px] font-semibold mt-1 ${previewSignedAmount < 0 ? 'text-green-600' : 'text-primary'}`}>
                Net effect: {previewSignedAmount < 0 ? '-' : '+'}₱{Math.abs(previewSignedAmount).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.applies_always} onCheckedChange={v => setForm(p => ({ ...p, applies_always: v }))} /><Label className="text-xs">Apply to all orders automatically</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} /><Label className="text-xs">Active</Label></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={save} disabled={isSaving} className="flex-1 btn-gradient">{isSaving ? 'Saving...' : editFee ? 'Update' : 'Add'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Fee?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFee} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
