import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const payload = data.session?.access_token ? decodeJwtPayload(data.session.access_token) : null;
      if (payload?.is_admin === true) {
        setIsAdmin(true);
      }
    });
  }, []);

  const login = async (code: string): Promise<boolean> => {
    setIsVerifying(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.functions.invoke<{ access_token: string }>('admin-auth', {
        body: { code },
      });

      if (authError || !data?.access_token) {
        setError('Invalid access code. Please try again.');
        return false;
      }

      const payload = decodeJwtPayload(data.access_token);
      if (payload?.is_admin !== true) {
        setError('Invalid access code. Please try again.');
        return false;
      }

      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.access_token,
      });

      if (payload?.is_admin) {
        setIsAdmin(true);
        return true;
      }
    } catch {
      setError('Connection error. Please try again.');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const logout = () => {
    setIsAdmin(false);
    void supabase.auth.signOut({ scope: 'local' });
  };

  return (
    <AdminContext.Provider value={{ isAdmin, isVerifying, error, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
