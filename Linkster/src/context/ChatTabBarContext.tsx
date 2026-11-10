import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type ChatTabBarContextValue = {
  hideTabs: boolean;
  setHideTabs: (hide: boolean) => void;
};

const ChatTabBarContext = createContext<ChatTabBarContextValue | null>(null);

export function ChatTabBarProvider({ children }: { children: ReactNode }) {
  const [hideTabs, setHideTabs] = useState(false);
  const value = useMemo(() => ({ hideTabs, setHideTabs }), [hideTabs]);
  return <ChatTabBarContext.Provider value={value}>{children}</ChatTabBarContext.Provider>;
}

export function useChatTabBar(): ChatTabBarContextValue {
  const ctx = useContext(ChatTabBarContext);
  if (!ctx) {
    return { hideTabs: false, setHideTabs: () => {} };
  }
  return ctx;
}
