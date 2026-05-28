import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ImageUploadInput from '@/components/common/ImageUploadInput';
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const EMPTY = { name: '', type: 'custom', instructions: '', qr_image: '', account_name: '', account_number: '', is_active: true, sort_order: 0 };

export default function AdminPaymentMethodsPage() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.from('payment_methods').select('*').order('sort_order').then(({ data }) => {
      setMethods((data as unknown as PaymentMethod[]) ?? []);
    });
  }, []);

  const openAdd = () => { setEditMethod(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (m: PaymentMethod) => {
    setEditMethod(m);
    setForm({
      name: m.name, type: m.type,
      instructions: m.details?.instructions ?? '',
      qr_image: m.details?.qr_image ?? '',
      account_name: m.details?.account_name ?? '',
      account_number: m.details?.account_number ?? '',
      is_active: m.is_active,
      sort_order: m.sort_order,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name) { toast({ description: 'Name required', variant: 'destructive' }); return; }
    setIsSaving(true);
    const payload = {
      name: form.name,
      type: form.type as PaymentMethod['type'],
      details: {
        instructions: form.instructions,
        qr_image: form.qr_image || undefined,
        account_name: form.account_name || undefined,
        account_number: form.account_number || undefined,
      },
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    if (editMethod) {
      await supabase.from('payment_methods').update(payload).eq('id', editMethod.id);
      setMethods(p => p.map(m => m.id === editMethod.id ? { ...m, ...payload } : m));
    } else {
      const { data } = await supabase.from('payment_methods').insert(payload).select().maybeSingle();
      if (data) setMethods(p => [...p, data as unknown as PaymentMethod]);
    }
    toast({ description: editMethod ? 'Updated!' : 'Added!' });
    setShowForm(false);
    setIsSaving(false);
  };

  const deleteMethod = async () => {
    if (!deleteId) return;
    await supabase.from('payment_methods').delete().eq('id', deleteId);
    setMethods(p => p.filter(m => m.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <AdminLayout title="Payment Methods">
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openAdd} className="btn-gradient gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Method</Button>
      </div>

      <div className="space-y-2">
        {methods.map(m => (
          <div key={m.id} className="bg-card rounded-xl border border-border p-3 shadow-brand-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{m.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="text-xs text-muted-foreground capitalize">{m.type}</p>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => openEdit(m)} className="w-7 h-7 p-0 hover:bg-primary-light hover:text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleteId(m.id)} className="w-7 h-7 p-0 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
        {methods.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No payment methods</div>}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editMethod ? 'Edit' : 'Add'} Payment Method</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="qrph">QRPH / GCash</SelectItem>
                  <SelectItem value="maya">Maya</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="custom">Manual QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Instructions</Label><Textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} className="mt-1 text-sm h-16 resize-none" /></div>
            {(form.type === 'qrph' || form.type === 'custom') && (
              <>
                <ImageUploadInput value={form.qr_image} onChange={v => setForm(p => ({ ...p, qr_image: v }))} label="QR Code Image" />
                <div><Label className="text-xs">Account Name</Label><Input value={form.account_name} onChange={e => setForm(p => ({ ...p, account_name: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">Account Number</Label><Input value={form.account_number} onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
              </>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 h-8 text-sm" /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} /><Label className="text-xs">Active</Label></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={save} disabled={isSaving} className="flex-1 btn-gradient">{isSaving ? 'Saving...' : editMethod ? 'Update' : 'Add'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Payment Method?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMethod} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
