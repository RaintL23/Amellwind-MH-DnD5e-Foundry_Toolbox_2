import { memo, useMemo, useState } from "react";
import { Loader2, Settings2, X } from "lucide-react";
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
  const {
    codes,
    loadedCodes,
    counts,
    scanProgress,
    loadingLabel,
    onOpen,
    onLoad,
    onUnload,
  } = controls;
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

  const loadedOptions = useMemo((): ListFilterOption[] => {
    const { groups } = buildSourceFilterSectionOptions(
      loadedCodes,
      catalog,
      bookNames,
    );
    return groups.flatMap((kind) =>
      (kind.groups ?? []).flatMap((year) => year.options),
    );
  }, [loadedCodes, catalog, bookNames]);

  function renderOption(
    { value, label, aliases }: ListFilterOption,
    loaded: boolean,
  ) {
    const optionCodes = [value, ...(aliases ?? [])];
    const count = Math.max(...optionCodes.map((code) => counts.get(code) ?? 0));
    return (
      <CommandItem
        key={value}
        value={`${label} ${optionCodes.join(" ")}`}
        onSelect={() => {
          setOpen(false);
          if (loaded) onUnload(optionCodes, label);
          else onLoad(optionCodes, label);
        }}
        className="flex-col items-start gap-0.5 py-2"
      >
        <span className="flex w-full items-start gap-2">
          <span className="min-w-0 flex-1 whitespace-normal break-words text-sm font-medium leading-snug text-foreground">
            {label}
          </span>
          {loaded && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
              <X className="h-3 w-3" />
              Remove
            </span>
          )}
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
  }

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
            <Settings2 className="h-3 w-3" />
          )}
          Manage sources
          {loadedCodes.length > 0 && (
            <span className="text-[10px] text-muted-foreground/80">
              · {loadedOptions.length} loaded
            </span>
          )}
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
            {loadedOptions.length > 0 && (
              <CommandGroup heading="Loaded sources">
                {loadedOptions.map((option) => renderOption(option, true))}
              </CommandGroup>
            )}
            {sections.map(({ id, heading, options }) => (
              <CommandGroup key={id} heading={`Add · ${heading}`}>
                {options.map((option) => renderOption(option, false))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
