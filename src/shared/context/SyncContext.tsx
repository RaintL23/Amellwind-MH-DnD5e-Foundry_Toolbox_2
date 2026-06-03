import { createContext, useContext } from "react";

interface SyncContextValue {
  syncing: boolean;
}

const SyncContext = createContext<SyncContextValue>({ syncing: false });

export function SyncProvider({
  syncing,
  children,
}: {
  syncing: boolean;
  children: React.ReactNode;
}) {
  return (
    <SyncContext.Provider value={{ syncing }}>{children}</SyncContext.Provider>
  );
}

export function useSyncStatus(): SyncContextValue {
  return useContext(SyncContext);
}
