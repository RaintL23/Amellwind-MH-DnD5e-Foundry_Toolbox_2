import { useMemo, useState } from "react";
import { Shield, Sword } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DMG_TYPE_LABELS,
  EquippedWeapon,
  PROPERTY_LABELS,
  RARITY_ORDER,
  Rune,
  UNLOCK_COLUMN_PREFIX,
} from "@/shared/types";
import { ExpandableFeatureRow } from "@/features/weapons/components/ExpandableFeatureRow";
import { WeaponProficiencyInfo } from "@/features/weapons/components/WeaponProficiencyInfo";
import { RarityDot } from "@/features/weapons/components/RarityDot";
import { useWeaponDialog } from "@/features/weapons/hooks/useWeaponDialog";
import { formatWeaponValue } from "@/features/weapons/services/weapon.service";
import { getWeaponShieldAcBonusAtIndex } from "@/features/weapons/utils/shield.utils";
import {
  getRaritySlideStatEntries,
  getRaritySlideUnlockSections,
} from "@/features/weapons/utils/rarity-slide.utils";
import { RuneFeaturesSection } from "../RuneFeaturesSection";
import { DndRichText } from "@/shared/components/DndRichText";
import { WeaponModeToggle } from "@/features/weapons/components/WeaponModeToggle";
import {
  getActiveWeaponDamage,
  getActiveWeaponDamageLabel,
  getActiveWeaponGripMode,
  getWeaponGripModeHint,
  hasWeaponGripModes,
  type WeaponGripMode,
} from "@/features/weapons/utils/weapon-mode.utils";
import {
  getGripModeOccupiedHandHint,
  isGripModeBlockedByOccupiedHand,
  type GripModeSlotContext,
} from "@/features/weapons/utils/weapon-hands.utils";
import { getWeaponEffectiveTierLabel } from "../../../utils/equipment-proficiency.utils";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { SourceVariantSwitcher } from "@/features/builder/components/shared/SourceVariantSwitcher";
import type { SourceVariant } from "@/features/builder/utils/library-variant.utils";

interface WeaponLibraryDetailProps {
  equipped: EquippedWeapon;
  gripContext?: GripModeSlotContext;
  weaponProficiencies?: string[];
  showHomebrewDetails?: boolean;
  sourceVariants?: SourceVariant[];
  activeSourceId?: string;
  onSourceChange?: (id: string) => void;
  onModeChange?: (useSecondaryMode: boolean) => void;
}

