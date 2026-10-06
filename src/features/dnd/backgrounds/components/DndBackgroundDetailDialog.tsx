import { useEffect, useMemo, useState } from "react";
import { SourceVariantSwitcher } from "@/shared/components/SourceVariantSwitcher";
import type { DndBackground } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BackgroundContent } from "@/shared/components/background/BackgroundContent";
import { getBackgroundMetaLabels } from "@/shared/utils/background-display.utils";
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/dnd/spells/services/book-source.service";

interface DndBackgroundDetailDialogProps {
  background: DndBackground | null;
  variants?: DndBackground[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DndBackgroundDetailDialog({
  background: backgroundProp,
  variants: variantsProp,
  open,
  onOpenChange,
}: DndBackgroundDetailDialogProps) {
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    void getBookSourceNames().then(setBookNames);
  }, []);

  const variants = useMemo(() => {
    if (!variantsProp || variantsProp.length === 0) {
      return backgroundProp ? [backgroundProp] : [];
    }
    return [...variantsProp].sort((a, b) => a.source.localeCompare(b.source));
  }, [variantsProp, backgroundProp]);

  useEffect(() => {
    if (backgroundProp) setActiveId(backgroundProp.id);
  }, [backgroundProp]);

  const activeBackground = useMemo(
    () => variants.find((v) => v.id === activeId) ?? variants[0] ?? backgroundProp,
    [variants, activeId, backgroundProp],
  );

  if (!activeBackground) return null;

  const sourceName = resolveBookSourceName(bookNames, activeBackground.source);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-amber-400 text-2xl">
            {activeBackground.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              {getBackgroundMetaLabels(activeBackground).map((label, i) => (
                <Badge key={label} variant={i === 0 ? "secondary" : "outline"}>
                  {label}
                </Badge>
              ))}
              <span
                className="text-xs text-muted-foreground"
                title={sourceName !== activeBackground.source ? sourceName : undefined}
              >
                {activeBackground.source}
                {activeBackground.page !== undefined
                  ? ` p.${activeBackground.page}`
                  : ""}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {variants.length > 1 && (
            <>
              <SourceVariantSwitcher
                size="md"
                accent="amber"
                variants={variants}
                activeId={activeId}
                onSelect={setActiveId}
                bookNames={bookNames}
              />
              <Separator className="my-4" />
            </>
          )}

          <BackgroundContent
            background={activeBackground}
            density="comfortable"
            accent="amber"
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
