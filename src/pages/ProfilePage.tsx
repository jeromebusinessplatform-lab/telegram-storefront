import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, MapPin, Copy, Share2, Gift, Check } from 'lucide-react';

export default function ProfilePage() {
  const { customer, refetchCustomer } = useAuth();
  const { toast } = useToast();

  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/?ref=${customer?.customer_code ?? ''}`;

  const saveProfile = async () => {
    if (!customer) return;
    setIsSaving(true);
    await supabase.from('customers').update({ phone, email, address }).eq('id', customer.id);
    await refetchCustomer();
    toast({ description: 'Profile updated!' });
    setIsSaving(false);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ description: 'Referral link copied!' });
    });
  };

  if (!customer) {
    return (
      <AppLayout title="Profile">
        <div className="flex flex-col items-center justify-center h-full pb-8 text-center px-6">
          <User className="w-14 h-14 text-muted-foreground/40 mb-3" />
          <p className="font-bold text-foreground">Not logged in</p>
          <p className="text-sm text-muted-foreground mt-1">Please open this app via Telegram</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile">
      <div className="px-3 py-3 space-y-3">
        {/* Avatar Card */}
        <div className="bg-gradient-primary rounded-xl p-5 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-white" />
          </div>
          <p className="font-black text-lg text-white">
            {customer.telegram_first_name} {customer.telegram_last_name ?? ''}
          </p>
          {customer.telegram_username && (
            <p className="text-sm text-white/80">@{customer.telegram_username}</p>
          )}
          <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 mt-2">
            <span className="text-[11px] text-white font-mono font-bold">ID: {customer.customer_code}</span>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-primary" /> Contact Info
          </h3>
          <div className="space-y-2.5">
            <div>
              <Label className="text-[11px] flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="09XXXXXXXXX" className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[11px] flex items-center gap-1"><Mail className="w-3 h-3" /> Email Address</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[11px] flex items-center gap-1"><MapPin className="w-3 h-3" /> Default Address</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your full address" className="h-8 text-xs mt-0.5" />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={isSaving} className="w-full mt-3 h-9 btn-gradient text-xs font-bold">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Referral */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-brand-sm">
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <Gift className="w-3.5 h-3.5 text-primary" /> Referral Program
          </h3>
          <p className="text-[11px] text-muted-foreground mb-3">Share your link and earn rewards when friends place their first order!</p>
          <div className="bg-primary-light rounded-lg p-2.5 flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold text-primary flex-1 break-all">{referralLink}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyReferralLink} className="flex-1 h-8 text-xs gap-1.5 border-primary/30 text-primary">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button size="sm" onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Join PRIME CORE', url: referralLink });
              } else {
                copyReferralLink();
              }
            }} className="flex-1 h-8 text-xs gap-1.5 btn-gradient">
              <Share2 className="w-3 h-3" /> Share
            </Button>
          </div>
        </div>

        {customer.referred_by && (
          <div className="bg-green-50 rounded-xl p-3 border border-green-200">
            <p className="text-xs font-semibold text-green-700">Referred by customer: {customer.referred_by}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
