import type { ReactElement } from "react";
import { HintTooltip } from "@/shared/components/HintTooltip";

/**
 * Explains why a picker pill is blocked (e.g. "already granted by your
 * species"). Blocked pills stay focusable/tappable (aria-disabled, not
 * disabled) so the hint also opens on touch, where `title` never shows.
 */
export function PickerPillHint({
  reason,
  children,
}: Readonly<{ reason: string | undefined; children: ReactElement }>) {
  if (!reason) return children;
  return (
    <HintTooltip content={reason} className="max-w-[16rem] text-left">
      {children}
    </HintTooltip>
  );
}
