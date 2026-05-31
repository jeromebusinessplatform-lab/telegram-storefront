import { createContext, useContext, useState } from 'react';

export type StoreStatus = 'open' | 'closed' | 'limited' | 'maintenance';

export interface StoreStatusConfig {
  status: StoreStatus;
  statusMessage: string;
}

interface StoreStatusContextType extends StoreStatusConfig {
  setStatus: (s: StoreStatus) => void;
  setStatusMessage: (m: string) => void;
}

const StoreStatusContext = createContext<StoreStatusContextType | null>(null);

export function StoreStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<StoreStatus>('open');
  const [statusMessage, setStatusMessage] = useState('Welcome to our store! Happy shopping.');

  return (
    <StoreStatusContext.Provider value={{ status, setStatus, statusMessage, setStatusMessage }}>
      {children}
    </StoreStatusContext.Provider>
  );
}

export function useStoreStatus() {
  const ctx = useContext(StoreStatusContext);
  if (!ctx) throw new Error('useStoreStatus must be used within StoreStatusProvider');
  return ctx;
}
