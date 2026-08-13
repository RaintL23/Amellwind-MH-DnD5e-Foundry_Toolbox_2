import { useState } from "react";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProficiencySourceType } from "@/shared/types/proficiency.types";
import {
  badgeStyleForSource,
  dominantSourceType,
  SOURCE_LABELS,
} from "../../utils/proficiency-source-styles";
import {
  PICKER_CONTAINER_CLASS,
  pickerPillClassName,
  pickerQuota,
  type PickerGrant,
} from "./picker-shared";

interface BuilderNamedPickerProps {
  grants: PickerGrant[];
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
  const { totalCount, remainingPicks, canPickMore, grantSourceName } = pickerQuota(
    grants,
    chosen.length,
  );
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
    <div className={PICKER_CONTAINER_CLASS}>
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
                className={pickerPillClassName({
                  badgeColor: isChosen ? pickerColor : undefined,
                  isDisabled,
                })}
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
                className={pickerPillClassName({
                  badgeColor: pickerColor,
                  isDisabled: false,
                })}
              >
                {item}
              </button>
            ))}
          {canPickMore && (
            <>
              <Input
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
                className="h-6 min-w-[7rem] flex-1 px-2 text-[10px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustom}
                disabled={!customInput.trim()}
                className="h-6 px-2 text-[10px]"
              >
                Add
              </Button>
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
