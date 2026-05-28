import { TelegramUser } from '@/types';

export function useTelegram() {
  const tg = window.Telegram?.WebApp;

  const isInTelegram = !!tg && !!tg.initDataUnsafe?.user;
  const user: TelegramUser | null = tg?.initDataUnsafe?.user ?? null;
  const startParam = tg?.initDataUnsafe?.start_param ?? null;
  const initData = tg?.initData ?? null;
  const authDate = tg?.initDataUnsafe?.auth_date ?? null;
  const hash = tg?.initDataUnsafe?.hash ?? null;
  const queryId = tg?.initDataUnsafe?.query_id ?? null;

  const ready = () => tg?.ready();
  const expand = () => tg?.expand();

  return { tg, isInTelegram, user, startParam, initData, authDate, hash, queryId, ready, expand };
}
