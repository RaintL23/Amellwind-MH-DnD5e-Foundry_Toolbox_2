import { useEffect, useMemo, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/shared/utils/cn";
import { DescriptionLines } from "@/shared/components/DescriptionLines";
import { SourceBadge } from "@/features/spells/components/SourceBadge";
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import { getDndItemById } from "../services/dnd-item.service";
import { sortDndItemVariants } from "../utils/item-dedupe.utils";
import {
  formatFieldValue,
  getFieldsDifferentFromVariant,
  getFieldsThatVaryAcrossVariants,
  getVariantFieldLabel,
  type DndItemVariantField,
} from "../utils/item-variant.utils";

interface DndItemDetailDialogProps {
  item: DndItem | null;
  variants?: DndItem[];
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
  if (!value || value === "—") return null;
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

function SourceSwitcher({
  variants,
  activeId,
  onSelect,
  varyingFields,
  bookNames,
}: {
  variants: DndItem[];
  activeId: string;
  onSelect: (id: string) => void;
  varyingFields: DndItemVariantField[];
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
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {v.source}
              {v.page !== undefined && (
                <span className="ml-1 opacity-70">p.{v.page}</span>
              )}
              {!isActive && differsFromOthers && (
                <span
                  className="ml-1 text-amber-400"
                  title="Differs from other sources"
                >
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
  const [groupMembers, setGroupMembers] = useState<DndItem[]>([]);

  useEffect(() => {
    if (item) setActiveId(item.id);
  }, [item?.id]);

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

  const differs = useMemo(() => {
    const set = new Set(varyingFields);
    return (field: DndItemVariantField) => set.has(field);
  }, [varyingFields]);

  useEffect(() => {
    if (!active?.isItemGroup || !active.groupItemRefs?.length) {
      setGroupMembers([]);
      return;
    }
    void Promise.all(
      active.groupItemRefs.map(async (ref) => {
        const pipe = ref.indexOf("|");
        if (pipe === -1) return undefined;
        const name = ref.slice(0, pipe);
        const source = ref.slice(pipe + 1);
        return getDndItemById(`${source}::${name}`);
      }),
    ).then((results) => {
      setGroupMembers(results.filter((r): r is DndItem => r != null));
    });
  }, [active?.id, active?.groupItemRefs]);

  if (!item || !active) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-amber-400 text-2xl">
            {active.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                {active.typeLabel} · {active.rarityLabel}
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
              label="Category"
              value={active.category}
              differs={differs("category")}
            />
            <MetaRow
              label="Value"
              value={active.valueGp ?? "—"}
              differs={differs("valueGp")}
            />
            <MetaRow
              label="Weight"
              value={active.weight ?? "—"}
              differs={differs("weight")}
            />
            {active.damage && (
              <MetaRow
                label="Damage"
                value={active.damage}
                differs={differs("damage")}
              />
            )}
            {active.weaponCategory && (
              <MetaRow
                label="Proficiency"
                value={
                  active.weaponCategory === "martial" ? "Martial" : "Simple"
                }
                differs={differs("weaponCategory")}
              />
            )}
            {active.properties && (
              <MetaRow
                label="Properties"
                value={active.properties}
                differs={differs("properties")}
              />
            )}
            {active.bonusWeapon && (
              <MetaRow
                label="Weapon Bonus"
                value={active.bonusWeapon}
                differs={differs("bonusWeapon")}
              />
            )}
            {active.bonusAc && (
              <MetaRow
                label="AC Bonus"
                value={active.bonusAc}
                differs={differs("bonusAc")}
              />
            )}
            {active.baseName && (
              <MetaRow
                label="Base item"
                value={`${active.baseName}${active.baseItemRef ? ` (${active.baseItemRef})` : ""}`}
              />
            )}
            {active.variantName && active.variantName !== active.name && (
              <MetaRow label="Variant" value={active.variantName} />
            )}
          </div>

          {active.isItemGroup &&
            active.groupItemRefs &&
            active.groupItemRefs.length > 0 && (
              <>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Group variants ({active.groupItemRefs.length})
                </h3>
                <ul className="mb-4 space-y-1 text-sm text-muted-foreground">
                  {groupMembers.length > 0
                    ? groupMembers.map((m) => (
                        <li key={m.id}>
                          <span className="text-foreground font-medium">
                            {m.name}
                          </span>
                          <span className="ml-2 text-xs">({m.source})</span>
                        </li>
                      ))
                    : active.groupItemRefs.map((ref) => (
                        <li key={ref}>{ref}</li>
                      ))}
                </ul>
                <Separator className="my-4" />
              </>
            )}

          {active.description.length > 0 && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                Description
                {differs("description") && (
                  <span className="ml-2 text-[10px] font-normal text-amber-500/80">
                    (varies by source)
                  </span>
                )}
              </h3>
              <DescriptionLines lines={active.description} />
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
