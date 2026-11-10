import React, { createContext, useContext, useMemo } from 'react';

/** Оболочка мессенджера Linkster Orbit — точка расширения для session/API слоёв */
type MessengerShellContextValue = {
  productName: 'Linkster Orbit';
  architecture: 'hub-thread-links-deck';
};

const MessengerShellContext = createContext<MessengerShellContextValue | null>(null);

export function MessengerShellProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    (): MessengerShellContextValue => ({
      productName: 'Linkster Orbit',
      architecture: 'hub-thread-links-deck',
    }),
    []
  );
  return (
    <MessengerShellContext.Provider value={value}>{children}</MessengerShellContext.Provider>
  );
}

export function useMessengerShell() {
  const ctx = useContext(MessengerShellContext);
  if (!ctx) throw new Error('useMessengerShell requires MessengerShellProvider');
  return ctx;
}
