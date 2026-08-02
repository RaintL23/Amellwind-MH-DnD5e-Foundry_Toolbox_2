import { useMemo, useState } from "react";
import type { Class, OptionalFeatureProgression, Subclass } from "@/shared/types";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DndRichText } from "@/shared/components/DndRichText";
import {
  getFeatCategoryLabel,
  progressionDisplayName,
} from "@/features/builder/utils/class-optional-features.utils";
import { getWeaponMasteryWeapon } from "@/features/builder/data/weapon-mastery.data";
import { useOptionalFeatureCatalogBrowse } from "../../hooks/useOptionalFeatureCatalogBrowse";

interface ClassOptionalFeatureOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progression: OptionalFeatureProgression | null;
  classData: Class | null;
  subclass: Subclass | null;
}

export function ClassOptionalFeatureOptionsDialog({
  open,
  onOpenChange,
  progression,
  classData,
  subclass,
}: ClassOptionalFeatureOptionsDialogProps) {
  const { items, loading } = useOptionalFeatureCatalogBrowse(
    open ? progression : null,
    classData,
    subclass,
  );
  const [search, setSearch] = useState("");

  const title = progression
    ? progressionDisplayName(progression.name)
    : "Options";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.entries.some((line) => line.toLowerCase().includes(q)),
    );
  }, [items, search]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSearch("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sky-300">{title}</DialogTitle>
          <DialogDescription>
            {loading
              ? "Loading options…"
              : `${filtered.length} option${filtered.length === 1 ? "" : "s"}`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          {items.length > 8 && (
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              className="h-9"
            />
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground italic">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No options found.
            </p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {filtered.map((item) => {
                const categoryLabel =
                  item.catalog === "feat"
                    ? getFeatCategoryLabel(item.category)
                    : item.featureTypes[0];
                const masteryWeapon = getWeaponMasteryWeapon(item.id);

                return (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="py-3 text-sm hover:no-underline">
                      <span className="flex flex-wrap items-center gap-2 text-left pr-2">
                        <span className="font-medium text-foreground">
                          {item.name}
                        </span>
                        {masteryWeapon && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {masteryWeapon.mastery}
                          </Badge>
                        )}
                        {categoryLabel && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {categoryLabel}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          {item.source}
                          {item.page !== undefined ? ` p.${item.page}` : ""}
                        </Badge>
                        {item.consumes && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            {item.consumes}
                          </Badge>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                        {item.prerequisiteSummary && (
                          <p className="text-xs">
                            <span className="font-semibold text-foreground/80">
                              Prerequisites:
                            </span>{" "}
                            {item.prerequisiteSummary}
                          </p>
                        )}
                        {item.entries.length > 0 ? (
                          item.entries.map((line, i) => (
                            <p key={i}>
                              <DndRichText text={line} />
                            </p>
                          ))
                        ) : (
                          <p className="italic">No description available.</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
