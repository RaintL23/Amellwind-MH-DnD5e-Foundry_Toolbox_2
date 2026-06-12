import { Link } from "react-router-dom";
import { Check, Package, Scale, Trash2, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArmorItem, CartEntry, Weapon } from "@/shared/types";
import { formatTotalGp, parseCostGp } from "@/features/shops/utils/cost.utils";
import {
  blocksOffHand,
  canEquipInOffHand,
} from "@/features/weapons/utils/weapon-hands.utils";
import { hasActiveIntegratedShield } from "@/features/weapons/utils/shield.utils";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useBuilderInventory } from "../../context/BuilderInventoryContext";
import {
  findArmorByCartName,
  findShieldByCartName,
  findWeaponByCartName,
  type CartItemKind,
} from "../../utils/cart-equipment.resolver";
import type { StandaloneShieldItem } from "../../data/shield.data";
import {
  formatCarryingCapacityCalcTooltip,
  formatCarryingCapacityRuleTooltip,
  getCarryingCapacity,
  normalizeBuilderCreatureSize,
} from "../../utils/carrying-capacity.utils";
import {
  formatInventoryWeightTooltip,
  formatWeightLb,
  sumInventoryWeightLb,
} from "../../utils/inventory-weight.utils";
import {
  buildTrinketInventoryBundle,
  buildWeaponInventoryBundle,
  isDefaultAmmoEntry,
  isIntegratedShieldEntry,
  isTrinketEntry,
} from "../../utils/equipment-inventory.utils";

const KIND_LABELS: Record<CartItemKind, string> = {
  weapon: "Weapon",
  armor: "Armor",
  trinket: "Trinket",
  other: "Other",
};

const KIND_ORDER: CartItemKind[] = ["weapon", "armor", "trinket", "other"];

type WeaponEquippedSlot = "mainHand" | "offHand";
type TrinketEquippedSlot = "trinket1" | "trinket2";

function TooltipValue({
  value,
  ruleTooltip,
  calcTooltip,
  className,
}: {
  value: string;
  ruleTooltip?: string;
  calcTooltip?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("group relative cursor-help", className)}
      title={ruleTooltip}
    >
      {value}
      {ruleTooltip && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-md border border-border bg-popover px-2 py-1.5 text-left text-[10px] leading-relaxed text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 whitespace-pre-line"
        >
          {ruleTooltip}
          {calcTooltip ? `\n\n${calcTooltip}` : ""}
        </span>
      )}
    </span>
  );
}

