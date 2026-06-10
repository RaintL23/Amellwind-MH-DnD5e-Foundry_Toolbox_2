import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Gem, ChevronLeft, Info } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { Rune } from "@/shared/types";
import {
  type RuneCompatibilityContext,
  getRuneIneligibilityReason,
  getTagIneligibilityReasons,
  getRuneEffectTags,
} from "@/features/runes/utils/rune-compatibility.utils";
import { formatTag, tagVariant } from "@/features/runes/utils/rune-tag.utils";
import { DndRichText } from "@/shared/components/DndRichText";

interface RunePickerPanelProps {
  /** Runes available for selection. In "build" mode these are the build runes; in "catalog" all runes. */
  runes: Rune[];
  mode: "build" | "catalog";
  slotLabel: string;
  slotKind: "weapon" | "armor" | "trinket";
  /** If true, show weapon effects; otherwise armor effects. */
  isWeapon: boolean;
  compatibilityCtx: RuneCompatibilityContext;
  onSelect: (rune: Rune) => void;
  onCancel: () => void;
}

const TAG_VARIANT_CLASSES: Record<string, string> = {
  blue: "bg-sky-950/60 text-sky-300 border-sky-800/50 hover:bg-sky-900/70",
  orange:
    "bg-orange-950/60 text-orange-300 border-orange-800/50 hover:bg-orange-900/70",
  green:
    "bg-emerald-950/60 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/70",
  red: "bg-red-950/60 text-red-300 border-red-800/50 hover:bg-red-900/70",
};

const TAG_VARIANT_DISABLED: Record<string, string> = {
  blue: "bg-sky-950/20 text-sky-600 border-sky-900/30",
  orange: "bg-orange-950/20 text-orange-600 border-orange-900/30",
  green: "bg-emerald-950/20 text-emerald-600 border-emerald-900/30",
  red: "bg-red-950/20 text-red-600 border-red-900/30",
};

export function RunePickerPanel({
  runes,
  mode,
  slotLabel,
  slotKind,
  isWeapon,
  compatibilityCtx,
  onSelect,
  onCancel,
}: RunePickerPanelProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const rune of runes) {
      for (const tag of getRuneEffectTags(rune, slotKind)) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [runes, slotKind]);

  const tagFilteredRunes = useMemo(() => {
    if (!selectedTag) return [];
    return runes.filter((r) =>
      getRuneEffectTags(r, slotKind).includes(selectedTag),
    );
  }, [runes, selectedTag, slotKind]);

  return (
    <div className="border-t border-border pt-2 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        {selectedTag && mode === "catalog" ? (
          <button
            onClick={() => setSelectedTag(null)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" />
            Change tag
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">{slotLabel}</span>
        )}
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      {/* Catalog disclaimer */}
      {mode === "catalog" && (
        <div className="flex items-start gap-2 rounded-md bg-blue-950/30 border border-blue-800/40 px-2.5 py-2">
          <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-300/90 leading-relaxed">
            Showing all available runes. For a curated list matched to your
            build, add runes in the{" "}
            <Link to="/runes" className="underline hover:text-blue-200">
              Runes page
            </Link>{" "}
            Build Planner.
          </p>
        </div>
      )}

      {/* Build mode: flat list */}
      {mode === "build" && (
        <RuneList
          runes={runes}
          isWeapon={isWeapon}
          compatibilityCtx={compatibilityCtx}
          onSelect={onSelect}
        />
      )}

      {/* Catalog mode: tag grid → rune list */}
      {mode === "catalog" && !selectedTag && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">
            Select a tag to browse runes:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {uniqueTags.map((tag) => {
              const variant = tagVariant(tag);
              const ineligibilityReason = getTagIneligibilityReasons(tag, runes, compatibilityCtx);
              const disabled = ineligibilityReason !== null;
              return (
                <button
                  key={tag}
                  disabled={disabled}
                  onClick={() => setSelectedTag(tag)}
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                    disabled
                      ? cn(
                          "cursor-not-allowed opacity-50",
                          TAG_VARIANT_DISABLED[variant],
                        )
                      : TAG_VARIANT_CLASSES[variant],
                  )}
                  title={ineligibilityReason ?? undefined}
                >
                  {formatTag(tag)}
                </button>
              );
            })}
            {uniqueTags.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">
                No tags available for this slot.
              </p>
            )}
          </div>
        </div>
      )}

      {mode === "catalog" && selectedTag && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] text-muted-foreground">Tag:</span>
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
                TAG_VARIANT_CLASSES[tagVariant(selectedTag)],
              )}
            >
              {formatTag(selectedTag)}
            </span>
          </div>
          <RuneList
            runes={tagFilteredRunes}
            isWeapon={isWeapon}
            compatibilityCtx={compatibilityCtx}
            onSelect={onSelect}
          />
        </div>
      )}
    </div>
  );
}

// ─── Internal list component ──────────────────────────────────────────────────

interface RuneListProps {
  runes: Rune[];
  isWeapon: boolean;
  compatibilityCtx: RuneCompatibilityContext;
  onSelect: (rune: Rune) => void;
}

function RuneList({
  runes,
  isWeapon,
  compatibilityCtx,
  onSelect,
}: RuneListProps) {
  if (runes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        No runes available.
      </p>
    );
  }

  return (
    <div className="w-full min-w-0 max-h-[1000px] overflow-y-auto space-y-1">
      {runes.map((rune) => {
        const reason = getRuneIneligibilityReason(rune, compatibilityCtx);
        const effectText =
          (isWeapon ? rune.weaponEffect : rune.armorEffect) ?? "";

        return (
          <button
            key={`${rune.name}-${rune.monsterName}`}
            disabled={reason !== null}
            onClick={() => onSelect(rune)}
            className={cn(
              "w-full min-w-0 text-left flex items-start gap-2 px-2 py-1.5 rounded transition-colors",
              reason !== null
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-accent",
            )}
            title={reason ?? undefined}
          >
            <Gem
              className={cn(
                "h-3 w-3 shrink-0 mt-0.5",
                reason !== null ? "text-muted-foreground/40" : "text-primary",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-foreground break-words">
                {rune.name}
              </div>
              {effectText && (
                <DndRichText
                  text={effectText}
                  className="text-[10px] text-muted-foreground break-words whitespace-normal leading-relaxed"
                />
              )}
              {reason && (
                <div className="text-[10px] text-amber-500/80 mt-0.5">
                  {reason}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
