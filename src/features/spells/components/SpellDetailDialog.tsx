import { useEffect, useMemo, useState } from "react";
import { Spell } from "@/shared/types";
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
import { cn } from "@/shared/utils/cn";
import {
  formatFieldValue,
  getFieldsDifferentFromVariant,
  getFieldsThatVaryAcrossVariants,
  getVariantFieldLabel,
  sortSpellVariants,
  type SpellVariantField,
} from "../utils/spell-variant.utils";
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "../services/book-source.service";
import { SourceBadge } from "./SourceBadge";
import { DescriptionLines } from "@/shared/components/DescriptionLines";
import { DndRichText } from "@/shared/components/DndRichText";

interface SpellDetailDialogProps {
  spell: Spell | null;
  variants?: Spell[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MetaRow({
  label,
  value,
  differs,
}: {
  label: string;
  value: string;
  differs?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "text-sm",
          differs ? "text-amber-300 font-medium" : "text-foreground",
        )}
      >
        {value}
        {differs && (
          <span className="ml-1.5 text-[10px] font-normal text-amber-500/80">
            (varies)
          </span>
        )}
      </span>
    </div>
  );
}

function ComponentsText({ components }: { components: Spell["components"] }) {
  const parts: string[] = [];
  if (components.v) parts.push("V");
  if (components.s) parts.push("S");
  if (components.m) parts.push(`M (${components.m})`);
  return <span>{parts.join(", ") || "—"}</span>;
}

function VariantDiffBanner({
  varyingFields,
  active,
  variants,
  bookNames,
}: {
  varyingFields: SpellVariantField[];
  active: Spell;
  variants: Spell[];
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
                    if (f === "description" || f === "higherLevel") {
                      return `${label} (see tab)`;
                    }
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

function SourceSwitcher({
  variants,
  activeId,
  onSelect,
  varyingFields,
  bookNames,
}: {
  variants: Spell[];
  activeId: string;
  onSelect: (id: string) => void;
  varyingFields: SpellVariantField[];
  bookNames: BookSourceNameMap;
}) {
  if (variants.length <= 1) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Source
      </p>
      <div className="flex flex-wrap gap-1.5">
        {variants.map((v) => {
          const isActive = v.id === activeId;
          const differsFromOthers =
            varyingFields.length > 0 &&
            variants.some(
              (other) =>
                other.id !== v.id &&
                getFieldsDifferentFromVariant(v, other).length > 0,
            );
          const sourceTitle = resolveBookSourceName(bookNames, v.source);

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              title={sourceTitle !== v.source ? sourceTitle : undefined}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-violet-500 bg-violet-500/20 text-violet-300"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {v.source}
              {v.page !== undefined && (
                <span className="ml-1 opacity-70">p.{v.page}</span>
              )}
              {!isActive && differsFromOthers && (
                <span className="ml-1 text-amber-400" title="Differs from other sources">
                  •
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SpellDetailDialog({
  spell,
  variants: variantsProp,
  open,
  onOpenChange,
}: SpellDetailDialogProps) {
  const variants = useMemo(() => {
    if (!spell) return [];
    const list =
      variantsProp && variantsProp.length > 0
        ? variantsProp
        : [spell];
    return sortSpellVariants(
      list.some((v) => v.id === spell.id) ? list : [...list, spell],
    );
  }, [spell, variantsProp]);

  const [activeId, setActiveId] = useState("");
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});

  useEffect(() => {
    if (spell) setActiveId(spell.id);
  }, [spell?.id]);

  useEffect(() => {
    if (!open) return;
    getBookSourceNames().then(setBookNames);
  }, [open]);

  const active = useMemo(
    () => variants.find((v) => v.id === activeId) ?? spell,
    [variants, activeId, spell],
  );

  const varyingFields = useMemo(
    () => getFieldsThatVaryAcrossVariants(variants),
    [variants],
  );

  const differs = useMemo(() => {
    const set = new Set(varyingFields);
    return (field: SpellVariantField) => set.has(field);
  }, [varyingFields]);

  if (!spell || !active) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-violet-400 text-2xl">{active.name}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                {active.level === 0 ? "Cantrip" : `Level ${active.level}`} ·{" "}
                {active.schoolName}
              </Badge>
              <SourceBadge source={active.source} bookNames={bookNames} />
              {active.isRitual && (
                <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/50">
                  Ritual
                </Badge>
              )}
              {active.isConcentration && (
                <Badge className="bg-amber-950/60 text-amber-300 border-amber-800/50">
                  Concentration
                </Badge>
              )}
              {active.page !== undefined && (
                <span className="text-xs text-muted-foreground">p. {active.page}</span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4 mb-4">
            <SourceSwitcher
              variants={variants}
              activeId={active.id}
              onSelect={setActiveId}
              varyingFields={varyingFields}
              bookNames={bookNames}
            />
            <VariantDiffBanner
              varyingFields={varyingFields}
              active={active}
              variants={variants}
              bookNames={bookNames}
            />
          </div>

          <div className="space-y-1.5 mb-4 p-3 rounded-md border border-border bg-muted/20">
            <MetaRow
              label="Casting Time"
              value={active.castingTime}
              differs={differs("castingTime")}
            />
            <MetaRow label="Range" value={active.range} differs={differs("range")} />
            <MetaRow
              label="Components"
              value=""
              differs={differs("components")}
            />
            <div className="flex gap-2 -mt-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 shrink-0" />
              <span
                className={cn(
                  "text-sm",
                  differs("components") ? "text-amber-300 font-medium" : "text-foreground",
                )}
              >
                <ComponentsText components={active.components} />
              </span>
            </div>
            <MetaRow
              label="Duration"
              value={active.duration}
              differs={differs("duration")}
            />
            {(differs("level") || differs("schoolName")) && (
              <>
                <MetaRow
                  label="Level"
                  value={active.level === 0 ? "Cantrip" : `Level ${active.level}`}
                  differs={differs("level")}
                />
                <MetaRow
                  label="School"
                  value={active.schoolName}
                  differs={differs("schoolName")}
                />
              </>
            )}
          </div>

          {active.description.length > 0 && (
            <>
              <h3
                className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-3",
                  differs("description") ? "text-amber-400" : "text-violet-400",
                )}
              >
                Description
                {differs("description") && (
                  <span className="ml-2 text-[10px] font-normal text-amber-500/80">
                    (varies by source)
                  </span>
                )}
              </h3>
              <DescriptionLines lines={active.description} insetAccent="violet" />
            </>
          )}

          {active.higherLevel && (
            <>
              <Separator className="my-4" />
              <h3
                className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-3",
                  differs("higherLevel") ? "text-amber-400" : "text-violet-400",
                )}
              >
                At Higher Levels
                {differs("higherLevel") && (
                  <span className="ml-2 text-[10px] font-normal text-amber-500/80">
                    (varies)
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <DndRichText text={active.higherLevel} />
              </p>
            </>
          )}

          {active.classes.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3
                className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-3",
                  differs("classes") ? "text-amber-400" : "text-violet-400",
                )}
              >
                Classes
                {differs("classes") && (
                  <span className="ml-2 text-[10px] font-normal text-amber-500/80">
                    (varies)
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {active.classes.map((cls) => (
                  <span
                    key={cls}
                    className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
