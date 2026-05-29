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
import { PAYMENT_METHOD_LABELS } from '@/lib/payment-method';
import ImagePreviewDialog from '@/components/common/ImagePreviewDialog';

type PaymentMethodForm = {
  name: string;
  type: PaymentMethod['type'];
  instructions: string;
  logo_url: string;
  qr_image: string;
  wallet_address: string;
  gateway_url: string;
  gateway_channel: NonNullable<PaymentMethod['details']['gateway_channel']>;
  bank_name: string;
  account_name: string;
  account_number: string;
  account_type: string;
  is_active: boolean;
  sort_order: number;
};

const EMPTY: PaymentMethodForm = {
  name: '',
  type: 'static_qr_code',
  instructions: '',
  logo_url: '',
  qr_image: '',
  wallet_address: '',
  gateway_url: '',
  gateway_channel: 'all',
  bank_name: '',
  account_name: '',
  account_number: '',
  account_type: '',
  is_active: true,
  sort_order: 0,
};

export default function AdminPaymentMethodsPage() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
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
      name: m.name,
      type: m.type,
      instructions: m.details?.instructions ?? '',
      logo_url: m.details?.logo_url ?? '',
      qr_image: m.details?.qr_image ?? '',
      wallet_address: m.details?.wallet_address ?? '',
      gateway_url: m.details?.gateway_url ?? '',
      gateway_channel: m.details?.gateway_channel ?? 'all',
      bank_name: m.details?.bank_name ?? '',
      account_name: m.details?.account_name ?? '',
      account_number: m.details?.account_number ?? '',
      account_type: m.details?.account_type ?? '',
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
        logo_url: form.logo_url || undefined,
        qr_image: form.qr_image || undefined,
        wallet_address: form.wallet_address || undefined,
        gateway_url: form.gateway_url || undefined,
        gateway_channel: form.gateway_channel || undefined,
        bank_name: form.bank_name || undefined,
        account_name: form.account_name || undefined,
        account_number: form.account_number || undefined,
        account_type: form.account_type || undefined,
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
            <button
              type="button"
              onClick={() => setPreviewUrl(m.details?.logo_url || m.details?.qr_image || '')}
              className="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0 overflow-hidden border border-primary/10"
            >
              {(m.details?.logo_url || m.details?.qr_image) ? (
                <img src={m.details?.logo_url || m.details?.qr_image || ''} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                <CreditCard className="w-4 h-4 text-primary" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{m.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{PAYMENT_METHOD_LABELS[m.type] ?? m.type}</p>
              <p className="text-xs text-muted-foreground capitalize">{m.details?.instructions}</p>
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
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as PaymentMethod['type'] }))}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="static_qr_code">Static QR Code</SelectItem>
                  <SelectItem value="wallet_address">Wallet Address</SelectItem>
                  <SelectItem value="payment_gateway">Payment Gateway</SelectItem>
                  <SelectItem value="enterprise_api">Enterprise API</SelectItem>
                  <SelectItem value="business_deposit">Business Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Instructions</Label><Textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} className="mt-1 text-sm h-16 resize-none" /></div>
            <ImageUploadInput value={form.logo_url} onChange={v => setForm(p => ({ ...p, logo_url: v }))} label="Tile Logo" />
            {form.type === 'static_qr_code' && (
              <>
                <ImageUploadInput value={form.qr_image} onChange={v => setForm(p => ({ ...p, qr_image: v }))} label="QR Code Image" />
              </>
            )}
            {form.type === 'wallet_address' && (
              <div><Label className="text-xs">Wallet Address</Label><Input value={form.wallet_address} onChange={e => setForm(p => ({ ...p, wallet_address: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            )}
            {form.type === 'payment_gateway' && (
              <div><Label className="text-xs">Gateway URL</Label><Input value={form.gateway_url} onChange={e => setForm(p => ({ ...p, gateway_url: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            )}
            {form.type === 'enterprise_api' && (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Secure Gateway URL</Label>
                  <Input value={form.gateway_url} onChange={e => setForm(p => ({ ...p, gateway_url: e.target.value }))} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Gateway Channel</Label>
                  <Select value={form.gateway_channel} onValueChange={v => setForm(p => ({ ...p, gateway_channel: v as PaymentMethodForm['gateway_channel'] }))}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="qrph">QRPh</SelectItem>
                      <SelectItem value="maya">Maya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {form.type === 'business_deposit' && (
              <div className="space-y-2">
                <div><Label className="text-xs">Bank Name</Label><Input value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">Account Name</Label><Input value={form.account_name} onChange={e => setForm(p => ({ ...p, account_name: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">Account Number</Label><Input value={form.account_number} onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">Account Type</Label><Input value={form.account_type} onChange={e => setForm(p => ({ ...p, account_type: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
              </div>
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

      <ImagePreviewDialog
        open={Boolean(previewUrl)}
        onOpenChange={(open) => { if (!open) setPreviewUrl(''); }}
        title="Payment Method Tile"
        imageUrl={previewUrl}
        alt="Payment method tile image"
        showDownload
        downloadFileName="payment-method-tile"
      />

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
