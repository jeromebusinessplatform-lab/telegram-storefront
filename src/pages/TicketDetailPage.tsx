import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket, SupportMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-gray-100 text-gray-700',
  closed: 'bg-red-100 text-red-700',
};

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { customer } = useAuth();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [newAttachmentPreviews, setNewAttachmentPreviews] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const uploadAttachments = async (ticketId: string, files: File[]) => {
    if (files.length === 0) return [];
    const uploads = await Promise.all(
      files.map(async (file) => {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const filePath = `support-attachments/${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error } = await supabase.storage.from('support-attachments').upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type || 'image/jpeg',
          upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from('support-attachments').getPublicUrl(filePath);
        return data.publicUrl;
      })
    );
    return uploads;
  };

  useEffect(() => {
    if (!ticketId) return;
    const fetchData = async () => {
      const [{ data: t }, { data: msgs }] = await Promise.all([
        supabase.from('support_tickets').select('*').eq('id', ticketId).maybeSingle(),
        supabase.from('support_messages').select('*').eq('ticket_id', ticketId).order('created_at'),
      ]);
      setTicket(t as unknown as SupportTicket);
      setMessages((msgs as unknown as SupportMessage[]) ?? []);
    };
    fetchData();

    const channel = supabase.channel('support-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${ticketId}` }, async () => {
        const { data } = await supabase.from('support_messages').select('*').eq('ticket_id', ticketId).order('created_at');
        setMessages((data as unknown as SupportMessage[]) ?? []);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticket || ticket.status === 'closed') return;
    setIsSending(true);
    try {
      const attachments = await uploadAttachments(ticket.id, newAttachments);
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_type: 'customer',
        message: newMessage.trim(),
        attachments,
      });
      if (error) throw error;
      await supabase.from('support_tickets').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', ticket.id);
      setNewMessage('');
      setNewAttachments([]);
      setNewAttachmentPreviews([]);
    } catch {
      toast({ description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  if (!ticket) return (
    <AppLayout showBack title="Support Ticket">
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout showBack title={ticket.ticket_number} hideNav>
      <div className="flex flex-col h-full">
        {/* Ticket info */}
        <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground flex-1 line-clamp-1">{ticket.subject}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${STATUS_COLORS[ticket.status] ?? ''}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 scroll-content p-3 space-y-2">
          {messages.map(msg => {
            const isCustomer = msg.sender_type === 'customer';
            return (
              <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  isCustomer
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm'
                }`}>
                  {!isCustomer && (
                    <p className="text-[10px] font-bold text-primary mb-0.5">Support Team</p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  {msg.attachments?.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {msg.attachments.map((attachment, index) => (
                        <a key={attachment + index} href={attachment} target="_blank" rel="noreferrer">
                          <img src={attachment} alt={`attachment ${index + 1}`} className="h-24 w-full rounded-lg object-cover border border-border/50" />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className={`text-[10px] mt-0.5 ${isCustomer ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {ticket.status !== 'closed' ? (
          <div className="p-2 border-t border-border bg-background flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 text-sm resize-none h-10 min-h-10 max-h-24"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Add image attachments</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files ?? []);
                    setNewAttachments(files);
                    setNewAttachmentPreviews(files.map(file => URL.createObjectURL(file)));
                  }}
                />
              </label>
              {newAttachmentPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {newAttachmentPreviews.map((src, index) => (
                    <img key={src + index} src={src} alt={`attachment preview ${index + 1}`} className="h-20 w-full rounded-lg object-cover border border-border" />
                  ))}
                </div>
              )}
            </div>
            <Button onClick={sendMessage} disabled={isSending || (!newMessage.trim() && newAttachments.length === 0)} className="w-9 h-9 p-0 btn-gradient flex-shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="p-3 border-t border-border bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">This ticket is closed</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
