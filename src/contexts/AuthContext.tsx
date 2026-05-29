import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Customer, TelegramUser } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/access-token';

interface AuthContextValue {
  customer: Customer | null;
  telegramUser: TelegramUser | null;
  isLoading: boolean;
  isInTelegram: boolean;
  refetchCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  customer: null,
  telegramUser: null,
  isLoading: true,
  isInTelegram: false,
  refetchCustomer: async () => {},
});

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

type TelegramAuthResponse = {
  access_token: string;
  customer: Customer;
  telegram_user: TelegramUser;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const { tg, isInTelegram: isTelegramLaunch, user: launchUser, startParam, initData } = useTelegram();

  const init = useCallback(async () => {
    setIsLoading(true);
    try {
      if (tg) {
        tg.ready();
        tg.expand();
      }

      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') ?? startParam ?? undefined;

      if (isTelegramLaunch && launchUser && initData) {
        const { data, error } = await supabase.functions.invoke<TelegramAuthResponse>('telegram-auth', {
          body: {
            init_data: initData,
            ref_code: refCode,
          },
        });

        if (error || !data?.access_token || !data.customer) {
          return;
        }

        setAccessToken(data.access_token);

        setCustomer(data.customer);
        setTelegramUser(data.telegram_user);
        setIsInTelegram(true);
        return;
      }

      const existingToken = getAccessToken();
      if (!existingToken) {
        return;
      }

      const payload = decodeJwtPayload(existingToken);
      const customerId = payload?.customer_id;
      const telegramId = payload?.telegram_id;

      if (typeof customerId !== 'string') {
        return;
      }

      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();

      if (!data) {
        return;
      }

      setCustomer(data as Customer);
      setTelegramUser({
        id: Number(telegramId ?? data.telegram_id),
        first_name: data.telegram_first_name ?? 'User',
        last_name: data.telegram_last_name ?? undefined,
        username: data.telegram_username ?? undefined,
      });
    } finally {
      setIsLoading(false);
    }
  }, [initData, launchUser, startParam, tg, isTelegramLaunch]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const handleTokenChange = () => {
      void init();
    };

    window.addEventListener('pc:access-token-changed', handleTokenChange as EventListener);
    return () => window.removeEventListener('pc:access-token-changed', handleTokenChange as EventListener);
  }, [init]);

  const refetchCustomer = useCallback(async () => {
    if (!customer?.id) return;
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer.id)
      .maybeSingle();
    if (data) setCustomer(data as Customer);
  }, [customer?.id]);

  return (
    <AuthContext.Provider value={{ customer, telegramUser, isLoading, isInTelegram, refetchCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
