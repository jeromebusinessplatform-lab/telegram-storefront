import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Pencil, Trash2, Ban, CheckCircle, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function AdminCustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ phone: '', email: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.from('customers').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCustomers((data as Customer[]) ?? []);
    });
  }, []);

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setEditForm({ phone: c.phone ?? '', email: c.email ?? '', address: c.address ?? '' });
  };

  const saveEdit = async () => {
    if (!editCustomer) return;
    setIsSaving(true);
    await supabase.from('customers').update(editForm).eq('id', editCustomer.id);
    setCustomers(p => p.map(c => c.id === editCustomer.id ? { ...c, ...editForm } : c));
    setEditCustomer(null);
    toast({ description: 'Customer updated' });
    setIsSaving(false);
  };

  const toggleBan = async (c: Customer) => {
    await supabase.from('customers').update({ is_banned: !c.is_banned }).eq('id', c.id);
    setCustomers(p => p.map(x => x.id === c.id ? { ...x, is_banned: !c.is_banned } : x));
    toast({ description: c.is_banned ? 'Customer unbanned' : 'Customer banned' });
  };

  const deleteCustomer = async () => {
    if (!deleteId) return;
    await supabase.from('customers').delete().eq('id', deleteId);
    setCustomers(p => p.filter(c => c.id !== deleteId));
    setDeleteId(null);
    toast({ description: 'Customer deleted' });
  };

  const filtered = customers.filter(c =>
    [c.telegram_first_name, c.telegram_username, c.customer_code, c.phone].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout title="Customers">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, username, ID..." className="h-8 text-sm pl-8" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-10 text-center"><Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No customers found</p></div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="bg-card rounded-xl border border-border p-3 shadow-brand-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{(c.telegram_first_name ?? 'U')[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground">{c.telegram_first_name} {c.telegram_last_name ?? ''}</p>
                    {c.is_banned && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">Banned</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">@{c.telegram_username ?? 'N/A'} · ID: <span className="font-mono font-bold">{c.customer_code}</span></p>
                  {c.phone && <p className="text-[11px] text-muted-foreground">{c.phone}</p>}
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{new Date(c.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="w-7 h-7 p-0 hover:bg-primary-light hover:text-primary">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleBan(c)} className={`w-7 h-7 p-0 ${c.is_banned ? 'hover:bg-green-50 hover:text-green-600' : 'hover:bg-red-50 hover:text-red-600'}`}>
                    {c.is_banned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.id)} className="w-7 h-7 p-0 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editCustomer} onOpenChange={() => setEditCustomer(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            <div><Label className="text-xs">Email</Label><Input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            <div><Label className="text-xs">Address</Label><Input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditCustomer(null)} className="flex-1">Cancel</Button>
              <Button onClick={saveEdit} disabled={isSaving} className="flex-1 btn-gradient">{isSaving ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Customer?</AlertDialogTitle><AlertDialogDescription>This will permanently delete all customer data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCustomer} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
