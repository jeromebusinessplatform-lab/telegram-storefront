import { createContext, useContext, useEffect, useState } from 'react';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

export interface AuthState {
  user: TelegramUser | null;
  customerId: string | null;
  isLoaded: boolean;
}

const TelegramAuthContext = createContext<AuthState>({
  user: null,
  customerId: null,
  isLoaded: false,
});

/** Deterministic 8-char alphanumeric customer ID from a Telegram user ID.
 *  Same Telegram ID → same customer ID on ANY device, forever, with no backend.
 */
function makeCID(telegramId: number): string {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let h = (telegramId ^ 0xdeadbeef) >>> 0;
  let out = '';
  for (let i = 0; i < 8; i++) {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    out += CHARS[h % CHARS.length];
  }
  return out;
}

const LS_KEY = 'tg_auth_user';

export function TelegramAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, customerId: null, isLoaded: false });

  useEffect(() => {
    // 1. Try Telegram WebApp SDK (real Telegram Mini App context)
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (tgUser) {
      window.Telegram!.WebApp.ready();
      window.Telegram!.WebApp.expand();

      const user: TelegramUser = {
        id: tgUser.id,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        photoUrl: tgUser.photo_url,
      };
      const customerId = makeCID(user.id);

      // Persist locally (speed up future loads on same device)
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ user, customerId }));
      } catch (_) { /* ignore */ }

      setState({ user, customerId, isLoaded: true });
      return;
    }

    // 2. Fallback: previously cached session on same device
    try {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { user: TelegramUser; customerId: string };
        setState({ ...parsed, isLoaded: true });
        return;
      }
    } catch (_) { /* ignore */ }

    // 3. Development / browser fallback — generate a stable guest session
    const devUser: TelegramUser = { id: 0, firstName: 'Guest', username: 'guest_user' };
    const devCID = 'GUEST000';
    setState({ user: devUser, customerId: devCID, isLoaded: true });
  }, []);

  return (
    <TelegramAuthContext.Provider value={state}>
      {children}
    </TelegramAuthContext.Provider>
  );
}

export function useTelegramAuth() {
  return useContext(TelegramAuthContext);
}
