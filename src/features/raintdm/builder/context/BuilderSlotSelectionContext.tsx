import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BuilderSlotSelection } from "../hooks/useBuilderSlotSelection";

export interface BuilderSlotSelectionContextValue {
  selectedSlot: BuilderSlotSelection;
  selectSlot: (slot: BuilderSlotSelection) => void;
  clearSelection: () => void;
  setSelectedSlot: (slot: BuilderSlotSelection) => void;
}

const BuilderSlotSelectionContext =
  createContext<BuilderSlotSelectionContextValue | null>(null);

export function BuilderSlotSelectionProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [selectedSlot, setSelectedSlot] = useState<BuilderSlotSelection>(null);

  const selectSlot = useCallback((slot: BuilderSlotSelection) => {
    setSelectedSlot(slot);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  const value = useMemo(
    () => ({
      selectedSlot,
      selectSlot,
      clearSelection,
      setSelectedSlot,
    }),
    [selectedSlot, selectSlot, clearSelection],
  );

  return (
    <BuilderSlotSelectionContext.Provider value={value}>
      {children}
    </BuilderSlotSelectionContext.Provider>
  );
}

export function useBuilderSlotSelectionContext(): BuilderSlotSelectionContextValue {
  const ctx = useContext(BuilderSlotSelectionContext);
  if (!ctx) {
    throw new Error(
      "useBuilderSlotSelectionContext must be used inside BuilderSlotSelectionProvider",
    );
  }
  return ctx;
}
