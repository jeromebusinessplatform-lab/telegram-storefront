import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket, SupportMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, ChevronRight, ArrowLeft } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-gray-100 text-gray-700',
  closed: 'bg-red-100 text-red-700',
};

export default function AdminSupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      let q = supabase.from('support_tickets').select('*, customers(telegram_first_name, telegram_username, customer_code)').order('updated_at', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data } = await q;
      setTickets((data as unknown as SupportTicket[]) ?? []);
    };
    fetchTickets();
  }, [statusFilter]);

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    const { data } = await supabase.from('support_messages').select('*').eq('ticket_id', ticket.id).order('created_at');
    setMessages((data as unknown as SupportMessage[]) ?? []);

    const channel = supabase.channel(`admin-ticket-${ticket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${ticket.id}` }, async () => {
        const { data: msgs } = await supabase.from('support_messages').select('*').eq('ticket_id', ticket.id).order('created_at');
        setMessages((msgs as unknown as SupportMessage[]) ?? []);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    setIsSending(true);
    await supabase.from('support_messages').insert({
      ticket_id: selectedTicket.id, sender_type: 'admin', message: reply.trim(),
    });
    await supabase.from('support_tickets').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);

    // Send notification to customer
    const cust = selectedTicket.customers as {id: string; telegram_id: string} | null;
    if (cust) {
      await supabase.from('notifications').insert({
        customer_id: cust.id,
        title: `Support Reply - ${selectedTicket.ticket_number}`,
        message: reply.trim().slice(0, 100),
        type: 'support',
      });
      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: { telegram_id: cust.telegram_id, message: `Support reply for ${selectedTicket.ticket_number}: ${reply.trim().slice(0, 100)}`, notification_data: { type: 'support', ticket_id: selectedTicket.id } },
        });
      } catch (e) {
        console.warn("Telegram notify failed", e);
      }
    }

    setReply('');
    setIsSending(false);
  };

  const updateTicketStatus = async (status: string) => {
    if (!selectedTicket) return;
    await supabase.from('support_tickets').update({ status }).eq('id', selectedTicket.id);
    setSelectedTicket(p => p ? { ...p, status: status as SupportTicket['status'] } : p);
    setTickets(p => p.map(t => t.id === selectedTicket.id ? { ...t, status: status as SupportTicket['status'] } : t));
    toast({ description: 'Ticket status updated' });
  };

  if (selectedTicket) {
    const customer = selectedTicket.customers as {telegram_first_name?: string; telegram_username?: string; customer_code?: string} | null;
    return (
      <AdminLayout title="Support Ticket">
        <div className="max-w-2xl flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setSelectedTicket(null)} className="p-1 hover:bg-muted rounded"><ArrowLeft className="w-4 h-4" /></button>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{selectedTicket.ticket_number} · {selectedTicket.subject}</p>
              <p className="text-xs text-muted-foreground">{customer?.telegram_first_name} (@{customer?.telegram_username})</p>
            </div>
            <Select value={selectedTicket.status} onValueChange={updateTicketStatus}>
              <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto bg-muted/20 rounded-xl p-3 space-y-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${msg.sender_type === 'admin' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'}`}>
                  {msg.sender_type === 'customer' && <p className="text-[10px] font-bold text-primary mb-0.5">{customer?.telegram_first_name}</p>}
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-[10px] mt-0.5 ${msg.sender_type === 'admin' ? 'text-white/60' : 'text-muted-foreground'}`}>{new Date(msg.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {selectedTicket.status !== 'closed' && (
            <div className="mt-2 flex gap-2 items-end">
              <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type admin reply..." className="flex-1 text-sm resize-none h-10 min-h-10" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }} />
              <Button onClick={sendReply} disabled={isSending || !reply.trim()} className="w-9 h-9 p-0 btn-gradient"><Send className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Support Tickets">
      <div className="flex gap-2 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-sm w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-2">
        {tickets.map(t => {
          const c = t.customers as {telegram_first_name?: string; telegram_username?: string} | null;
          return (
            <div key={t.id} onClick={() => openTicket(t)} className="bg-card rounded-xl border border-border p-3 shadow-brand-sm cursor-pointer hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-primary">{t.ticket_number}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[t.status] ?? ''}`}>{t.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{t.subject}</p>
                  <p className="text-[11px] text-muted-foreground">{c?.telegram_first_name} · {new Date(t.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
        {tickets.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No tickets found</div>}
      </div>
    </AdminLayout>
  );
}
