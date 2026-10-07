/**
 * Builder page layout mode: desktop columns (lg+) vs mobile tabs + bottom sheet.
 * Owns the active mobile tab so deep-links (progress checklist, banners) can
 * reveal a section before scrolling to it.
 */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import type { BuildCompletenessSection } from "../utils/build-completeness.types";

export const BUILDER_DESKTOP_QUERY = "(min-width: 1024px)";

export type BuilderMobileTab = "build" | "character" | "proficiencies" | "gear";

export const SECTION_TO_MOBILE_TAB: Record<
  BuildCompletenessSection,
  BuilderMobileTab
> = {
  identity: "build",
  feats: "build",
  "optional-features": "build",
  spells: "build",
  "ability-scores": "character",
  skills: "proficiencies",
  tools: "proficiencies",
  languages: "proficiencies",
  defenses: "proficiencies",
  "starting-equipment": "gear",
};

interface BuilderLayoutContextValue {
  isMobileLayout: boolean;
  activeTab: BuilderMobileTab;
  setActiveTab: (tab: BuilderMobileTab) => void;
}

const BuilderLayoutContext = createContext<BuilderLayoutContextValue | null>(
  null,
);

export function BuilderLayoutProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const isDesktop = useMediaQuery(BUILDER_DESKTOP_QUERY);
  const [activeTab, setActiveTab] = useState<BuilderMobileTab>("build");

  const value = useMemo(
    () => ({ isMobileLayout: !isDesktop, activeTab, setActiveTab }),
    [isDesktop, activeTab],
  );

  return (
    <BuilderLayoutContext.Provider value={value}>
      {children}
    </BuilderLayoutContext.Provider>
  );
}

/** Null outside the Builder page (layout-agnostic consumers). */
export function useBuilderLayoutOptional(): BuilderLayoutContextValue | null {
  return useContext(BuilderLayoutContext);
}

export function useBuilderLayout(): BuilderLayoutContextValue {
  const ctx = useContext(BuilderLayoutContext);
  if (!ctx) {
    throw new Error("useBuilderLayout must be used inside BuilderLayoutProvider");
  }
  return ctx;
}
