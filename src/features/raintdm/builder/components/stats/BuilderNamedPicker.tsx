import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ProficiencySourceType } from "@/shared/types/proficiency.types";
import { resolveAnyProficiencyOptions } from "@/shared/data/chooseable-tools-weapons";
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
  const [comboOpen, setComboOpen] = useState(false);

  const allowedSet = new Set<string>();
  let catalogAny = false;
  let catalogLabel = "option";

  for (const g of grants) {
    if (g.kind === "choose") {
      g.from.forEach((item) => allowedSet.add(item));
    } else if (g.kind === "any") {
      const options = resolveAnyProficiencyOptions(g.label ?? "", g.options);
      options.forEach((item) => allowedSet.add(item));
      catalogAny = true;
      if (g.label) catalogLabel = g.label;
    }
  }

  const allowed = [...allowedSet].sort((a, b) => a.localeCompare(b));
  const { totalCount, remainingPicks, canPickMore, grantSourceName } = pickerQuota(
    grants,
    chosen.length,
  );
  const pickerColor = badgeStyleForSource(pickerSourceType);

  /** Fixed choose-from list uses pills; open-ended any-grants use a searchable combo. */
  const showChoosePills = grants.some((g) => g.kind === "choose") && !catalogAny;
  const showCatalogCombo = catalogAny;

  const chosenLower = new Set(chosen.map((item) => item.toLowerCase()));
  const comboChoices = showCatalogCombo
    ? allowed.filter((item) => !chosenLower.has(item.toLowerCase()))
    : [];

  if (!grants.length) return null;

  function handleToggle(item: string, isChosen: boolean) {
    if (isChosen) {
      onChange(chosen.filter((s) => s !== item));
      return;
    }
    if (canPickMore && !chosen.includes(item)) {
      onChange([...chosen, item]);
    }
  }

  function handlePickFromCombo(item: string) {
    if (!canPickMore || chosen.includes(item)) return;
    onChange([...chosen, item]);
    setComboOpen(false);
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

      {showChoosePills && allowed.length > 0 && (
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

      {showCatalogCombo && (
        <div className="mt-1 space-y-2">
          {chosen.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {chosen.map((item) => (
                <button
                  key={item}
                  type="button"
                  title={`Remove ${item}`}
                  onClick={() => onChange(chosen.filter((s) => s !== item))}
                  className={pickerPillClassName({
                    badgeColor: pickerColor,
                    isDisabled: false,
                  })}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {canPickMore && (
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="h-7 w-full justify-between px-2 text-[10px] font-normal"
                >
                  <span className="truncate text-muted-foreground">
                    Search {catalogLabel.toLowerCase()}…
                  </span>
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-0"
              >
                <Command>
                  <CommandInput
                    placeholder={`Type a ${catalogLabel.toLowerCase()}…`}
                    className="h-8 text-xs"
                  />
                  <CommandList>
                    <CommandEmpty>No match found.</CommandEmpty>
                    <CommandGroup>
                      {comboChoices.map((item) => (
                        <CommandItem
                          key={item}
                          value={item}
                          onSelect={() => handlePickFromCombo(item)}
                          className="text-xs"
                        >
                          <Check className="mr-2 h-3.5 w-3.5 opacity-0" />
                          <span className="truncate">{item}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
