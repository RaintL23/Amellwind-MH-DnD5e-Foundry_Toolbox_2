import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { ActionLocks } from "../utils/condition-effects.data";
import type {
  PlayActivationBucket,
  PlayAttack,
  PlayCharacterCompiled,
  PlayFeature,
  PlayInventoryItem,
  PlaySessionState,
  PlaySpell,
  PlaySpellcasting,
} from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";
import type { useSheetRoller } from "../hooks/useSheetRoller";
import type { ConfirmDialogFn } from "../hooks/useConfirmDialog";
import { rollExpression } from "@/shared/utils/dice.utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { spellHasAttackRoll } from "../utils/spell-attack.utils";
import {
  healingExpressionFromPotionName,
  isPotionItem,
} from "../utils/inventory-item.utils";
import {
  spellLevelLabel,
  toDescriptionLines,
} from "../utils/description-lines.utils";
import { DescriptionLines } from "@/shared/components/DescriptionLines";

const BUCKETS: {
  key: PlayActivationBucket;
  label: string;
  lockKey: keyof ActionLocks | null;
}[] = [
  { key: "action", label: "Actions", lockKey: "actions" },
  { key: "bonus", label: "Bonus Actions", lockKey: "bonusActions" },
  { key: "reaction", label: "Reactions", lockKey: "reactions" },
  { key: "other", label: "Other", lockKey: null },
];

const FREE_ACTIONS_BLURB =
  "Some things cost no Action, Bonus Action, or Reaction. On your turn you can usually communicate briefly, drop a held item, or take one free object interaction (draw/sheathe a weapon, open a door, pick something up). Features that say they require no action work the same way — ask your DM when unsure.";

const BONUS_MAGIC_ACTION: PlayFeature = {
  id: "std-magic-bonus",
  name: "Magic Action",
  sourceKind: "standard",
  sourceLabel: "Standard",
  description:
    "Cast a spell with a casting time of a Bonus Action (XPHB). This uses your Bonus Action.",
  activation: "bonus",
  bucket: "bonus",
};

const LIGHT_BONUS_ATTACK_NOTE =
  "Light bonus attack: damage does not add your ability modifier unless you have the Two-Weapon Fighting style (or a similar feature).";

export type ActionsPanelTab = "spells" | "inventory";

interface ActionsPanelProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  locks: ActionLocks;
  dispatch: (a: PlaySessionAction) => void;
  rollD20Test: ReturnType<typeof useSheetRoller>["rollD20Test"];
  logRoll: ReturnType<typeof useSheetRoller>["logRoll"];
  confirm: ConfirmDialogFn;
  onOpenTab?: (tab: ActionsPanelTab) => void;
}

function featureBucket(
  f: PlayFeature,
  session: PlaySessionState,
): PlayActivationBucket {
  return session.featureOverrides[f.id]?.bucket ?? f.bucket;
}

function usesMax(f: PlayFeature, session: PlaySessionState): number {
  return session.featureOverrides[f.id]?.usesMax ?? f.uses?.max ?? 0;
}

function isStandardAttackAction(f: PlayFeature): boolean {
  return f.sourceKind === "standard" && f.name === "Attack";
}

function isMagicAction(f: PlayFeature): boolean {
  return (
    f.sourceKind === "standard" &&
    (f.name === "Magic Action" || f.name === "Magic")
  );
}

function isUtilizeAction(f: PlayFeature): boolean {
  return f.sourceKind === "standard" && f.name === "Utilize";
}

function isSpellReady(
  spell: PlaySpell,
  session: PlaySessionState,
  sc: PlaySpellcasting,
  bucket: PlayActivationBucket,
): boolean {
  if (spell.bucket !== bucket) return false;
  if (spell.level === 0 || spell.alwaysPrepared) return true;
  if (!sc.isPreparedCaster) return true;
  return session.preparedSpellIds.includes(spell.id);
}

function spellEconomyLocked(spell: PlaySpell, locks: ActionLocks): boolean {
  if (spell.bucket === "bonus") return locks.bonusActions;
  if (spell.bucket === "reaction") return locks.reactions;
  return locks.actions;
}

function magicActionItems(session: PlaySessionState): PlayInventoryItem[] {
  return session.inventory.filter(
    (i) =>
      i.quantity > 0 && (i.attuned || i.requiresAttunement) && !i.isWeapon,
  );
}

