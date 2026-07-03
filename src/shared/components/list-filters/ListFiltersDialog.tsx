import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { ListFilterSection } from "./ListFilterSection";
import type { ListFiltersDialogProps, ListFilterValues } from "./list-filter.types";
import {
  getSectionSelected,
  setSectionSelected,
} from "./list-filter.utils";

export function ListFiltersDialog({
  open,
  onOpenChange,
  title = "Filters",
  description = "Refine the list. Changes apply when you save.",
  sections,
  applied,
  defaults,
  onApply,
}: ListFiltersDialogProps) {
  const [draft, setDraft] = useState<ListFilterValues>(applied);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 150);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(applied);
      setSearchQuery("");
    }
    wasOpenRef.current = open;
  }, [open, applied]);

  const handleSectionChange = useCallback(
    (sectionId: string, selected: string[]) => {
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;
      setDraft((prev) => setSectionSelected(section, prev, selected));
    },
    [sections],
  );

  const handleSave = useCallback(() => {
    onApply(draft);
    onOpenChange(false);
  }, [draft, onApply, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleReset = useCallback(() => {
    setDraft(defaults);
  }, [defaults]);

  const visibleSections = useMemo(
    () => sections.filter((section) => section.options.length > 0),
    [sections],
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="backdrop-blur-none bg-black/60"
        className="max-w-4xl flex flex-col max-h-[90vh] duration-150"
      >
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <div className="relative pt-2">
            <Search className="absolute left-2.5 top-4 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filter options..."
              className="pl-8"
            />
          </div>
        </DialogHeader>

        <DialogBody className="flex-1 min-h-0 space-y-4 pt-2 overscroll-contain">
          {visibleSections.map((section) => (
            <ListFilterSection
              key={section.id}
              title={section.title}
              mode={section.mode}
              options={section.options}
              selected={getSectionSelected(section, draft)}
              onChange={(selected) => handleSectionChange(section.id, selected)}
              searchQuery={debouncedSearch}
            />
          ))}
        </DialogBody>

        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
