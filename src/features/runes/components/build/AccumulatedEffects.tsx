import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Gem,
  ShieldCheck,
  Sparkles,
  Sword,
} from "lucide-react";
import { Rune } from "@/shared/types";
import { BuildEffectBlock } from "./BuildEffectBlock";

interface AccumulatedEffectsProps {
  weaponRunes: (Rune | null)[];
  armorRunes: (Rune | null)[];
  trinket1Rune: Rune | null;
  trinket2Rune: Rune | null;
}

export function AccumulatedEffects({
  weaponRunes,
  armorRunes,
  trinket1Rune,
  trinket2Rune,
}: AccumulatedEffectsProps) {
  const [open, setOpen] = useState(true);

  const weaponFilled = weaponRunes.filter(
    (r): r is Rune => r !== null && !!r.weaponEffect,
  );
  const armorFilled = armorRunes.filter(
    (r): r is Rune => r !== null && !!r.armorEffect,
  );

  const hasAnyEffect =
    weaponFilled.length > 0 ||
    armorFilled.length > 0 ||
    trinket1Rune ||
    trinket2Rune;

  if (!hasAnyEffect) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-400"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Efectos Acumulados
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="space-y-4">
          {weaponFilled.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs text-orange-400/70 font-medium">
                <Sword className="h-3 w-3" />
                Weapon
              </div>
              {weaponFilled.map((rune, i) => (
                <BuildEffectBlock
                  key={i}
                  runeName={rune.name}
                  monsterName={rune.monsterName}
                  effect={rune.weaponEffect!}
                  accentColor="text-orange-300"
                  borderColor="border-orange-800/30"
                  bgColor="bg-orange-900/10"
                />
              ))}
            </div>
          )}

          {armorFilled.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs text-blue-400/70 font-medium">
                <ShieldCheck className="h-3 w-3" />
                Armor
              </div>
              {armorFilled.map((rune, i) => (
                <BuildEffectBlock
                  key={i}
                  runeName={rune.name}
                  monsterName={rune.monsterName}
                  effect={rune.armorEffect!}
                  accentColor="text-blue-300"
                  borderColor="border-blue-800/30"
                  bgColor="bg-blue-900/10"
                />
              ))}
            </div>
          )}

          {(trinket1Rune || trinket2Rune) && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs text-purple-400/70 font-medium">
                <Gem className="h-3 w-3" />
                Trinkets
              </div>
              {[
                { rune: trinket1Rune, label: "Trinket 1" },
                { rune: trinket2Rune, label: "Trinket 2" },
              ].map(
                ({ rune, label }) =>
                  rune && (
                    <div key={label} className="space-y-1">
                      <p className="text-xs text-muted-foreground/50 italic">
                        {label}
                      </p>
                      {rune.weaponEffect && (
                        <BuildEffectBlock
                          runeName={rune.name}
                          monsterName={rune.monsterName}
                          effect={rune.weaponEffect}
                          accentColor="text-purple-300"
                          borderColor="border-purple-800/30"
                          bgColor="bg-purple-900/10"
                        />
                      )}
                      {rune.armorEffect && (
                        <BuildEffectBlock
                          runeName={rune.name}
                          monsterName={rune.monsterName}
                          effect={rune.armorEffect}
                          accentColor="text-purple-300"
                          borderColor="border-purple-800/30"
                          bgColor="bg-purple-900/10"
                        />
                      )}
                    </div>
                  ),
              )}
              <p className="text-xs text-muted-foreground/40 italic">
                Remember: only one trinket active at a time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