function utilizeItems(session: PlaySessionState): PlayInventoryItem[] {
  return session.inventory.filter((i) => {
    if (i.quantity <= 0 || i.isWeapon || i.attuned || i.requiresAttunement) {
      return false;
    }
    if (isPotionItem(i)) return false;
    return true;
  });
}

function potionItems(session: PlaySessionState): PlayInventoryItem[] {
  return session.inventory.filter(
    (i) => i.quantity > 0 && !i.isWeapon && isPotionItem(i),
  );
}

export function AttackRow({
  atk,
  locks,
  onAttack,
  onDamage,
  note,
}: {
  atk: PlayAttack;
  locks: ActionLocks;
  onAttack: (atk: PlayAttack) => void;
  onDamage: (atk: PlayAttack, critical?: boolean) => void;
  note?: string;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/30 p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{atk.name}</p>
          <p className="text-xs text-muted-foreground">
            {atk.attackBonus >= 0 ? "+" : ""}
            {atk.attackBonus} to hit ·{" "}
            {atk.damage.map((d) => d.expression).join(" / ")}
          </p>
          {note ? (
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
              {note}
            </p>
          ) : null}
        </div>
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="min-h-9"
            disabled={locks.attacks}
            onClick={() => onAttack(atk)}
          >
            Attack
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-9"
            onClick={() => onDamage(atk)}
          >
            Dmg
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-9"
            onClick={() => onDamage(atk, true)}
          >
            Crit
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeatureUses({
  featureId,
  max,
  spent,
  onSet,
}: {
  featureId: string;
  max: number;
  spent: number;
  onSet: (featureId: string, count: number, max: number) => void;
}) {
  if (max <= 0) return null;
  const left = max - spent;
  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          className={cn(
            "h-5 w-5 rounded-full border",
            i < left
              ? "bg-primary border-primary"
              : "border-muted-foreground/40",
          )}
          aria-label={`Set remaining uses to ${i < left ? i : i + 1}`}
          onClick={() => {
            // Filled = available: click sets remaining to i (spend) or i+1 (restore).
            const newLeft = i < left ? i : i + 1;
            onSet(featureId, max - newLeft, max);
          }}
        />
      ))}
    </div>
  );
}

function optionSuffix(count: number, singular: string, plural: string): string {
  if (count <= 0) return "";
  return ` · ${count} ${count === 1 ? singular : plural}`;
}

