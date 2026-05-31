import React, { createContext, useContext, useState } from 'react';

interface AdminContextType {
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  return (
    <AdminContext.Provider value={{ isUnlocked, unlock: () => setIsUnlocked(true), lock: () => setIsUnlocked(false) }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) return { isUnlocked: false, unlock: () => {}, lock: () => {} };
  return ctx;
}
