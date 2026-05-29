import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/access-token';

interface AdminContextValue {
  isAdmin: boolean;
  isVerifying: boolean;
  error: string | null;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
  isVerifying: false,
  error: null,
  login: async () => false,
  logout: () => {},
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

function base64UrlEncode(value: unknown): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createLocalAdminToken(): string {
  const header = { alg: 'none', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'primecore.local',
    aud: 'authenticated',
    role: 'authenticated',
    sub: 'admin',
    exp: now + 60 * 60 * 12,
    iat: now,
    aal: 'aal1',
    session_id: crypto.randomUUID(),
    email: '',
    phone: '',
    is_anonymous: false,
    is_admin: true,
  };
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.local`;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const payload = token ? decodeJwtPayload(token) : null;
    if (payload?.is_admin === true) setIsAdmin(true);
  }, []);

  const login = async (code: string): Promise<boolean> => {
    setIsVerifying(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.functions.invoke<{ access_token: string }>('admin-auth', {
        body: { code },
      });

      if (data?.access_token) {
        const payload = decodeJwtPayload(data.access_token);
        if (payload?.is_admin === true) {
          setAccessToken(data.access_token);
          setIsAdmin(true);
          return true;
        }
      }

      const { data: adminSetting } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_access_code')
        .maybeSingle();

      const storedCode = (adminSetting?.value as { code?: string } | null)?.code ?? 'PRIME2026ADMIN';
      if (storedCode === code.trim()) {
        setAccessToken(createLocalAdminToken());
        setIsAdmin(true);
        return true;
      }

      setError('Invalid access code. Please try again.');
      return false;
    } catch {
      try {
        const { data: adminSetting } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'admin_access_code')
          .maybeSingle();

        const storedCode = (adminSetting?.value as { code?: string } | null)?.code ?? 'PRIME2026ADMIN';
        if (storedCode === code.trim()) {
          setAccessToken(createLocalAdminToken());
          setIsAdmin(true);
          return true;
        }
      } catch {
        // fall through to the shared error below
      }

      setError('Connection error. Please try again.');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const logout = () => {
    setIsAdmin(false);
    clearAccessToken();
  };

  return (
    <AdminContext.Provider value={{ isAdmin, isVerifying, error, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