function getRarityIndex(equipped: EquippedWeapon): number {
  const { weapon, rarity } = equipped;
  const rowIndex = weapon.rarityRows.findIndex((row) => row.rarity === rarity);
  if (rowIndex >= 0) return rowIndex;

  const orderIndex = RARITY_ORDER.indexOf(
    rarity as (typeof RARITY_ORDER)[number],
  );
  return orderIndex >= 0 ? orderIndex : 0;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5">
      <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

function WeaponFeatureSection({
  weapon,
  rarityIndex,
  runes,
}: {
  weapon: EquippedWeapon["weapon"];
  rarityIndex: number;
  runes: (Rune | null)[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { columnChains, featuresMap, baseFeatures, baseFeatureNameKeys } =
    useWeaponDialog(weapon, true);

  const unlockSections = getRaritySlideUnlockSections(
    weapon.rarityRows,
    rarityIndex,
  );

  function toggleFeature(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      const key = name.toLowerCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const visibleCols = useMemo(
    () =>
      columnChains
        .map(({ label, chains }) => ({
          label,
          chains: chains
            .filter((c) => c.introducedAtIndex <= rarityIndex)
            .map((chain) => ({
              ...chain,
              features: chain.features.filter(
                (f) => !baseFeatureNameKeys.has(f.name.toLowerCase()),
              ),
            }))
            .filter((c) => c.features.length > 0),
        }))
        .filter(({ chains }) => chains.length > 0),
    [columnChains, rarityIndex, baseFeatureNameKeys],
  );

  const hasChainFeatures = visibleCols.some(({ chains }) => chains.length > 0);

  return (
    <>
      {unlockSections.length > 0 && (
        <div className="mb-3 space-y-3">
          {unlockSections.map(({ label, items }) => (
            <div key={label}>
              <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {label.replace(UNLOCK_COLUMN_PREFIX, "")}
              </h4>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {items.map((item) => {
                  const introducedAt = weapon.rarityRows.findIndex((r) => {
                    const val = r.columns[label];
                    if (!val) return false;
                    const list = Array.isArray(val) ? val : [val];
                    return list.some(
                      (v) => v.toLowerCase() === item.toLowerCase(),
                    );
                  });
                  const isNew = introducedAt === rarityIndex;

                  return (
                    <li
                      key={item}
                      className="flex items-start gap-1.5 leading-relaxed"
                    >
                      <span className="shrink-0">•</span>
                      <span className={isNew ? "text-foreground" : undefined}>
                        {item}
                      </span>
                      {introducedAt >= 0 && (
                        <RarityDot
                          rarity={weapon.rarityRows[introducedAt]?.rarity ?? ""}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {(baseFeatures.length > 0 || hasChainFeatures) && (
        <>
          <Separator className="my-3" />

          {baseFeatures.length > 0 && (
            <>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-violet-400">
                Base Features
              </h3>
              <div className="mb-3 space-y-2">
                {baseFeatures.map((feat) => (
                  <ExpandableFeatureRow
                    key={feat.name}
                    name={feat.name}
                    paragraphs={feat.paragraphs}
                    isExpanded={expanded.has(feat.name.toLowerCase())}
                    onToggle={() => toggleFeature(feat.name)}
                    className="text-xs text-foreground"
                    nameClassName="font-semibold"
                  />
                ))}
              </div>
            </>
          )}

          {hasChainFeatures &&
            visibleCols.map(({ label, chains }) => (
              <div key={label} className="mb-3">
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  {visibleCols.length > 1 ? label : "Rarity Features"}
                </h3>
                <div className="space-y-2">
                  {chains.map((chain) => {
                    const visible = chain.features.filter(
                      (f) => f.rarityIndex <= rarityIndex,
                    );
                    return visible.map((feat, fi) => {
                      const isUpgrade = fi > 0;
                      const feature = featuresMap.get(feat.name.toLowerCase());

                      return (
                        <ExpandableFeatureRow
                          key={`${feat.name}-${feat.rarityIndex}`}
                          name={feat.name}
                          paragraphs={feature?.paragraphs ?? []}
                          isExpanded={expanded.has(feat.name.toLowerCase())}
                          onToggle={() => toggleFeature(feat.name)}
                          indent={isUpgrade}
                          className="text-xs text-foreground"
                          nameClassName="font-semibold"
                        />
                      );
                    });
                  })}
                </div>
              </div>
            ))}
        </>
      )}

      <RuneFeaturesSection runes={runes} effectKind="weapon" />
    </>
  );
}

export function WeaponLibraryDetail({
  equipped,
  gripContext,
  weaponProficiencies = [],
  showHomebrewDetails = true,
  sourceVariants,
  activeSourceId,
  onSourceChange,
  onModeChange,
}: WeaponLibraryDetailProps) {
  const bookNames = useBookSourceNames();
  const { weapon, useVersatile } = equipped;
  const isDndWeapon = weapon.contentSource === "dnd" || !showHomebrewDetails;
  const rarityIndex = useMemo(() => getRarityIndex(equipped), [equipped]);

  const gripModeDisabled = (mode: WeaponGripMode) =>
    gripContext ? isGripModeBlockedByOccupiedHand(mode, gripContext) : false;
  const gripModeDisabledHint = (mode: WeaponGripMode) =>
    gripContext ? getGripModeOccupiedHandHint(mode, gripContext) : undefined;

  const activeDamage = getActiveWeaponDamage(equipped);
  const damageModeLabel = getActiveWeaponDamageLabel(equipped);
  const damageTypeLabel = DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType;
  const activeGripMode = getActiveWeaponGripMode(equipped);
  const showModeToggle = onModeChange && hasWeaponGripModes(weapon);
  const showIntegratedShield = activeGripMode?.hasShield ?? false;

  if (isDndWeapon) {
    return (
      <Accordion type="single" collapsible defaultValue="weapon-details">
        <AccordionItem value="weapon-details" className="border-0">
          <AccordionTrigger className="gap-1.5 py-2 text-xs font-medium hover:no-underline">
            <span className="flex min-w-0 items-center gap-1.5 text-violet-400">
              <Sword className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{weapon.name}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-1 pt-0">
            {sourceVariants && onSourceChange && (
              <div className="mb-3">
                <SourceVariantSwitcher
                  variants={sourceVariants}
                  activeId={activeSourceId ?? weapon.id}
                  onSelect={onSourceChange}
                  bookNames={bookNames}
                  accent="sky"
                />
              </div>
            )}

            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {weapon.weaponCategory && (
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {weapon.weaponCategory}
                </Badge>
              )}
              {weapon.properties.map((prop) => (
                <Badge key={prop} variant="outline" className="text-[10px]">
                  {PROPERTY_LABELS[prop] ?? prop}
                </Badge>
              ))}
              {!(sourceVariants && onSourceChange) && (
                <span className="text-[10px] text-muted-foreground">
                  {weapon.source}
                  {weapon.page !== undefined ? ` p.${weapon.page}` : ""}
                </span>
              )}
            </div>

            {showModeToggle && (
              <WeaponModeToggle
                weapon={weapon}
                useSecondaryMode={useVersatile}
                onChange={onModeChange}
                className="mb-3"
                isModeDisabled={gripModeDisabled}
                getModeDisabledHint={gripModeDisabledHint}
              />
            )}

            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
              <StatBox
                label={
                  damageModeLabel === "Damage"
                    ? "Damage"
                    : `Damage (${damageModeLabel})`
                }
                value={`${activeDamage} ${damageTypeLabel}`}
              />
              <StatBox label="Weight" value={`${weapon.weight} lb`} />
              <StatBox
                label="Value"
                value={formatWeaponValue(weapon.valueCp)}
              />
              {weapon.range && <StatBox label="Range" value={weapon.range} />}
            </div>

            {weapon.description && (
              <div className="text-xs text-muted-foreground">
                <DndRichText text={weapon.description} />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  const row = weapon.rarityRows[rarityIndex];
  const simpleModeLabel = getWeaponEffectiveTierLabel(
    weapon.name,
    weaponProficiencies,
  );
  const { rarity } = equipped;

  if (!row) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        No rarity data available for this weapon
      </p>
    );
  }

  const { bonus, otherStats } = getRaritySlideStatEntries(row);
  const shieldAc = showIntegratedShield
    ? getWeaponShieldAcBonusAtIndex(weapon, rarityIndex)
    : null;

  return (
    <Accordion type="single" collapsible defaultValue="weapon-details">
      <AccordionItem value="weapon-details" className="border-0">
        <AccordionTrigger className="gap-1.5 py-2 text-xs font-medium hover:no-underline">
          <span className="flex min-w-0 items-center gap-1.5 text-violet-400">
            <Sword className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{weapon.name}</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-1 pt-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {rarity}
            </Badge>
            {weapon.properties.map((prop) => (
              <Badge key={prop} variant="outline" className="text-[10px]">
                {PROPERTY_LABELS[prop] ?? prop}
              </Badge>
            ))}
            {weapon.isFocus && (
              <Badge
                variant="outline"
                className="text-[10px] text-violet-300 border-violet-700/50"
              >
                Focus
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">
              {weapon.source}
              {weapon.page !== undefined ? ` p.${weapon.page}` : ""}
            </span>
          </div>

          {weapon.description && (
            <p className="mb-3 border-l-2 border-violet-800/40 pl-2 text-xs italic leading-relaxed text-muted-foreground">
              <DndRichText text={weapon.description} />
            </p>
          )}

          <WeaponProficiencyInfo
            weaponName={weapon.name}
            compact
            className="mb-3"
          />
          {simpleModeLabel && (
            <p className="mb-3 rounded-md border border-amber-700/40 bg-amber-950/20 px-2.5 py-2 text-[11px] leading-relaxed text-amber-100/90">
              This weapon is treated as a <strong>Simple</strong> weapon for
              your class because you only have Simple weapon proficiency.
            </p>
          )}

          {showModeToggle && (
            <WeaponModeToggle
              weapon={weapon}
              useSecondaryMode={useVersatile}
              onChange={onModeChange}
              className="mb-3"
              isModeDisabled={gripModeDisabled}
              getModeDisabledHint={gripModeDisabledHint}
            />
          )}

          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <StatBox
              label={
                damageModeLabel === "Damage"
                  ? "Damage"
                  : `Damage (${damageModeLabel})`
              }
              value={`${activeDamage} ${damageTypeLabel}`}
            />
            {bonus && (
              <StatBox label="Attack Bonus" value={`${bonus} to hit`} />
            )}
            <StatBox
              label="Rune Slots"
              value={`${row.slots} slot${row.slots !== 1 ? "s" : ""}`}
            />
            <StatBox label="Weight" value={`${weapon.weight} lb`} />
            <StatBox label="Value" value={formatWeaponValue(weapon.valueCp)} />
            {weapon.range && <StatBox label="Range" value={weapon.range} />}
            {otherStats.map(([label, value]) => (
              <StatBox key={label} label={label} value={value} />
            ))}
            {shieldAc !== null && (
              <StatBox label="Integrated Shield" value={`+${shieldAc} CA`} />
            )}
          </div>

          {activeGripMode && (
            <div className="mb-3 rounded-md border border-border/60 bg-muted/10 px-2 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Active grip
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-foreground">
                {activeGripMode.label} · {activeDamage} {damageTypeLabel}
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                {getWeaponGripModeHint(activeGripMode)}
              </p>
            </div>
          )}

          {showIntegratedShield && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-teal-800/40 bg-teal-950/20 px-2 py-2">
              <Shield className="h-3.5 w-3.5 shrink-0 text-teal-400 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-teal-100/90">
                {activeGripMode
                  ? `In ${activeGripMode.label} mode, the integrated shield occupies the off-hand.`
                  : "Includes an integrated shield that occupies the off-hand."}
              </p>
            </div>
          )}

          {weapon.supplementaryNotes.length > 0 && (
            <div className="mb-3 space-y-1">
              {weapon.supplementaryNotes.map((note, i) => (
                <p
                  key={i}
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  {note}
                </p>
              ))}
            </div>
          )}

          <WeaponFeatureSection
            weapon={weapon}
            rarityIndex={rarityIndex}
            runes={equipped.runes}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
