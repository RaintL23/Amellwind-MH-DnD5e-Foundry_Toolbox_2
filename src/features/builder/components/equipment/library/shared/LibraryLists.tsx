import { Award, Gem, Shield, Shirt, Sword } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { resolveBookSourceName } from "@/features/spells/services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import {
  ArmorItem,
  DMG_TYPE_LABELS,
  PROPERTY_LABELS,
  Weapon,
} from "@/shared/types";
import { LibraryList } from "@/features/builder/components/shared/LibraryList";
import {
  getWeaponCategoryBadges,
  getWeaponProficiencyRule,
} from "@/features/weapons/data/weapon-proficiencies.data";
import { getWeaponEffectiveTierLabel } from "@/features/builder/utils/equipment-proficiency.utils";
import { CLOTHING_ARMOR } from "@/features/builder/data/armor.data";
import { ABILITY_SCORE_IMPROVEMENT } from "@/features/builder/utils/builder-class.utils";
import type { LibraryListOption } from "@/features/builder/utils/library-variant.utils";
import { formatVariantSourcesLabel } from "@/features/builder/utils/library-variant.utils";
import {
  EmptyState,
  ItemRow,
  LibraryItemBadge,
  LibraryItemBadgeRow,
  SectionLabel,
} from "./LibraryUi";

function buildLibrarySourceBadge(
  bookNames: ReturnType<typeof useBookSourceNames>,
  source?: string,
) {
  if (!source) return undefined;
  return {
    code: source,
    title: resolveBookSourceName(bookNames, source),
  };
}

function WeaponListBadges({
  weapon,
  weaponProficiencies,
}: {
  weapon: Weapon;
  weaponProficiencies: string[];
}) {
  const dmgLabel = DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType;
  const rule = getWeaponProficiencyRule(weapon.name);
  const simpleModeLabel = getWeaponEffectiveTierLabel(
    weapon.name,
    weaponProficiencies,
  );
  const categoryBadges = rule ? getWeaponCategoryBadges(rule) : [];

  return (
    <LibraryItemBadgeRow>
      <LibraryItemBadge>
        {weapon.dmg1} {dmgLabel}
      </LibraryItemBadge>
      {weapon.properties.map((prop) => (
        <LibraryItemBadge key={prop}>
          {PROPERTY_LABELS[prop] ?? prop}
        </LibraryItemBadge>
      ))}
      {categoryBadges.map((badge) => (
        <LibraryItemBadge key={badge} variant="category">
          {badge}
        </LibraryItemBadge>
      ))}
      {simpleModeLabel && (
        <span title="Your class only grants Simple weapon proficiency, so this martial-or-simple weapon counts as Simple.">
          <LibraryItemBadge variant="category">{simpleModeLabel}</LibraryItemBadge>
        </span>
      )}
    </LibraryItemBadgeRow>
  );
}

export function WeaponList({
  inventory,
  catalog,
  loading,
  equipped,
  weaponProficiencies,
  onSelect,
  getDisabledReason,
}: {
  inventory: Weapon[];
  catalog: Weapon[];
  loading: boolean;
  equipped: string | null;
  weaponProficiencies: string[];
  onSelect: (w: Weapon) => void;
  getDisabledReason?: (weapon: Weapon) => string | null;
}) {
  const bookNames = useBookSourceNames();

  if (loading) return <EmptyState text="Loading weapons..." />;
  if (inventory.length === 0 && catalog.length === 0) {
    return <EmptyState text="No weapons available." />;
  }

  function renderWeaponRow(w: Weapon, key: string, iconMuted: boolean) {
    const isEquipped = equipped === w.name;
    const disabledReason =
      !isEquipped && getDisabledReason ? getDisabledReason(w) : null;
    const rarityLabel =
      w.contentSource === "dnd" ? w.itemRarityLabel : undefined;
    const variantTrailing = w.variantSources?.length
      ? formatVariantSourcesLabel(w.variantSources)
      : null;

    return (
      <ItemRow
        key={key}
        icon={
          <Sword
            className={cn(
              "h-3.5 w-3.5",
              iconMuted ? "text-muted-foreground" : "text-primary",
            )}
          />
        }
        name={w.name}
        meta={
          <WeaponListBadges
            weapon={w}
            weaponProficiencies={weaponProficiencies}
          />
        }
        rarity={rarityLabel !== "Standard" ? rarityLabel : undefined}
        source={
          variantTrailing
            ? undefined
            : buildLibrarySourceBadge(bookNames, w.source)
        }
        trailing={variantTrailing?.label}
        trailingTitle={variantTrailing?.title}
        equipped={isEquipped}
        disabled={!!disabledReason}
        disabledHint={disabledReason ?? undefined}
        onClick={() => onSelect(w)}
      />
    );
  }

  return (
    <>
      {inventory.length > 0 && <SectionLabel>Inventory</SectionLabel>}
      {inventory.map((w) => renderWeaponRow(w, `inv-${w.name}`, false))}
      {catalog.map((w) => renderWeaponRow(w, w.name, true))}
    </>
  );
}

