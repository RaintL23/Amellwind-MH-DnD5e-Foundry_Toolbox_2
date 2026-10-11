import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadBuilderUiMode,
  persistBuilderUiMode,
  type BuilderUiMode,
} from "../storage/builder.storage";

/**
 * Simple mode hides advanced controls (multiclass, manual/dice scores, book
 * source filters, homebrew toggle, RPGBOT letter grades) for new players.
 * Components must still show a control whenever its feature is in use, so a
 * build made in Advanced mode never hides its own state.
 */
interface BuilderUiModeContextValue {
  mode: BuilderUiMode;
  isSimple: boolean;
  setMode: (mode: BuilderUiMode) => void;
}

const BuilderUiModeContext = createContext<BuilderUiModeContextValue | null>(
  null,
);

export function BuilderUiModeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [mode, setModeState] = useState<BuilderUiMode>(loadBuilderUiMode);

  const setMode = useCallback((next: BuilderUiMode) => {
    setModeState(next);
    persistBuilderUiMode(next);
  }, []);

  const value = useMemo(
    () => ({ mode, isSimple: mode === "simple", setMode }),
    [mode, setMode],
  );

  return (
    <BuilderUiModeContext.Provider value={value}>
      {children}
    </BuilderUiModeContext.Provider>
  );
}

/** Falls back to Advanced (show everything) outside the Builder page. */
export function useBuilderUiMode(): BuilderUiModeContextValue {
  return (
    useContext(BuilderUiModeContext) ?? {
      mode: "advanced",
      isSimple: false,
      setMode: () => {},
    }
  );
}