export function ActionsPanel({
  compiled,
  session,
  locks,
  dispatch,
  rollD20Test,
  logRoll,
  confirm,
  onOpenTab,
}: ActionsPanelProps) {
  const sc = compiled.spellcasting;

  const magicSpells =
    sc?.spells.filter((s) => isSpellReady(s, session, sc, "action")) ?? [];
  const bonusSpells =
    sc?.spells.filter((s) => isSpellReady(s, session, sc, "bonus")) ?? [];
  const reactionSpells =
    sc?.spells.filter((s) => isSpellReady(s, session, sc, "reaction")) ?? [];
  const magicItems = magicActionItems(session);
  const utilizeList = utilizeItems(session);
  const bonusPotions = potionItems(session);

  const attacksFor = (bucket: "action" | "bonus"): PlayAttack[] => {
    if (bucket === "bonus") {
      // Only true Light off-hand / bonus attacks from compile — never dump every
      // equipped weapon here. Damage already omits ability mod at compile time.
      return compiled.attacks.filter((a) => a.bucket === "bonus");
    }

    const fromCompiled = compiled.attacks.filter((a) => a.bucket === "action");
    const compiledNames = new Set(
      fromCompiled.map((a) => a.name.trim().toLowerCase()),
    );
    const fromInventory = session.inventory
      .filter((i) => i.equipped && i.isWeapon && i.attackBonus != null)
      .filter((i) => !compiledNames.has(i.name.trim().toLowerCase()))
      .map((i) => ({
        id: `inv-atk-${i.id}`,
        name: i.name,
        attackBonus: i.attackBonus ?? 0,
        damage: [{ expression: i.damageExpression ?? "1d4" }],
        properties: i.properties ?? [],
        critRange: 20,
        bucket: "action" as const,
        sourceKind: "item" as const,
      }));
    return [...fromCompiled, ...fromInventory];
  };

  const quickAttacks = attacksFor("action");

  const rollAttack = (atk: PlayAttack) => {
    if (locks.attacks) return;
    void rollD20Test({
      label: `${atk.name} Attack`,
      modifier: atk.attackBonus,
      kind: "attack",
      locks,
    });
  };

  const rollDamage = (atk: PlayAttack, critical = false) => {
    const expr = atk.damage[0]?.expression ?? "1d4";
    const result = rollExpression(expr, { critical });
    logRoll({
      label: `${atk.name} Damage${critical ? " (crit)" : ""}`,
      expression: expr,
      total: result.total,
      detail: result.detail,
      mode: "normal",
    });
  };

  const spendSlotForSpell = (spell: PlaySpell) => {
    if (!sc || spell.level <= 0 || spell.isRitual) return true;
    const slotLevel = sc.isPactMagic
      ? sc.pact?.level ?? spell.level
      : Math.max(spell.level, 1);
    if (sc.isPactMagic && sc.pact) {
      if (session.pactSpent >= sc.pact.max) return false;
      dispatch({ type: "SPEND_PACT", max: sc.pact.max });
      return true;
    }
    const max = sc.slotMax[slotLevel] ?? 0;
    const spent = session.slotsSpent[slotLevel] ?? 0;
    if (spent >= max) return false;
    dispatch({ type: "SPEND_SLOT", level: slotLevel, max });
    return true;
  };

  const castSpell = (spell: PlaySpell) => {
    if (!sc || spellEconomyLocked(spell, locks)) return;
    void (async () => {
      if (spell.isConcentration) {
        if (session.concentration && session.concentration !== spell.name) {
          const ok = await confirm({
            title: "Break concentration?",
            description: `Cast ${spell.name} and break concentration on ${session.concentration}?`,
            confirmLabel: "Cast",
          });
          if (!ok) return;
        }
      }
      if (!spendSlotForSpell(spell)) return;
      if (spell.isConcentration) {
        dispatch({ type: "SET_CONCENTRATION", spellName: spell.name });
      }

      if (spellHasAttackRoll(spell)) {
        await rollD20Test({
          label: `Cast ${spell.name}`,
          modifier: sc.attackBonus,
          kind: "attack",
          locks,
        });
      } else {
        logRoll({
          label: `Cast ${spell.name}`,
          expression: "—",
          total: 0,
          detail: `Cast (DC ${sc.saveDc})`,
          mode: "normal",
        });
      }
    })();
  };

  const logItemUse = (item: PlayInventoryItem, via: "magic" | "utilize") => {
    if (locks.actions) return;
    logRoll({
      label: `${via === "magic" ? "Magic item" : "Utilize"}: ${item.name}`,
      expression: "—",
      total: 0,
      detail:
        item.notes?.trim() ||
        "Object used — adjust quantity in Inventory if it was consumed",
      mode: "normal",
    });
  };

  const consumeInventoryItem = (item: PlayInventoryItem) => {
    if (item.quantity <= 1) {
      dispatch({ type: "REMOVE_ITEM", id: item.id });
      return;
    }
    dispatch({
      type: "UPSERT_ITEM",
      item: { ...item, quantity: item.quantity - 1 },
    });
  };

  const drinkPotion = (item: PlayInventoryItem) => {
    if (locks.bonusActions) return;
    const healExpr = healingExpressionFromPotionName(item.name);
    if (healExpr) {
      const result = rollExpression(healExpr);
      dispatch({ type: "SET_HP_DELTA", delta: result.total });
      logRoll({
        label: `Drink ${item.name}`,
        expression: healExpr,
        total: result.total,
        detail: `${result.detail} HP restored`,
        mode: "normal",
      });
    } else {
      logRoll({
        label: `Drink ${item.name}`,
        expression: "—",
        total: 0,
        detail:
          item.notes?.trim() ||
          item.summary?.trim() ||
          "Potion consumed — apply effects manually if needed",
        mode: "normal",
      });
    }
    consumeInventoryItem(item);
  };

  const setUsesSpent = (featureId: string, count: number, max: number) => {
    dispatch({ type: "CLEAR_FEATURE_USE", featureId });
    for (let j = 0; j < count && j < max; j++) {
      dispatch({ type: "SPEND_FEATURE_USE", featureId, max });
    }
  };

  const featureOptionHint = (f: PlayFeature): string => {
    if (isStandardAttackAction(f)) {
      const n = attacksFor("action").length;
      return optionSuffix(n, "option", "options");
    }
    if (isMagicAction(f)) {
      if (f.bucket === "bonus") {
        return optionSuffix(bonusSpells.length, "option", "options");
      }
      const n = magicSpells.length + magicItems.length;
      return optionSuffix(n, "option", "options");
    }
    if (isUtilizeAction(f)) {
      return optionSuffix(utilizeList.length, "item", "items");
    }
    return "";
  };

  const bucketSections = BUCKETS.map(({ key, label, lockKey }) => {
    const locked = lockKey ? Boolean(locks[lockKey]) : false;
    let feats = compiled.features
      .filter((f) => featureBucket(f, session) === key)
      .map((f) =>
        isMagicAction(f) && f.name === "Magic"
          ? { ...f, name: "Magic Action" }
          : f,
      )
      .filter((f) => {
        if (isMagicAction(f)) {
          return magicSpells.length + magicItems.length > 0;
        }
        if (isUtilizeAction(f)) {
          return utilizeList.length > 0;
        }
        return true;
      });

    // Bonus-action spells spend the Magic Action economy — nest under a host.
    if (key === "bonus" && bonusSpells.length > 0) {
      feats = [BONUS_MAGIC_ACTION, ...feats.filter((f) => !isMagicAction(f))];
    }

    const atks = key === "action" || key === "bonus" ? attacksFor(key) : [];
    const attackHost = feats.find(isStandardAttackAction);
    const nestedUnderAttack =
      key === "action" && attackHost != null ? atks : [];
    const topLevelAttacks = nestedUnderAttack.length > 0 ? [] : atks;
    // Reaction spells stay top-level; bonus spells nest under Magic Action.
    const bucketSpells = key === "reaction" ? reactionSpells : [];
    const bucketPotions = key === "bonus" ? bonusPotions : [];
    const itemCount =
      feats.length +
      topLevelAttacks.length +
      bucketSpells.length +
      bucketPotions.length;
    return {
      key,
      label,
      locked,
      feats,
      topLevelAttacks,
      nestedUnderAttack,
      bucketSpells,
      bucketPotions,
      itemCount,
    };
  }).filter((s) => s.itemCount > 0);

  return (
    <div className="space-y-3">
      {locks.reasons.length > 0 ? (
        <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{locks.reasons.slice(0, 4).join(" · ")}</span>
        </div>
      ) : null}

      {quickAttacks.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Quick attacks</h3>
          <div className="space-y-2">
            {quickAttacks.map((atk) => (
              <AttackRow
                key={atk.id}
                atk={atk}
                locks={locks}
                onAttack={rollAttack}
                onDamage={rollDamage}
              />
            ))}
          </div>
        </section>
      ) : null}

      <Accordion
        type="multiple"
        defaultValue={["action"]}
        className="space-y-2"
      >
        {bucketSections.map(
          ({
            key,
            label,
            locked,
            feats,
            topLevelAttacks,
            nestedUnderAttack,
            bucketSpells,
            bucketPotions,
            itemCount,
          }) => (
            <Card
              key={key}
              className={cn(
                "overflow-hidden shadow-none",
                locked && "opacity-50",
              )}
            >
              <AccordionItem value={key} className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-left">
                    <span className="font-semibold">{label}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {itemCount}
                    </Badge>
                    {locked ? (
                      <Badge variant="outline" className="text-[10px]">
                        Unavailable
                      </Badge>
                    ) : null}
                  </span>
                </AccordionTrigger>
                <AccordionContent
                  className={cn(
                    "space-y-2 px-3 pb-3",
                    locked && "pointer-events-none",
                  )}
                >
                  <Accordion type="multiple" className="space-y-1.5">
                    {topLevelAttacks.map((atk) => (
                      <AttackRow
                        key={atk.id}
                        atk={atk}
                        locks={locks}
                        onAttack={rollAttack}
                        onDamage={rollDamage}
                        note={
                          key === "bonus" ? LIGHT_BONUS_ATTACK_NOTE : undefined
                        }
                      />
                    ))}
                    {feats.map((f) => {
                      const max = usesMax(f, session);
                      const spent = session.featureUsesSpent[f.id] ?? 0;
                      const nestedAttacks =
                        isStandardAttackAction(f) && key === "action"
                          ? nestedUnderAttack
                          : [];
                      const showMagic =
                        isMagicAction(f) &&
                        (key === "action" || key === "bonus");
                      const showUtilize =
                        isUtilizeAction(f) && key === "action";
                      const hint = featureOptionHint(f);

                      return (
                        <div
                          key={f.id}
                          className="overflow-hidden rounded-md border border-border/70 bg-muted/15"
                        >
                          <AccordionItem value={f.id} className="border-0">
                            <AccordionTrigger className="gap-2 px-3 py-2.5 hover:no-underline">
                              <span className="flex min-w-0 flex-1 items-start justify-between gap-2 text-left">
                                <span className="min-w-0">
                                  <span className="flex flex-wrap items-center gap-1.5">
                                    <span className="block text-sm font-medium">
                                      {f.name}
                                    </span>
                                    {f.sourceKind !== "standard" ? (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] font-normal"
                                      >
                                        Feature
                                        {f.activation
                                          ? ` · ${f.activation}`
                                          : ""}
                                      </Badge>
                                    ) : null}
                                  </span>
                                  <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                                    {f.sourceLabel}
                                    {hint}
                                  </span>
                                </span>
                                <FeatureUses
                                  featureId={f.id}
                                  max={max}
                                  spent={spent}
                                  onSet={setUsesSpent}
                                />
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 px-3 pb-2.5">
                              {f.description ? (
                                <DescriptionLines
                                  lines={toDescriptionLines(f.description)}
                                  sizeClass="text-xs"
                                />
                              ) : null}

                              {nestedAttacks.length > 0 ? (
                                <div className="space-y-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Choose an attack
                                  </p>
                                  {nestedAttacks.map((atk) => (
                                    <AttackRow
                                      key={atk.id}
                                      atk={atk}
                                      locks={locks}
                                      onAttack={rollAttack}
                                      onDamage={rollDamage}
                                    />
                                  ))}
                                </div>
                              ) : null}

                              {showMagic && key === "action" ? (
                                <MagicUtilizeBlock
                                  title="Spells & magic items"
                                  empty={
                                    magicSpells.length === 0 &&
                                    magicItems.length === 0
                                      ? sc
                                        ? "No action spells prepared and no attuned magic items."
                                        : "No attuned magic items."
                                      : null
                                  }
                                  openLabel={sc ? "Open Spells" : null}
                                  onOpen={() => onOpenTab?.("spells")}
                                >
                                  {magicSpells.map((spell) => (
                                    <SpellMiniRow
                                      key={spell.id}
                                      spell={spell}
                                      locked={spellEconomyLocked(spell, locks)}
                                      onCast={() => castSpell(spell)}
                                    />
                                  ))}
                                  {magicItems.map((item) => (
                                    <ItemMiniRow
                                      key={item.id}
                                      title={item.name}
                                      subtitle={`Magic item · ×${item.quantity}${item.attuned ? " · Attuned" : ""}`}
                                      disabled={locks.actions}
                                      actionLabel="Use"
                                      onAction={() =>
                                        logItemUse(item, "magic")
                                      }
                                    />
                                  ))}
                                </MagicUtilizeBlock>
                              ) : null}

                              {showMagic && key === "bonus" ? (
                                <MagicUtilizeBlock
                                  title="Bonus Action spells"
                                  empty={
                                    bonusSpells.length === 0
                                      ? "No Bonus Action spells prepared."
                                      : null
                                  }
                                  openLabel={sc ? "Open Spells" : null}
                                  onOpen={() => onOpenTab?.("spells")}
                                >
                                  {bonusSpells.map((spell) => (
                                    <SpellMiniRow
                                      key={spell.id}
                                      spell={spell}
                                      locked={spellEconomyLocked(spell, locks)}
                                      onCast={() => castSpell(spell)}
                                    />
                                  ))}
                                </MagicUtilizeBlock>
                              ) : null}

                              {showUtilize ? (
                                <MagicUtilizeBlock
                                  title="Usable items"
                                  empty={
                                    utilizeList.length === 0
                                      ? "No nonmagical items in inventory to Utilize."
                                      : null
                                  }
                                  openLabel="Open Inventory"
                                  onOpen={() => onOpenTab?.("inventory")}
                                >
                                  {utilizeList.map((item) => (
                                    <ItemMiniRow
                                      key={item.id}
                                      title={item.name}
                                      subtitle={`×${item.quantity}${item.equipped ? " · Equipped" : ""}${item.notes ? ` · ${item.notes}` : ""}`}
                                      disabled={locks.actions}
                                      actionLabel="Use"
                                      onAction={() =>
                                        logItemUse(item, "utilize")
                                      }
                                    />
                                  ))}
                                </MagicUtilizeBlock>
                              ) : null}
                            </AccordionContent>
                          </AccordionItem>
                        </div>
                      );
                    })}
                    {bucketSpells.map((spell) => (
                      <div
                        key={spell.id}
                        className="overflow-hidden rounded-md border border-border/70 bg-muted/15"
                      >
                        <AccordionItem value={spell.id} className="border-0">
                          <AccordionTrigger className="gap-2 px-3 py-2.5 hover:no-underline">
                            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                              <span className="text-sm font-medium">
                                {spell.name}
                              </span>
                              <span className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                                Spell · {spellLevelLabel(spell.level)}
                                {spell.castingTime
                                  ? ` · ${spell.castingTime}`
                                  : ""}
                              </span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 px-3 pb-2.5">
                            {spell.description ? (
                              <DescriptionLines
                                lines={toDescriptionLines(spell.description)}
                                sizeClass="text-xs"
                              />
                            ) : null}
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                className="min-h-9"
                                disabled={spellEconomyLocked(spell, locks)}
                                onClick={() => castSpell(spell)}
                              >
                                Cast
                              </Button>
                              {onOpenTab && sc ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="min-h-9"
                                  onClick={() => onOpenTab("spells")}
                                >
                                  Open Spells
                                </Button>
                              ) : null}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </div>
                    ))}
                    {bucketPotions.map((item) => {
                      const healExpr = healingExpressionFromPotionName(
                        item.name,
                      );
                      return (
                        <div
                          key={item.id}
                          className="overflow-hidden rounded-md border border-border/70 bg-muted/15"
                        >
                          <AccordionItem
                            value={`potion-${item.id}`}
                            className="border-0"
                          >
                            <AccordionTrigger className="gap-2 px-3 py-2.5 hover:no-underline">
                              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                                <span className="text-sm font-medium">
                                  {item.name}
                                </span>
                                <span className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                                  Potion · ×{item.quantity}
                                  {healExpr ? ` · ${healExpr}` : ""}
                                </span>
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 px-3 pb-2.5">
                              <div className="flex flex-wrap gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="min-h-9"
                                  disabled={locks.bonusActions}
                                  onClick={() => drinkPotion(item)}
                                >
                                  Drink
                                </Button>
                                {onOpenTab ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="min-h-9"
                                    onClick={() => onOpenTab("inventory")}
                                  >
                                    Open Inventory
                                  </Button>
                                ) : null}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </div>
                      );
                    })}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            </Card>
          ),
        )}

        <Card className="overflow-hidden shadow-none">
          <AccordionItem value="free-actions" className="border-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="flex items-center gap-2 text-left">
                <span className="font-semibold">Free Actions</span>
                <Badge variant="secondary" className="text-[10px]">
                  Info
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {FREE_ACTIONS_BLURB}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Card>
      </Accordion>
    </div>
  );
}

function MagicUtilizeBlock({
  title,
  empty,
  openLabel,
  onOpen,
  children,
}: {
  title: string;
  empty: string | null;
  openLabel: string | null;
  onOpen?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        {openLabel && onOpen ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-9"
            onClick={onOpen}
          >
            {openLabel}
          </Button>
        ) : null}
      </div>
      {children}
      {empty ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : null}
    </div>
  );
}

function SpellMiniRow({
  spell,
  locked,
  onCast,
}: {
  spell: PlaySpell;
  locked: boolean;
  onCast: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/30 p-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{spell.name}</p>
        <p className="text-xs text-muted-foreground">
          {spellLevelLabel(spell.level)}
          {spell.castingTime ? ` · ${spell.castingTime}` : ""}
          {spell.isConcentration ? " · C" : ""}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        className="min-h-9"
        disabled={locked}
        onClick={onCast}
      >
        Cast
      </Button>
    </div>
  );
}

function ItemMiniRow({
  title,
  subtitle,
  disabled,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  disabled: boolean;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/30 p-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="min-h-9"
        disabled={disabled}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