export function ArmorList({
  showCloth,
  inventory,
  catalog,
  equippedName,
  onSelect,
  getDisabledReason,
}: {
  showCloth: boolean;
  inventory: ArmorItem[];
  catalog: ArmorItem[];
  equippedName: string | null;
  onSelect: (a: ArmorItem) => void;
  getDisabledReason?: (armor: ArmorItem) => string | null;
}) {
  const bookNames = useBookSourceNames();

  function renderArmorRow(
    armorItem: ArmorItem,
    key: string,
    iconMuted: boolean,
  ) {
    const isEquipped = equippedName === armorItem.name;
    const disabledReason =
      !isEquipped && getDisabledReason
        ? getDisabledReason(armorItem)
        : null;

    return (
      <ItemRow
        key={key}
        icon={
          <Shield
            className={cn(
              "h-3.5 w-3.5",
              iconMuted ? "text-muted-foreground" : "text-primary",
            )}
          />
        }
        name={armorItem.name}
        meta={
          <LibraryItemBadgeRow>
            <LibraryItemBadge>CA {armorItem.baseAC}</LibraryItemBadge>
            <LibraryItemBadge>{armorItem.category}</LibraryItemBadge>
          </LibraryItemBadgeRow>
        }
        rarity={
          armorItem.itemRarityLabel !== "Standard"
            ? (armorItem.itemRarityLabel ?? armorItem.rarity)
            : armorItem.contentSource === "dnd"
              ? undefined
              : armorItem.rarity
        }
        source={buildLibrarySourceBadge(bookNames, armorItem.source)}
        equipped={isEquipped}
        disabled={!!disabledReason}
        disabledHint={disabledReason ?? undefined}
        onClick={() => onSelect(armorItem)}
      />
    );
  }

  return (
    <>
      {showCloth && (
        <>
          <SectionLabel>Clothing</SectionLabel>
          <ItemRow
            icon={<Shirt className="h-3.5 w-3.5 text-violet-400" />}
            name="Cloth"
            meta={
              <LibraryItemBadgeRow>
                <LibraryItemBadge>10 + DEX</LibraryItemBadge>
                <LibraryItemBadge>{CLOTHING_ARMOR.rarity}</LibraryItemBadge>
              </LibraryItemBadgeRow>
            }
            equipped={equippedName === CLOTHING_ARMOR.name}
            onClick={() => onSelect(CLOTHING_ARMOR)}
          />
        </>
      )}
      {inventory.length > 0 && <SectionLabel>Inventory</SectionLabel>}
      {inventory.map((a) => renderArmorRow(a, `inv-${a.name}`, false))}
      {catalog.map((a) => renderArmorRow(a, a.name, true))}
    </>
  );
}

export function TrinketList({
  inventory,
  catalog,
  equippedName,
  onSelect,
}: {
  inventory: string[];
  catalog: string[];
  equippedName: string | null;
  onSelect: (name: string) => void;
}) {
  if (inventory.length === 0 && catalog.length === 0) {
    return <EmptyState text="No trinkets available." />;
  }

  function renderTrinketRow(name: string, key: string, iconMuted: boolean) {
    return (
      <ItemRow
        key={key}
        icon={
          <Gem
            className={cn(
              "h-3.5 w-3.5",
              iconMuted ? "text-muted-foreground" : "text-primary",
            )}
          />
        }
        name={name}
        meta={
          <LibraryItemBadgeRow>
            <LibraryItemBadge>Placeholder</LibraryItemBadge>
          </LibraryItemBadgeRow>
        }
        equipped={equippedName === name}
        onClick={() => onSelect(name)}
      />
    );
  }

  return (
    <>
      {inventory.length > 0 && <SectionLabel>Inventory</SectionLabel>}
      {inventory.map((name) => renderTrinketRow(name, `inv-${name}`, false))}
      {catalog.map((name) => renderTrinketRow(name, name, true))}
    </>
  );
}

export function FeatList({
  options,
  selectedId,
  selectedName = null,
  onSelect,
}: {
  options: LibraryListOption[];
  selectedId: string | null;
  selectedName?: string | null;
  onSelect: (id: string, name: string) => void;
}) {
  if (options.length === 0) {
    return <EmptyState text="No feats available." />;
  }

  return (
    <LibraryList
      loading={false}
      options={options}
      selectedId={selectedId}
      selectedName={selectedName}
      icon={<Award className="h-3.5 w-3.5 text-rose-400" />}
      stats={(option) =>
        option.id === ABILITY_SCORE_IMPROVEMENT.id
          ? "Mejora 2 puntos de habilidad o elige un feat"
          : ""
      }
      onSelect={onSelect}
    />
  );
}
