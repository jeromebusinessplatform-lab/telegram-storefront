import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Bell, Send, Users } from 'lucide-react';

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [type, setType] = useState('info');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState<{ title: string; message: string; recipients: string; sent_at: string }[]>([]);

  useEffect(() => {
    supabase.from('customers').select('*').eq('is_banned', false).order('telegram_first_name').then(({ data }) => {
      setCustomers((data as Customer[]) ?? []);
    });
  }, []);

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ description: 'Title and message required', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    try {
      const targetCustomers = recipientType === 'all' ? customers : customers.filter(c => c.id === selectedCustomerId);

      await Promise.all(
        targetCustomers.map(async (c) => {
          await supabase.from('notifications').insert({
            customer_id: c.id, title: title.trim(), message: message.trim(), type,
          });
          try {
            await supabase.functions.invoke('send-telegram-notification', {
              body: { telegram_id: c.telegram_id, message: `${title.trim()}\n\n${message.trim()}`, notification_data: { type } },
            });
          } catch (e) {
            console.warn("Telegram notify failed", e);
          }
        })
      );

      setSent(p => [{ title, message, recipients: recipientType === 'all' ? `All (${targetCustomers.length})` : targetCustomers[0]?.telegram_first_name ?? 'Unknown', sent_at: new Date().toISOString() }, ...p]);
      setTitle('');
      setMessage('');
      toast({ description: `Notification sent to ${targetCustomers.length} customer${targetCustomers.length !== 1 ? 's' : ''}!` });
    } catch {
      toast({ description: 'Failed to send notification', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminLayout title="Send Notifications">
      <div className="max-w-xl space-y-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Compose Notification
          </h3>

          <div>
            <Label className="text-xs">Recipients</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers ({customers.length})</SelectItem>
                <SelectItem value="single">Specific Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType === 'single' && (
            <div>
              <Label className="text-xs">Select Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Choose customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.telegram_first_name} (@{c.telegram_username ?? c.customer_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs">Notification Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="order">Order Update</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" className="mt-1 h-8 text-sm" />
          </div>

          <div>
            <Label className="text-xs">Message *</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Notification message..." className="mt-1 text-sm h-20 resize-none" />
          </div>

          <Button onClick={sendNotification} disabled={isSending || (recipientType === 'single' && !selectedCustomerId)} className="w-full btn-gradient font-bold gap-2">
            <Send className="w-4 h-4" />
            {isSending ? 'Sending...' : `Send to ${recipientType === 'all' ? `All (${customers.length})` : 'Customer'}`}
          </Button>
        </div>

        {sent.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 shadow-brand-sm">
            <h3 className="text-sm font-bold mb-3">Recent Sends</h3>
            <div className="space-y-2">
              {sent.map((s, i) => (
                <div key={i} className="p-2 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-bold text-green-700">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">Sent to: {s.recipients} · {new Date(s.sent_at).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
