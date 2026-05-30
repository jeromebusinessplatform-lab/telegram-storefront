import { useState } from 'react';
import { MessageSquare, HelpCircle, Plus, X, Edit2, Check } from 'lucide-react';
import AdminSubHeader from '@/components/admin/AdminSubHeader';
import { useSupportConfig } from '@/context/SupportContext';

const TABS = ['Contact', 'FAQ', 'About'] as const;

const MOCK_TICKETS = [
  { id: 'T-001', name: 'Maria S.', issue: 'Order not received', status: 'open',   time: '2h ago' },
  { id: 'T-002', name: 'James L.', issue: 'Wrong item shipped', status: 'open',   time: '5h ago' },
  { id: 'T-003', name: 'Sofia C.', issue: 'Refund request',     status: 'closed', time: '1d ago' },
  { id: 'T-004', name: 'David R.', issue: 'Payment failed',     status: 'open',   time: '3h ago' },
];

export default function AdminSupportCenterPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Contact');
  const { config, updateConfig, addFaq, updateFaq, removeFaq } = useSupportConfig();
  const [editingFaq, setEditingFaq] = useState<string | null>(null);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [tmpFaq, setTmpFaq] = useState<{ q: string; a: string }>({ q: '', a: '' });

  const openTickets = MOCK_TICKETS.filter(t => t.status === 'open').length;

  return (
    <div className="flex flex-col min-h-full">
      <AdminSubHeader title="Support Center" subtitle={`${openTickets} open tickets`} />

      {/* Tickets strip */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Support Tickets</p>
        <div className="flex flex-col gap-1.5">
          {MOCK_TICKETS.map(t => (
            <div key={t.id} className="bg-card border border-border/40 rounded-xl px-3 py-2.5 flex items-center gap-2.5 shadow-card">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'open' ? 'bg-amber-400' : 'bg-muted-foreground/30'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate">{t.issue}</p>
                <p className="text-[10px] text-muted-foreground">{t.name} · {t.time}</p>
              </div>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${t.status === 'open' ? 'text-amber-600 bg-amber-50' : 'text-muted-foreground bg-muted'}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Config tabs */}
      <div className="px-5 pt-3 pb-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Content Configuration</p>
        <div className="flex gap-1.5 bg-muted rounded-xl p-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6">
        {tab === 'Contact' && (
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {[
              { label: 'Email',         field: 'email' as const,         icon: MessageSquare },
              { label: 'Phone',         field: 'phone' as const,         icon: MessageSquare },
              { label: 'Telegram',      field: 'telegram' as const,      icon: MessageSquare },
              { label: 'WhatsApp',      field: 'whatsapp' as const,      icon: MessageSquare },
              { label: 'Support Hours', field: 'supportHours' as const,  icon: MessageSquare },
            ].map((item, i) => (
              <div key={item.field} className={`px-4 py-3 ${i < 4 ? 'border-b border-border/40' : ''}`}>
                <p className="text-[9px] text-muted-foreground mb-1">{item.label}</p>
                <input value={config[item.field] || ''} onChange={e => updateConfig({ [item.field]: e.target.value })}
                  className="w-full text-[11px] font-medium text-foreground bg-transparent outline-none" />
              </div>
            ))}
          </div>
        )}

        {tab === 'FAQ' && (
          <div className="flex flex-col gap-3">
            <div className="bg-card border border-border/40 rounded-2xl p-3.5 flex flex-col gap-2 shadow-card">
              <input placeholder="Question" value={newQ} onChange={e => setNewQ(e.target.value)}
                className="w-full bg-muted rounded-xl px-3 py-2 text-[11px] font-semibold text-foreground outline-none" />
              <textarea placeholder="Answer" value={newA} onChange={e => setNewA(e.target.value)} rows={2}
                className="w-full bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none resize-none" />
              <button onClick={() => { if (newQ && newA) { addFaq({ q: newQ, a: newA }); setNewQ(''); setNewA(''); } }}
                className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5">
                <Plus size={12} /> Add FAQ
              </button>
            </div>

            {config.faqItems.map((faq) => (
              <div key={faq.id} className="bg-card border border-border/40 rounded-2xl p-3.5 shadow-card">
                {editingFaq === faq.id ? (
                  <div className="flex flex-col gap-2">
                    <input value={tmpFaq.q} onChange={e => setTmpFaq(f => ({ ...f, q: e.target.value }))}
                      className="w-full bg-muted rounded-xl px-3 py-2 text-[11px] font-semibold text-foreground outline-none" />
                    <textarea value={tmpFaq.a} onChange={e => setTmpFaq(f => ({ ...f, a: e.target.value }))} rows={2}
                      className="w-full bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground outline-none resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => { updateFaq(faq.id, { q: tmpFaq.q, a: tmpFaq.a }); setEditingFaq(null); }}
                        className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1"><Check size={11} /> Save</button>
                      <button onClick={() => setEditingFaq(null)} className="py-1.5 px-3 bg-muted text-muted-foreground rounded-xl text-[10px] font-semibold">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <HelpCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-foreground mb-0.5">{faq.q}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{faq.a}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingFaq(faq.id); setTmpFaq({ q: faq.q, a: faq.a }); }}
                        className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Edit2 size={11} /></button>
                      <button onClick={() => removeFaq(faq.id)} className="w-6 h-6 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center"><X size={11} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'About' && (
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            {[
              { label: 'Store Name', field: 'storeName' as const },
              { label: 'Tagline',    field: 'tagline' as const },
            ].map((item, i) => (
              <div key={item.field} className={`px-4 py-3 border-b border-border/40`}>
                <p className="text-[9px] text-muted-foreground mb-1">{item.label}</p>
                <input value={config[item.field] || ''} onChange={e => updateConfig({ [item.field]: e.target.value })}
                  className="w-full text-[11px] font-semibold text-foreground bg-transparent outline-none" />
              </div>
            ))}
            <div className="px-4 py-3">
              <p className="text-[9px] text-muted-foreground mb-1">About</p>
              <textarea value={config.aboutText} onChange={e => updateConfig({ aboutText: e.target.value })} rows={4}
                className="w-full text-[11px] text-foreground bg-transparent outline-none resize-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
