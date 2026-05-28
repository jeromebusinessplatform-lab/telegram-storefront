import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryProvider } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ImageUploadInput from '@/components/common/ImageUploadInput';
import { Plus, Pencil, Trash2, Truck, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const EMPTY = {
  name: '',
  type: 'dynamic',
  pricing_profile: 'standard',
  fee: '0',
  platform_fee: '0',
  traffic_surcharge_mode: 'flat',
  traffic_surcharge_value: '0',
  instructions: '',
  logo_url: '',
  is_active: true,
};

const DYNAMIC_PROFILES = [
  {
    value: 'standard',
    label: 'Dynamic 1',
    description: '₱60 base + ₱8/km for first 4.9 km + ₱6.50/km beyond 5 km',
  },
  {
    value: 'tier_2',
    label: 'Dynamic 2',
    description: '₱65 base + ₱8/km for first 4.9 km + ₱11/km beyond 5 km',
  },
  {
    value: 'tier_3',
    label: 'Dynamic 3',
    description: '₱70 base + ₱8/km for first 4.9 km + ₱8/km beyond 5 km',
  },
] as const;

export default function AdminDeliveryPage() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editProvider, setEditProvider] = useState<DeliveryProvider | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.from('delivery_providers').select('*').then(({ data }) => {
      setProviders((data as unknown as DeliveryProvider[]) ?? []);
    });
  }, []);

  const openEdit = (p: DeliveryProvider) => {
    setEditProvider(p);
    setForm({
      name: p.name,
      type: p.type === 'lalamove' ? 'dynamic' : p.type,
      pricing_profile: p.config?.pricing_profile ?? 'standard',
      fee: String(p.config?.fee ?? 0),
      platform_fee: String(p.config?.platform_fee ?? 0),
      traffic_surcharge_mode: p.config?.traffic_surcharge_mode ?? 'flat',
      traffic_surcharge_value: String(p.config?.traffic_surcharge_value ?? 0),
      instructions: p.config?.instructions ?? '',
      logo_url: p.logo_url ?? p.config?.logo_url ?? '',
      is_active: p.is_active,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name) { toast({ description: 'Name required', variant: 'destructive' }); return; }
    setIsSaving(true);
    const payload = {
      name: form.name,
      type: form.type as 'dynamic' | 'manual',
      config: {
        pricing_profile: form.type === 'dynamic' ? form.pricing_profile : undefined,
        fee: parseFloat(form.fee) || 0,
        platform_fee: form.type === 'dynamic' ? (parseFloat(form.platform_fee) || 0) : undefined,
        traffic_surcharge_mode: form.type === 'dynamic' ? form.traffic_surcharge_mode : undefined,
        traffic_surcharge_value: form.type === 'dynamic' ? (parseFloat(form.traffic_surcharge_value) || 0) : undefined,
        instructions: form.instructions,
      },
      logo_url: form.logo_url || null,
      is_active: form.is_active,
    };
    try {
      if (editProvider) {
        const { error } = await supabase.from('delivery_providers').update(payload).eq('id', editProvider.id);
        if (error) throw error;
        setProviders(p => p.map(x => x.id === editProvider.id ? { ...x, ...payload } : x));
      } else {
        const { data, error } = await supabase.from('delivery_providers').insert(payload).select().maybeSingle();
        if (error) throw error;
        if (data) setProviders(p => [...p, data as unknown as DeliveryProvider]);
      }
      toast({ description: editProvider ? 'Updated!' : 'Added!' });
      setShowForm(false);
    } catch (err) {
      toast({ description: `Failed: ${(err as { message?: string })?.message ?? 'Unknown error'}`, variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const deleteProvider = async () => {
    if (!deleteId) return;
    await supabase.from('delivery_providers').delete().eq('id', deleteId);
    setProviders(p => p.filter(x => x.id !== deleteId));
    setDeleteId(null);
  };

  const isDynamic = (type: string) => type === 'dynamic' || type === 'lalamove';

  return (
    <AdminLayout title="Delivery Providers">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-primary" />
          Dynamic fee: route distance + traffic adjustment + platform fee
        </p>
        <Button size="sm" onClick={() => { setEditProvider(null); setForm(EMPTY); setShowForm(true); }} className="btn-gradient gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {/* ── 3×3 Grid ── */}
      <div className="grid grid-cols-3 gap-3">
        {providers.map(p => {
          const logo = p.logo_url ?? p.config?.logo_url;
          return (
            <div key={p.id} className="bg-card rounded-xl border border-border p-3 shadow-brand-sm flex flex-col items-center gap-2 relative">
              <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                {logo ? (
                  <img src={logo} alt={p.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <Truck className="w-7 h-7 text-primary/40" />
                )}
              </div>
              <p className="text-[11px] font-bold text-foreground text-center leading-tight line-clamp-2">{p.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {isDynamic(p.type) ? 'Dynamic fee' : `₱${p.config?.fee ?? 0} fixed`}
              </p>
              <div className="flex gap-1.5 mt-auto">
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="w-7 h-7 p-0 hover:bg-primary-light hover:text-primary"><Pencil className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(p.id)} className="w-7 h-7 p-0 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          );
        })}

        {/* Add placeholder */}
        {providers.length === 0 && (
          <div className="col-span-3 py-12 text-center">
            <Truck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No delivery providers yet</p>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editProvider ? 'Edit' : 'Add'} Delivery Provider</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dynamic">Dynamic (distance-based fee)</SelectItem>
                  <SelectItem value="manual">Manual (fixed fee)</SelectItem>
              </SelectContent>
              </Select>
              {isDynamic(form.type) && (
                <div className="mt-2 space-y-2">
                  <div>
                    <Label className="text-xs">Dynamic Pricing System</Label>
                    <Select value={form.pricing_profile} onValueChange={v => setForm(p => ({ ...p, pricing_profile: v }))}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DYNAMIC_PROFILES.map(profile => (
                          <SelectItem key={profile.value} value={profile.value}>{profile.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {DYNAMIC_PROFILES.find(profile => profile.value === form.pricing_profile)?.description}
                  </p>
                  <div>
                    <Label className="text-xs">Platform Fee (₱)</Label>
                    <Input
                      type="number"
                      value={form.platform_fee}
                      onChange={e => setForm(p => ({ ...p, platform_fee: e.target.value }))}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Traffic Surcharge Mode</Label>
                    <Select value={form.traffic_surcharge_mode} onValueChange={v => setForm(p => ({ ...p, traffic_surcharge_mode: v }))}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat fee</SelectItem>
                        <SelectItem value="percent">Percent of delivery fee</SelectItem>
                        <SelectItem value="per_km">Per kilometer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Traffic Surcharge Value</Label>
                    <Input
                      type="number"
                      value={form.traffic_surcharge_value}
                      onChange={e => setForm(p => ({ ...p, traffic_surcharge_value: e.target.value }))}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
            {form.type === 'manual' && (
              <div>
                <Label className="text-xs">Fixed Fee (₱)</Label>
                <Input type="number" value={form.fee} onChange={e => setForm(p => ({ ...p, fee: e.target.value }))} className="mt-1 h-8 text-sm" />
              </div>
            )}
            <div>
              <Label className="text-xs">Provider Logo</Label>
              <div className="mt-1">
                {form.logo_url && (
                  <div className="flex items-center gap-2 mb-2">
                    <img src={form.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-muted" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                    <button onClick={() => setForm(p => ({ ...p, logo_url: '' }))} className="text-[11px] text-destructive font-semibold">Remove</button>
                  </div>
                )}
                <ImageUploadInput value="" onChange={url => setForm(p => ({ ...p, logo_url: url }))} label="Upload Logo" />
              </div>
            </div>
            <div><Label className="text-xs">Instructions</Label><Textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} className="mt-1 text-sm h-16 resize-none" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} /><Label className="text-xs">Active</Label></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={save} disabled={isSaving} className="flex-1 btn-gradient">{isSaving ? 'Saving...' : editProvider ? 'Update' : 'Add'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Provider?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProvider} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
