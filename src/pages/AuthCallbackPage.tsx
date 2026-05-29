import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { setAccessToken } from '@/lib/access-token';
import { useAuth } from '@/contexts/AuthContext';

type MobileAuthResponse = {
  access_token: string;
  customer: unknown;
  telegram_user: unknown;
};

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { customer } = useAuth();
  const [status, setStatus] = useState('Verifying Telegram session...');

  useEffect(() => {
    if (customer) {
      navigate('/', { replace: true });
    }
  }, [customer, navigate]);

  useEffect(() => {
    const nonce = params.get('nonce')?.trim();
    if (!nonce) {
      setStatus('Missing auth nonce.');
      return;
    }

    const run = async () => {
      setStatus('Linking Telegram to the app...');
      const { data, error } = await supabase.functions.invoke<MobileAuthResponse>('mobile-auth-exchange', {
        body: { nonce },
      });

      if (error || !data?.access_token) {
        setStatus('Authentication failed. Go back and try again.');
        return;
      }

      setAccessToken(data.access_token);
      localStorage.removeItem('pc_mobile_auth_nonce');
      setStatus('Authenticated. Opening the store...');
      navigate('/', { replace: true });
    };

    void run();
  }, [navigate, params]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-center">
      <div className="space-y-3 rounded-3xl border border-border bg-card px-6 py-8 shadow-lg">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
        <h1 className="text-lg font-black">Telegram Login</h1>
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
