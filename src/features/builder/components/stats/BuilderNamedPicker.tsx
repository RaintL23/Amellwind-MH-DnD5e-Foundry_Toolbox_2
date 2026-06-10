import { useState } from "react";
import { cn } from "@/shared/utils/cn";
import type { ProficiencySource, ProficiencySourceType } from "@/shared/types/proficiency.types";
import {
  badgeStyleForSource,
  dominantSourceType,
  SOURCE_LABELS,
} from "../../utils/proficiency-source-styles";

type ChooseGrant = {
  kind: "choose";
  from: string[];
  count: number;
  source: ProficiencySource;
};

type AnyGrant = {
  kind: "any";
  count: number;
  label: string;
  options?: string[];
  source: ProficiencySource;
};

interface BuilderNamedPickerProps {
  grants: Array<ChooseGrant | AnyGrant>;
  chosen: string[];
  onChange: (items: string[]) => void;
  label?: string;
  pickerSourceType: ProficiencySourceType;
}

export function BuilderNamedPicker({
  grants,
  chosen,
  onChange,
  label,
  pickerSourceType,
}: BuilderNamedPickerProps) {
  const [customInput, setCustomInput] = useState("");

  if (!grants.length) return null;

  const totalCount = grants.reduce((acc, g) => acc + g.count, 0);
  const allowedSet = new Set<string>();
  let freeformAny = false;

  for (const g of grants) {
    if (g.kind === "choose") {
      g.from.forEach((item) => allowedSet.add(item));
    } else if (g.kind === "any") {
      g.options?.forEach((item) => allowedSet.add(item));
      freeformAny = true;
    }
  }

  const allowed = [...allowedSet].sort((a, b) => a.localeCompare(b));
  const remainingPicks = Math.max(0, totalCount - chosen.length);
  const canPickMore = remainingPicks > 0;
  const grantSourceName = grants[0]?.source.name ?? "";
  const pickerColor = badgeStyleForSource(pickerSourceType);

  function handleToggle(item: string, isChosen: boolean) {
    if (isChosen) {
      onChange(chosen.filter((s) => s !== item));
      return;
    }
    if (canPickMore && !chosen.includes(item)) {
      onChange([...chosen, item]);
    }
  }

  function handleAddCustom() {
    const value = customInput.trim();
    if (!value || !canPickMore || chosen.includes(value)) return;
    onChange([...chosen, value]);
    setCustomInput("");
  }

  return (
    <div className="mt-2 rounded-md border border-border/50 bg-muted/30 p-2">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label ?? grantSourceName} — choose {totalCount}
        {remainingPicks > 0 && remainingPicks < totalCount && (
          <span className="normal-case text-muted-foreground/80">
            {" "}
            (pick {remainingPicks} more)
          </span>
        )}
        {remainingPicks === 0 && chosen.length >= totalCount && (
          <span className="normal-case text-muted-foreground/80"> (done)</span>
        )}
      </p>

      {allowed.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {allowed.map((item) => {
            const isChosen = chosen.includes(item);
            const isDisabled = !isChosen && !canPickMore;

            return (
              <button
                key={item}
                type="button"
                disabled={isDisabled}
                title={
                  isChosen
                    ? `Your ${SOURCE_LABELS[pickerSourceType]} choice`
                    : undefined
                }
                onClick={() => handleToggle(item, isChosen)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  isChosen
                    ? pickerColor
                    : !isDisabled &&
                        "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-foreground",
                  !isChosen &&
                    isDisabled &&
                    "cursor-not-allowed border-border/40 text-muted-foreground/40",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      )}

      {freeformAny && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {chosen
            .filter((item) => !allowed.includes(item))
            .map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onChange(chosen.filter((s) => s !== item))}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  pickerColor,
                )}
              >
                {item}
              </button>
            ))}
          {canPickMore && (
            <>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                placeholder={grants.find((g) => g.kind === "any")?.label ?? "Custom"}
                className="h-6 min-w-[7rem] flex-1 rounded border border-border/60 bg-background px-2 text-[10px] text-foreground"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customInput.trim()}
                className="rounded border border-border/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
              >
                Add
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function BuilderSourceLegend() {
  return (
    <div className="mb-2 flex flex-wrap gap-2 text-[9px] text-muted-foreground">
      {(["species", "background", "class"] as const).map((type) => (
        <span key={type} className="flex items-center gap-1">
          <span
            className={`inline-block h-2 w-2 rounded-full border ${badgeStyleForSource(type)}`}
            aria-hidden
          />
          {SOURCE_LABELS[type]}
        </span>
      ))}
    </div>
  );
}

export function BuilderGrantBadgeList({
  items,
  sources,
}: {
  items: string[];
  sources: Partial<Record<string, import("@/shared/types/proficiency.types").ProficiencySource[]>>;
}) {
  if (!items.length) {
    return (
      <p className="py-2 text-center text-[11px] text-muted-foreground">
        Select Species, Background, or Class to see grants.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => {
        const itemSources = sources[item.toLowerCase()] ?? [];
        const color = itemSources.length
          ? badgeStyleForSource(dominantSourceType(itemSources))
          : "border-border text-muted-foreground";
        const tooltip = itemSources.length
          ? itemSources.map((s) => `${SOURCE_LABELS[s.type]}: ${s.name}`).join(", ")
          : undefined;

        return (
          <span
            key={item}
            title={tooltip}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              color,
            )}
          >
            {item}
          </span>
        );
      })}
    </div>
  );
}