export function BuilderInventoryPanel() {
  const {
    items,
    totalItems,
    isSyncing,
    getEntryKind,
    removeFromInventory,
    removeWeaponInventoryBundle,
    addEquipmentBundle,
    clearInventory,
    weapons: weaponCatalog,
  } = useBuilderInventory();
  const {
    character,
    mainHand,
    offHand,
    armor,
    equipWeapon,
    unequipWeapon,
    equipArmor,
    unequipArmor,
    equippedShield,
    equipShield,
    unequipShield,
    trinket1,
    trinket2,
    equipTrinket,
    unequipTrinket,
    clearEquipment,
  } = useCharacterBuilder();

  const equippedArmorName = armor?.armor.name ?? null;
  const equippedShieldName = equippedShield?.name ?? null;
  const carriedWeight = sumInventoryWeightLb(items);
  const creatureSize = normalizeBuilderCreatureSize(character.size);
  const capacity = getCarryingCapacity(character.abilities.str, creatureSize);
  const isOverCapacity = carriedWeight > capacity.carryLb;
  const weightTooltip = formatInventoryWeightTooltip(items);
  const capacityRuleTooltip = formatCarryingCapacityRuleTooltip();
  const capacityCalcTooltip = formatCarryingCapacityCalcTooltip(
    character.abilities.str,
    creatureSize,
    capacity,
  );

  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    entries: items.filter((entry) => getEntryKind(entry) === kind),
  })).filter((group) => group.entries.length > 0);

  function getWeaponEquippedSlot(weaponName: string): WeaponEquippedSlot | null {
    if (mainHand?.weapon.name === weaponName) return "mainHand";
    if (offHand?.weapon.name === weaponName) return "offHand";
    return null;
  }

  function handleEquipWeapon(weapon: Weapon) {
    const currentSlot = getWeaponEquippedSlot(weapon.name);
    if (currentSlot) return;

    addEquipmentBundle(buildWeaponInventoryBundle(weapon));

    if (!mainHand) {
      equipWeapon("mainHand", weapon, "Common");
      return;
    }

    if (
      !offHand &&
      canEquipInOffHand(weapon) &&
      !hasActiveIntegratedShield(mainHand) &&
      !blocksOffHand(mainHand)
    ) {
      equipWeapon("offHand", weapon, "Common");
      return;
    }

    equipWeapon("mainHand", weapon, "Common");
  }

  function handleUnequipWeapon(weaponName: string) {
    const slot = getWeaponEquippedSlot(weaponName);
    if (slot) unequipWeapon(slot);
  }

  function getTrinketEquippedSlot(name: string): TrinketEquippedSlot | null {
    if (trinket1?.name === name) return "trinket1";
    if (trinket2?.name === name) return "trinket2";
    return null;
  }

  function handleEquipTrinket(name: string) {
    if (getTrinketEquippedSlot(name)) return;

    addEquipmentBundle(buildTrinketInventoryBundle(name));

    if (!trinket1) {
      equipTrinket("trinket1", name);
      return;
    }

    if (!trinket2) {
      equipTrinket("trinket2", name);
      return;
    }

    equipTrinket("trinket1", name);
  }

  function handleUnequipTrinket(name: string) {
    const slot = getTrinketEquippedSlot(name);
    if (slot) unequipTrinket(slot);
  }

  function handleEquipShield(shield: StandaloneShieldItem) {
    if (equippedShieldName === shield.name) return;
    equipShield(shield);
  }

  function handleUnequipShield() {
    unequipShield();
  }

  function handleClearInventory() {
    clearEquipment();
    clearInventory();
  }

  function handleRemove(entry: CartEntry, kind: CartItemKind) {
    const weapon =
      kind === "weapon"
        ? findWeaponByCartName(entry.name, weaponCatalog)
        : null;

    if (weapon) {
      handleUnequipWeapon(weapon.name);
      removeWeaponInventoryBundle(weapon.name);
      return;
    }

    if (kind === "armor" && equippedArmorName === entry.name) {
      unequipArmor();
    }

    if (kind === "armor" && equippedShieldName === entry.name) {
      handleUnequipShield();
    }

    if (kind === "trinket" || isTrinketEntry(entry)) {
      handleUnequipTrinket(entry.name);
    }

    removeFromInventory(entry.name);
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <Accordion type="single" collapsible>
        <AccordionItem value="inventory" className="border-0">
          <AccordionTrigger className="gap-1.5 px-3.5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:no-underline">
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">Inventory</span>
              {totalItems > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-primary">
                  {totalItems}
                </span>
              )}
            </span>
            {items.length > 0 && (
              <span
                className="flex shrink-0 items-center gap-1 text-[10px] font-medium normal-case tracking-normal"
                onClick={(event) => event.stopPropagation()}
              >
                <Scale className="h-3 w-3" aria-hidden />
                <TooltipValue
                  value={formatWeightLb(carriedWeight)}
                  ruleTooltip={weightTooltip}
                  className={cn(
                    isOverCapacity ? "text-destructive" : "text-foreground",
                  )}
                />
                <span className="text-muted-foreground">/</span>
                <TooltipValue
                  value={formatWeightLb(capacity.carryLb)}
                  ruleTooltip={capacityRuleTooltip}
                  calcTooltip={capacityCalcTooltip}
                  className="text-muted-foreground"
                />
              </span>
            )}
          </AccordionTrigger>
          <AccordionContent className="px-3.5 pb-3.5">
            {isSyncing ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Loading inventory…
              </p>
            ) : items.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  The inventory is empty. Add items from{" "}
                  <Link
                    to="/shops"
                    className="font-medium text-primary hover:underline"
                  >
                    Shops
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/items"
                    className="font-medium text-primary hover:underline"
                  >
                    Items
                  </Link>{" "}
                  and press <kbd className="text-[10px] font-medium">Buy</kbd>,
                  or equip gear from the paper doll.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {isOverCapacity && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-[10px] leading-relaxed text-destructive">
                    Carried weight exceeds your carrying capacity (
                    {formatWeightLb(capacity.carryLb)}). While dragging,
                    lifting, or pushing excess weight, Speed is limited to 5
                    feet.
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleClearInventory}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Clear inventory
                </button>
                {grouped.map(({ kind, entries }) => (
                  <div key={kind}>
                    <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {KIND_LABELS[kind]}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {entries.map((entry) => (
                        <InventoryRow
                          key={entry.startingEquipmentId ?? entry.name}
                          entry={entry}
                          kind={kind}
                          weaponCatalog={weaponCatalog}
                          equippedArmorName={equippedArmorName}
                          equippedShieldName={equippedShieldName}
                          weaponSlot={getWeaponEquippedSlot(entry.name)}
                          trinketSlot={getTrinketEquippedSlot(entry.name)}
                          shieldParentEquipped={(() => {
                            if (
                              !isIntegratedShieldEntry(entry) ||
                              !entry.linkedWeaponName
                            ) {
                              return false;
                            }
                            const slot = getWeaponEquippedSlot(
                              entry.linkedWeaponName,
                            );
                            const equipped =
                              slot === "mainHand"
                                ? mainHand
                                : slot === "offHand"
                                  ? offHand
                                  : null;
                            return (
                              !!equipped &&
                              hasActiveIntegratedShield(equipped)
                            );
                          })()}
                          ammoParentEquipped={
                            isDefaultAmmoEntry(entry) &&
                            !!entry.linkedWeaponName &&
                            getWeaponEquippedSlot(entry.linkedWeaponName) !== null
                          }
                          onEquipWeapon={handleEquipWeapon}
                          onUnequipWeapon={handleUnequipWeapon}
                          onEquipArmor={equipArmor}
                          onUnequipArmor={unequipArmor}
                          onEquipShield={handleEquipShield}
                          onUnequipShield={handleUnequipShield}
                          onEquipTrinket={handleEquipTrinket}
                          onUnequipTrinket={handleUnequipTrinket}
                          onRemove={() => handleRemove(entry, kind)}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function InventoryRow({
  entry,
  kind,
  weaponCatalog,
  equippedArmorName,
  equippedShieldName,
  weaponSlot,
  trinketSlot,
  shieldParentEquipped,
  ammoParentEquipped,
  onEquipWeapon,
  onUnequipWeapon,
  onEquipArmor,
  onUnequipArmor,
  onEquipShield,
  onUnequipShield,
  onEquipTrinket,
  onUnequipTrinket,
  onRemove,
}: {
  entry: CartEntry;
  kind: CartItemKind;
  weaponCatalog: Weapon[];
  equippedArmorName: string | null;
  equippedShieldName: string | null;
  weaponSlot: WeaponEquippedSlot | null;
  trinketSlot: TrinketEquippedSlot | null;
  shieldParentEquipped: boolean;
  ammoParentEquipped: boolean;
  onEquipWeapon: (weapon: Weapon) => void;
  onUnequipWeapon: (weaponName: string) => void;
  onEquipArmor: (armor: ArmorItem) => void;
  onUnequipArmor: () => void;
  onEquipShield: (shield: StandaloneShieldItem) => void;
  onUnequipShield: () => void;
  onEquipTrinket: (name: string) => void;
  onUnequipTrinket: (name: string) => void;
  onRemove: () => void;
}) {
  const lineCost = parseCostGp(entry.cost) * entry.quantity;
  const shieldItem =
    kind === "armor" ? findShieldByCartName(entry.name) : null;
  const armorItem =
    kind === "armor" && !shieldItem ? findArmorByCartName(entry.name) : null;
  const weaponItem =
    kind === "weapon" ? findWeaponByCartName(entry.name, weaponCatalog) : null;
  const isTrinketItem = kind === "trinket" || isTrinketEntry(entry);
  const isArmorEquipped = !!armorItem && equippedArmorName === armorItem.name;
  const isShieldEquipped =
    !!shieldItem && equippedShieldName === shieldItem.name;
  const isWeaponEquipped = weaponSlot !== null;
  const isTrinketEquipped = trinketSlot !== null;
  const isCompanionEquipped = shieldParentEquipped || ammoParentEquipped;
  const isEquipped =
    isArmorEquipped ||
    isShieldEquipped ||
    isWeaponEquipped ||
    isTrinketEquipped ||
    isCompanionEquipped;
  const isCompanion =
    isIntegratedShieldEntry(entry) || isDefaultAmmoEntry(entry);

  const equippedLabel = (() => {
    if (isArmorEquipped) return "Equipped";
    if (isShieldEquipped) return "Equipped (Off)";
    if (weaponSlot === "mainHand") return "Equipped (Main)";
    if (weaponSlot === "offHand") return "Equipped (Off)";
    if (trinketSlot === "trinket1") return "Equipped (T1)";
    if (trinketSlot === "trinket2") return "Equipped (T2)";
    if (shieldParentEquipped) return "Active";
    if (ammoParentEquipped) return "In use";
    return "Equipped";
  })();

  function handleEquipToggle() {
    if (shieldItem) {
      if (isShieldEquipped) onUnequipShield();
      else onEquipShield(shieldItem);
      return;
    }

    if (armorItem) {
      if (isArmorEquipped) onUnequipArmor();
      else onEquipArmor(armorItem);
      return;
    }

    if (weaponItem) {
      if (isWeaponEquipped) onUnequipWeapon(weaponItem.name);
      else onEquipWeapon(weaponItem);
      return;
    }

    if (isTrinketItem) {
      if (isTrinketEquipped) onUnequipTrinket(entry.name);
      else onEquipTrinket(entry.name);
    }
  }

  return (
    <li className="flex items-start justify-between gap-2 rounded-md border border-border/50 bg-muted/20 px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {entry.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
          {entry.quantity > 1 && (
            <span className="font-medium text-foreground">
              ×{entry.quantity}
            </span>
          )}
          {entry.cost !== "—" && (
            <span className="text-primary">
              {entry.quantity > 1 && parseCostGp(entry.cost) > 0
                ? formatTotalGp(lineCost)
                : entry.cost}
            </span>
          )}
          {entry.weight && entry.weight !== "—" && <span>{entry.weight}</span>}
          {entry.linkedWeaponName && isCompanion && (
            <span className="italic opacity-70">
              for {entry.linkedWeaponName}
            </span>
          )}
          {kind === "other" && entry.shopName && !entry.linkedWeaponName && (
            <span className="italic opacity-70">{entry.shopName}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {(armorItem || shieldItem || weaponItem || isTrinketItem) && (
          <button
            type="button"
            onClick={handleEquipToggle}
            className={cn(
              "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              isEquipped
                ? "border-emerald-700/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50"
                : "border-sky-700/40 bg-sky-950/20 text-sky-200 hover:bg-sky-950/40",
            )}
            title={
              isEquipped
                ? `Unequip ${entry.name}`
                : `Equip ${entry.name}`
            }
          >
            {isEquipped ? (
              <>
                <Check className="h-3 w-3" aria-hidden />
                {equippedLabel}
              </>
            ) : (
              "Equip"
            )}
          </button>
        )}
        {isCompanion && isEquipped && entry.linkedWeaponName && (
          <button
            type="button"
            onClick={() => onUnequipWeapon(entry.linkedWeaponName!)}
            className="inline-flex items-center gap-1 rounded border border-emerald-700/40 bg-emerald-950/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 transition-colors hover:bg-emerald-950/50"
            title={`Unequip ${entry.linkedWeaponName}`}
          >
            <Check className="h-3 w-3" aria-hidden />
            {equippedLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Remove ${entry.name} from inventory`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
}
