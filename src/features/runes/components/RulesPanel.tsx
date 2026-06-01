import { useState } from "react";
import { ChevronDown, ChevronUp, Gem, Info, ShieldCheck, Sword } from "lucide-react";
import {
  ARMOR_RULES,
  ARMOR_UPGRADE_COSTS,
  RARITY_SLOTS,
  TRINKET_RULES,
  WEAPON_RULES,
  WEAPON_UPGRADE_COSTS,
} from "../constants/rules.constants";
import { RuleSection } from "./RuleSection";
import { UpgradeCostTable } from "./UpgradeCostTable";

export function RulesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-muted/10 overflow-hidden mb-6">
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

      {open && (
        <div className="border-t border-border px-4 py-4 space-y-6">
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
