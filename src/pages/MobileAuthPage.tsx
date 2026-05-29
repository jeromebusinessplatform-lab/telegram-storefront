import { useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function makeAuthNonce() {
  return crypto.randomUUID().replace(/-/g, '');
}

export default function MobileAuthPage() {
  const navigate = useNavigate();
  const { customer, isLoading } = useAuth();

  const nonce = useMemo(() => {
    const stored = localStorage.getItem('pc_mobile_auth_nonce');
    if (stored) return stored;
    const next = makeAuthNonce();
    localStorage.setItem('pc_mobile_auth_nonce', next);
    return next;
  }, []);

  const botUrl = `https://t.me/PrimeCoreStoreBot?start=apk_${nonce}`;
  const returnUrl = `primecore://auth/callback?nonce=${encodeURIComponent(nonce)}`;

  useEffect(() => {
    if (!isLoading && customer) {
      navigate('/', { replace: true });
    }
  }, [customer, isLoading, navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground">
            PC
          </div>
          <div>
            <h1 className="text-xl font-black">Connect Telegram</h1>
            <p className="text-sm text-muted-foreground">Use Telegram to verify your account, then return here.</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>1. Tap the button below to open the bot.</p>
          <p>2. Telegram captures your profile and sends you back to the app.</p>
          <p>3. Your customer profile stays linked across devices.</p>
        </div>

        <div className="mt-5 grid gap-2">
          <a
            href={botUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            Open Telegram Bot
          </a>
          <a
            href={returnUrl}
            className={`inline-flex items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-bold ${
              Capacitor.isNativePlatform() ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Return to App
          </a>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Auth nonce</p>
          <p className="break-all font-mono">{nonce}</p>
        </div>
      </div>
    </div>
  );
}
