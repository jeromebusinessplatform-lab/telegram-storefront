import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, ChevronRight, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-gray-100 text-gray-700',
  closed: 'bg-red-100 text-red-700',
};

function generateTicketNumber(): string {
  return `TKT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export default function SupportPage() {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [firstAttachments, setFirstAttachments] = useState<File[]>([]);
  const [firstAttachmentPreviews, setFirstAttachmentPreviews] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

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
    if (!customer?.id) { setIsLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase.from('support_tickets').select('*').eq('customer_id', customer.id).order('updated_at', { ascending: false });
      setTickets((data as unknown as SupportTicket[]) ?? []);
      setIsLoading(false);
    };
    fetch();
  }, [customer?.id]);

  const createTicket = async () => {
    if (!subject.trim() || !firstMessage.trim()) {
      toast({ description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (!customer) return;
    setIsCreating(true);
    try {
      const { data: ticket } = await supabase.from('support_tickets').insert({
        ticket_number: generateTicketNumber(),
        customer_id: customer.id,
        subject: subject.trim(),
        status: 'open',
      }).select().maybeSingle();

      if (ticket) {
        const attachments = await uploadAttachments(ticket.id, firstAttachments);
        await supabase.from('support_messages').insert({
          ticket_id: ticket.id,
          sender_type: 'customer',
          message: firstMessage.trim(),
          attachments,
        });
        setTickets(p => [ticket as unknown as SupportTicket, ...p]);
        setShowNew(false);
        setSubject('');
        setFirstMessage('');
        setFirstAttachments([]);
        setFirstAttachmentPreviews([]);
        navigate(`/support/${ticket.id}`);
      }
    } catch {
      toast({ description: 'Failed to create ticket', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AppLayout title="Support">
      <div>
        <div className="px-3 pt-3 pb-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
          <Button size="sm" onClick={() => setShowNew(true)} className="h-8 text-xs btn-gradient gap-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> New Ticket
          </Button>
        </div>

        <div className="px-3 py-2 space-y-2">
          {isLoading ? (
            Array.from({length: 3}).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="font-bold text-foreground">No support tickets</p>
              <p className="text-xs text-muted-foreground mt-1">Create a ticket if you need help</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/support/${ticket.id}`)}
                className="bg-card rounded-xl p-3 border border-border shadow-brand-sm cursor-pointer active:scale-99"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary">{ticket.ticket_number}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5 line-clamp-1">{ticket.subject}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(ticket.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] ?? ''}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">New Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What do you need help with?" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Message</label>
                <Textarea value={firstMessage} onChange={e => setFirstMessage(e.target.value)} placeholder="Describe your issue in detail..." className="mt-1 text-sm resize-none h-24" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Attachments</label>
                <label className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-center hover:border-primary/50">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Add up to a few images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files ?? []);
                      setFirstAttachments(files);
                      setFirstAttachmentPreviews(files.map(file => URL.createObjectURL(file)));
                    }}
                  />
                </label>
                {firstAttachmentPreviews.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {firstAttachmentPreviews.map((src, index) => (
                      <img key={src + index} src={src} alt={`attachment ${index + 1}`} className="h-20 w-full rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={createTicket} disabled={isCreating} className="w-full btn-gradient font-bold">
                {isCreating ? 'Creating...' : 'Submit Ticket'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
