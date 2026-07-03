import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Gem, ChevronLeft, Info, ShieldCheck, Sword } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { MaterialEffectSlot, Rune } from "@/shared/types";
import { MATERIAL_EFFECT_SLOT_LABELS } from "@/shared/types/material-effect.types";
import {
  type RuneCompatibilityContext,
  type TagFilterMode,
  getRuneIneligibilityReason,
  getTagIneligibilityReasons,
  getRuneEffectTags,
  runeMatchesTagFilter,
  expandRunesForPicker,
  getRuneMaterialEffectText,
} from "@/features/runes/utils/rune-compatibility.utils";
import { formatTag, tagVariant } from "@/features/runes/utils/rune-tag.utils";
import { RuneEffectText } from "@/features/runes/components/shared/RuneEffectText";

interface RunePickerPanelProps {
  /** Runes available for selection. In "build" mode these are the build runes; in "catalog" all runes. */
  runes: Rune[];
  mode: "build" | "catalog";
  slotLabel: string;
  slotKind: "weapon" | "armor" | "trinket";
  compatibilityCtx: RuneCompatibilityContext;
  onSelect: (rune: Rune, materialEffectKind?: MaterialEffectSlot) => void;
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
  compatibilityCtx,
  onSelect,
  onCancel,
}: RunePickerPanelProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilteredList, setShowFilteredList] = useState(false);
  const [tagFilterMode, setTagFilterMode] = useState<TagFilterMode | null>(
    null,
  );

  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const rune of runes) {
      for (const tag of getRuneEffectTags(rune, slotKind)) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [runes, slotKind]);

  const andFilteredRunes = useMemo(() => {
    if (selectedTags.length === 0) return [];
    return runes.filter((r) =>
      runeMatchesTagFilter(r, selectedTags, "and", slotKind),
    );
  }, [runes, selectedTags, slotKind]);

  const orFilteredRunes = useMemo(() => {
    if (selectedTags.length === 0) return [];
    return runes.filter((r) =>
      runeMatchesTagFilter(r, selectedTags, "or", slotKind),
    );
  }, [runes, selectedTags, slotKind]);

  const displayedRunes =
    tagFilterMode === "or" ? orFilteredRunes : andFilteredRunes;

  const buildListEntries = useMemo(
    () => expandRunesForPicker(runes, slotKind, [], null),
    [runes, slotKind],
  );

  const filteredListEntries = useMemo(
    () =>
      expandRunesForPicker(
        displayedRunes,
        slotKind,
        selectedTags,
        tagFilterMode,
      ),
    [displayedRunes, slotKind, selectedTags, tagFilterMode],
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <div className="border-t border-border pt-2 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        {showFilteredList && mode === "catalog" ? (
          <button
            onClick={() => {
              setShowFilteredList(false);
              setTagFilterMode(null);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" />
            Change tags
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
            Rune Planner.
          </p>
        </div>
      )}

      {/* Build mode: flat list */}
      {mode === "build" && (
        <RuneList
          entries={buildListEntries}
          slotKind={slotKind}
          compatibilityCtx={compatibilityCtx}
          onSelect={onSelect}
        />
      )}

      {/* Catalog mode: tag grid → rune list */}
      {mode === "catalog" && !showFilteredList && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">
            Select one or more tags to browse runes:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {uniqueTags.map((tag) => {
              const variant = tagVariant(tag);
              const ineligibilityReason = getTagIneligibilityReasons(
                tag,
                runes,
                compatibilityCtx,
              );
              const disabled = ineligibilityReason !== null;
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  disabled={disabled}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={isSelected}
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                    disabled
                      ? cn(
                          "cursor-not-allowed opacity-50",
                          TAG_VARIANT_DISABLED[variant],
                        )
                      : cn(
                          TAG_VARIANT_CLASSES[variant],
                          isSelected &&
                            "ring-2 ring-primary/60 ring-offset-1 ring-offset-background",
                        ),
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
          {uniqueTags.length > 0 && (
            <div className="flex gap-2">
              <button
                disabled={selectedTags.length === 0}
                onClick={() => {
                  setTagFilterMode("and");
                  setShowFilteredList(true);
                }}
                className={cn(
                  "flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedTags.length === 0
                    ? "border-border text-muted-foreground/50 cursor-not-allowed"
                    : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
                )}
                title="Runes that have every selected tag on the same rune"
              >
                All tags in one rune ({andFilteredRunes.length})
              </button>
              <button
                disabled={selectedTags.length === 0}
                onClick={() => {
                  setTagFilterMode("or");
                  setShowFilteredList(true);
                }}
                className={cn(
                  "flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedTags.length === 0
                    ? "border-border text-muted-foreground/50 cursor-not-allowed"
                    : "border-border bg-muted/30 text-foreground hover:bg-muted/50",
                )}
                title="Runes that have at least one of the selected tags"
              >
                Any selected tag ({orFilteredRunes.length})
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "catalog" && showFilteredList && (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[11px] text-muted-foreground">
              {tagFilterMode === "or"
                ? "Runes with any of:"
                : "Runes with all of:"}
            </span>
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
                  TAG_VARIANT_CLASSES[tagVariant(tag)],
                )}
              >
                {formatTag(tag)}
              </span>
            ))}
          </div>
          <RuneList
            entries={filteredListEntries}
            slotKind={slotKind}
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
  entries: Array<{ rune: Rune; materialEffectKind: MaterialEffectSlot }>;
  slotKind: "weapon" | "armor" | "trinket";
  compatibilityCtx: RuneCompatibilityContext;
  onSelect: (rune: Rune, materialEffectKind?: MaterialEffectSlot) => void;
}

function RuneList({
  entries,
  slotKind,
  compatibilityCtx,
  onSelect,
}: RuneListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        No runes available.
      </p>
    );
  }

  return (
    <div className="w-full min-w-0 max-h-[1000px] overflow-y-auto space-y-1">
      {entries.map(({ rune, materialEffectKind }) => {
        const reason = getRuneIneligibilityReason(
          rune,
          compatibilityCtx,
          slotKind === "trinket" ? materialEffectKind : undefined,
        );
        const effectText = getRuneMaterialEffectText(rune, materialEffectKind);
        const effectLabel = MATERIAL_EFFECT_SLOT_LABELS[materialEffectKind];
        const EffectIcon =
          materialEffectKind === "weapon" ? Sword : ShieldCheck;

        return (
          <button
            key={`${rune.name}-${rune.monsterName}-${materialEffectKind}`}
            disabled={reason !== null}
            onClick={() =>
              onSelect(
                rune,
                slotKind === "trinket" ? materialEffectKind : undefined,
              )
            }
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
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-foreground break-words">
                  {rune.name}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded border px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide",
                    materialEffectKind === "weapon"
                      ? "border-orange-800/50 bg-orange-950/40 text-orange-300"
                      : "border-sky-800/50 bg-sky-950/40 text-sky-300",
                  )}
                >
                  <EffectIcon className="h-2.5 w-2.5" />
                  {effectLabel}
                </span>
              </div>
              {effectText && (
                <div className="text-[10px] text-muted-foreground break-words whitespace-normal leading-relaxed">
                  <RuneEffectText text={effectText} />
                </div>
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
