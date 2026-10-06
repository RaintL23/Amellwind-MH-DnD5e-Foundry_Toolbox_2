import { useEffect, useMemo, useState } from "react";
import { SourceVariantSwitcher } from "@/shared/components/SourceVariantSwitcher";
import { DndItem } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SourceBadge } from "@/features/dnd/spells/components/SourceBadge";
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/dnd/spells/services/book-source.service";
import { sortDndItemVariants } from "../utils/item-dedupe.utils";
import {
  formatFieldValue,
  getFieldsDifferentFromVariant,
  getFieldsThatVaryAcrossVariants,
  getVariantFieldLabel,
  type DndItemVariantField,
} from "../utils/item-variant.utils";
import { DndItemContent } from "./DndItemContent";

interface DndItemDetailDialogProps {
  item: DndItem | null;
  variants?: DndItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VariantDiffBanner({
  varyingFields,
  active,
  variants,
  bookNames,
}: {
  varyingFields: DndItemVariantField[];
  active: DndItem;
  variants: DndItem[];
  bookNames: BookSourceNameMap;
}) {
  if (varyingFields.length === 0) return null;

  const others = variants.filter((v) => v.id !== active.id);

  return (
    <div className="rounded-md border border-amber-800/40 bg-amber-950/25 px-3 py-2.5 space-y-2">
      <p className="text-xs font-semibold text-amber-300">
        {variants.length} sources — differs in:{" "}
        {varyingFields.map(getVariantFieldLabel).join(", ")}
      </p>
      {others.length > 0 && (
        <div className="space-y-1.5">
          {others.map((other) => {
            const diffFields = getFieldsDifferentFromVariant(active, other);
            if (diffFields.length === 0) {
              return (
                <p key={other.id} className="text-[11px] text-muted-foreground">
                  <span
                    className="font-medium text-foreground"
                    title={resolveBookSourceName(bookNames, other.source)}
                  >
                    {other.source}:
                  </span>{" "}
                  same as current
                </p>
              );
            }
            return (
              <div key={other.id} className="text-[11px] text-muted-foreground">
                <span
                  className="font-medium text-foreground"
                  title={resolveBookSourceName(bookNames, other.source)}
                >
                  {other.source}:
                </span>{" "}
                {diffFields
                  .map((f) => {
                    const label = getVariantFieldLabel(f);
                    if (f === "description") return `${label} (see below)`;
                    return `${label} → ${formatFieldValue(other, f)}`;
                  })
                  .join(" · ")}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function itemsDiffer(a: DndItem, b: DndItem): boolean {
  return getFieldsDifferentFromVariant(a, b).length > 0;
}


export function DndItemDetailDialog({
  item,
  variants: variantsProp,
  open,
  onOpenChange,
}: DndItemDetailDialogProps) {
  const variants = useMemo(() => {
    if (!item) return [];
    const list =
      variantsProp && variantsProp.length > 0 ? variantsProp : [item];
    return sortDndItemVariants(
      list.some((v) => v.id === item.id) ? list : [...list, item],
    );
  }, [item, variantsProp]);

  const [activeId, setActiveId] = useState("");
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});
  const [linkedItem, setLinkedItem] = useState<DndItem | null>(null);
  const [linkedOpen, setLinkedOpen] = useState(false);

  useEffect(() => {
    if (item) setActiveId(item.id);
  }, [item?.id]);

  useEffect(() => {
    if (!open) {
      setLinkedOpen(false);
      setLinkedItem(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    getBookSourceNames().then(setBookNames);
  }, [open]);

  const active = useMemo(
    () => variants.find((v) => v.id === activeId) ?? item,
    [variants, activeId, item],
  );

  const varyingFields = useMemo(
    () => getFieldsThatVaryAcrossVariants(variants),
    [variants],
  );

  function openLinkedItem(next: DndItem) {
    setLinkedItem(next);
    setLinkedOpen(true);
  }

  if (!item || !active) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-amber-400 text-2xl">
            {active.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                {active.weaponCategory
                  ? `${active.weaponCategory === "martial" ? "Martial" : "Simple"} ${active.typeLabel}`
                  : active.typeLabel}
                {" · "}
                {active.rarityLabel}
              </Badge>
              <SourceBadge source={active.source} bookNames={bookNames} />
              {active.attunement && (
                <Badge className="bg-violet-950/60 text-violet-300 border-violet-800/50">
                  {active.attunement}
                </Badge>
              )}
              {active.page !== undefined && (
                <span className="text-xs text-muted-foreground">
                  p. {active.page}
                </span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4 mb-4">
            <SourceVariantSwitcher
              size="md"
              accent="amber"
              variants={variants}
              activeId={active.id}
              onSelect={setActiveId}
              differs={varyingFields.length > 0 ? itemsDiffer : undefined}
              bookNames={bookNames}
            />
            <VariantDiffBanner
              varyingFields={varyingFields}
              active={active}
              variants={variants}
              bookNames={bookNames}
            />
          </div>

          <DndItemContent
            item={active}
            variants={variants}
            onOpenItem={openLinkedItem}
            density="comfortable"
          />
        </DialogBody>
      </DialogContent>
    </Dialog>

    <DndItemDetailDialog
      item={linkedItem}
      open={linkedOpen}
      onOpenChange={setLinkedOpen}
    />
    </>
  );
}
