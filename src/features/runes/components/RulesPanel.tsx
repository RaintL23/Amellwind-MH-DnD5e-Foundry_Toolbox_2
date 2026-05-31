import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, Sword, Gem, Info } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const RARITY_SLOTS = [
  { rarity: "Common", slots: 1 },
  { rarity: "Uncommon", slots: 2 },
  { rarity: "Rare", slots: 3 },
  { rarity: "Very Rare", slots: 4 },
  { rarity: "Legendary", slots: 5 },
];

/** Smithy upgrade (1 week). Common is the starting tier and is not listed in the table. */
const ARMOR_UPGRADE_COSTS = [
  { rarity: "Uncommon", resource: "Armor Sphere", amount: 5, cost: "500 gp" },
  { rarity: "Rare", resource: "Hard Armor Sphere", amount: 10, cost: "1,500 gp" },
  { rarity: "Very Rare", resource: "Heavy Armor Sphere", amount: 15, cost: "6,000 gp" },
  { rarity: "Legendary", resource: "Royal Armor Sphere", amount: 20, cost: "24,000 gp" },
] as const;

const WEAPON_UPGRADE_COSTS = [
  { rarity: "Uncommon", resource: "Earth Crystal", amount: 5, cost: "500 gp" },
  { rarity: "Rare", resource: "Machalite Ore", amount: 10, cost: "1,500 gp" },
  { rarity: "Very Rare", resource: "Dragonite Ore", amount: 15, cost: "6,000 gp" },
  { rarity: "Legendary", resource: "Carbalite Ore", amount: 20, cost: "24,000 gp" },
] as const;

const ARMOR_RULES = [
  "Your armor can only have one damage reduction, resistance, or immunity to an element.",
  "Your armor can only have one advantage or immunity vs a condition such as poisoned, frightened, or prone.",
  "Your armor can only have one material that grants a bonus to AC.",
  "Your armor can only have one effect that uses runes.",
  "A material can only be replaced with another material. Once replaced the previous material is destroyed.",
  "Materials do not stack with improved versions of their effects, including unnamed materials (e.g. Detect does not stack with Detect+).",
];

const WEAPON_RULES = [
  "A weapon can have one material that causes an effect when you roll a 20, such as a critical status effect. This material is exempt from rule 2.",
  "A weapon can only have one extra damage, condition inflicting, or on-hit effect material. The extra damage rule doesn't apply to materials that require a condition to deal that extra damage.",
  "A weapon can only have one effect that uses runes.",
  "A weapon can only have one bonus to spell DC and spell attack rolls.",
  "A material can only be replaced with another material. Once replaced the previous material is destroyed.",
  "Materials do not stack with improved versions of their effects, including unnamed materials (e.g. Critical Eye+1 does not stack with Critical Eye+2).",
];

const TRINKET_RULES = [
  "Trinkets have 1 material slot that can hold a weapon or armor material effect.",
  "You can have up to two trinkets, but only gain the effect of one at a time.",
  "As an action, you can swap which trinket effect you are using.",
  "If a material requires armor to be worn or only works on weapon attacks, it only works on equipment you are attuned to.",
];

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  rules: string[];
  accentColor: string;
}

interface UpgradeRow {
  rarity: string;
  resource: string;
  amount: number;
  cost: string;
}

interface UpgradeCostTableProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  rows: readonly UpgradeRow[];
  materialFootnote: string;
}

function UpgradeCostTable({
  title,
  icon,
  accentColor,
  rows,
  materialFootnote,
}: UpgradeCostTableProps) {
  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2 text-sm font-semibold", accentColor)}>
        {icon}
        {title}
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground">
              <th className="px-2 py-1.5 text-left font-medium">Rarity</th>
              <th className="px-2 py-1.5 text-left font-medium">Resource</th>
              <th className="px-2 py-1.5 text-center font-medium">Amt.</th>
              <th className="px-2 py-1.5 text-right font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rarity} className="border-b border-border/50 last:border-0">
                <td className="px-2 py-1.5 font-medium text-foreground whitespace-nowrap">
                  {row.rarity}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground">{row.resource}</td>
                <td className="px-2 py-1.5 text-center text-foreground">{row.amount}</td>
                <td className="px-2 py-1.5 text-right text-amber-400/90 font-medium whitespace-nowrap">
                  {row.cost}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic">
        {materialFootnote}
      </p>
    </div>
  );
}

function RuleSection({ title, icon, rules, accentColor }: SectionProps) {
  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2 text-sm font-semibold", accentColor)}>
        {icon}
        {title}
      </div>
      <ol className="space-y-1 pl-1">
        {rules.map((rule, i) => (
          <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
            <span className={cn("shrink-0 font-semibold mt-0.5", accentColor)}>
              {i + 1}.
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RulesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-muted/10 overflow-hidden mb-6">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-foreground">
            Material Effect Rules
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            — Limits for planning your build
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-border px-4 py-4 space-y-6">
          {/* Rarity slots table */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Gem className="h-4 w-4 text-purple-400" />
              Slots by Rarity (Weapons & Armor)
            </div>
            <div className="grid grid-cols-5 gap-1 text-center">
              {RARITY_SLOTS.map(({ rarity, slots }) => (
                <div
                  key={rarity}
                  className="rounded-md border border-border bg-muted/20 px-2 py-2"
                >
                  <div className="text-xs font-medium text-foreground">{rarity}</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">{slots}</div>
                  <div className="text-xs text-muted-foreground">slot{slots > 1 ? "s" : ""}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/80">
              Increasing rarity does not increase AC; it only adds material slots. Smithy upgrades
              take one week to complete.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Info className="h-4 w-4 text-amber-400" />
              Smithy Upgrade Costs
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <UpgradeCostTable
                title="Armor"
                icon={<ShieldCheck className="h-4 w-4" />}
                accentColor="text-blue-400"
                rows={ARMOR_UPGRADE_COSTS}
                materialFootnote="Some creature materials state they are armor crafting materials of that rarity and can be used in place of the resource listed above."
              />
              <UpgradeCostTable
                title="Weapon"
                icon={<Sword className="h-4 w-4" />}
                accentColor="text-orange-400"
                rows={WEAPON_UPGRADE_COSTS}
                materialFootnote="Some creature materials state they are weapon crafting materials of that rarity and can be used in place of the resource listed above."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <RuleSection
              title="Armor"
              icon={<ShieldCheck className="h-4 w-4" />}
              rules={ARMOR_RULES}
              accentColor="text-blue-400"
            />
            <RuleSection
              title="Weapon"
              icon={<Sword className="h-4 w-4" />}
              rules={WEAPON_RULES}
              accentColor="text-orange-400"
            />
            <RuleSection
              title="Trinkets"
              icon={<Gem className="h-4 w-4" />}
              rules={TRINKET_RULES}
              accentColor="text-purple-400"
            />
          </div>

          <p className="text-xs text-muted-foreground/60 italic border-t border-border pt-3">
            The Build Planner applies these rules automatically and shows warnings when your build
            has conflicts.
          </p>
        </div>
      )}
    </div>
  );
}
