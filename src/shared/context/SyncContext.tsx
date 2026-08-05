import { createContext, useContext, useMemo } from "react";

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
  const value = useMemo(() => ({ syncing }), [syncing]);

  return (
    <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
  );
}

export function useSyncStatus(): SyncContextValue {
  return useContext(SyncContext);
}
