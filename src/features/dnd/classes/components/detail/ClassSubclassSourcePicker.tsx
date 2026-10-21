import { memo, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
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
import type { BookSourceNameMap } from "@/features/dnd/spells/services/book-source.service";
import type { ListFilterOption } from "@/shared/components/list-filters/list-filter.types";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import { buildSourceFilterSectionOptions } from "@/shared/services/source-catalog.service";
import type { SubclassSourceControls } from "../../hooks/useClassDetailPage";

interface ClassSubclassSourcePickerProps {
  controls: SubclassSourceControls;
  bookNames: BookSourceNameMap;
}

type SourceSection = {
  id: string;
  heading: string;
  options: ListFilterOption[];
};

export const ClassSubclassSourcePicker = memo(function ClassSubclassSourcePicker({
  controls,
  bookNames,
}: ClassSubclassSourcePickerProps) {
  const { codes, counts, scanProgress, loadingLabel, onOpen, onLoad } = controls;
  const [open, setOpen] = useState(false);
  const catalog = useSourceCatalog();

  // One section per kind (Partnered / Unearthed Arcana / …) and year, newest first.
  const sections = useMemo((): SourceSection[] => {
    const { groups } = buildSourceFilterSectionOptions(codes, catalog, bookNames);
    return groups.flatMap((kind) =>
      (kind.groups ?? []).map((year) => ({
        id: year.id,
        heading: `${kind.label} · ${year.label}`,
        options: year.options,
      })),
    );
  }, [codes, catalog, bookNames]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) onOpen();
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loadingLabel != null}
          className="h-6 gap-1 px-1.5 text-[11px] font-normal normal-case tracking-normal text-muted-foreground"
        >
          {loadingLabel ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Add source
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <Command>
          <CommandInput
            placeholder="Search source for more subclasses…"
            className="h-8 text-xs"
          />
          {scanProgress && (
            <p className="flex items-center gap-1.5 border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Looking for subclasses… {scanProgress.done}/{scanProgress.total}
            </p>
          )}
          <CommandList>
            <CommandEmpty>
              {scanProgress
                ? "No match yet…"
                : "No other source adds subclasses for this class."}
            </CommandEmpty>
            {sections.map(({ id, heading, options }) => (
              <CommandGroup key={id} heading={heading}>
                {options.map(({ value, label, aliases }) => {
                  const optionCodes = [value, ...(aliases ?? [])];
                  const count = Math.max(
                    ...optionCodes.map((code) => counts.get(code) ?? 0),
                  );
                  return (
                    <CommandItem
                      key={value}
                      value={`${label} ${optionCodes.join(" ")}`}
                      onSelect={() => {
                        setOpen(false);
                        onLoad(optionCodes, label);
                      }}
                      className="flex-col items-start gap-0.5 py-2"
                    >
                      <span className="w-full whitespace-normal break-words text-sm font-medium leading-snug text-foreground">
                        {label}
                      </span>
                      <span className="flex w-full items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="min-w-0 truncate">{value}</span>
                        {count > 0 && (
                          <span className="ml-auto shrink-0">
                            {count} subclass{count === 1 ? "" : "es"}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
