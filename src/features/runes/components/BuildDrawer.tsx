import { useState } from "react";
import {
  Layers,
  X,
  Trash2,
  ShieldCheck,
  Sword,
  Gem,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  useRuneBuild,
  RARITY_ORDER,
  RARITY_SLOTS,
  ItemRarity,
  BuildSlotType,
} from "../context/RuneBuildContext";
import {
  getArmorViolations,
  getWeaponViolations,
} from "../utils/build.validation";
import { Rune } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

const RARITY_LABEL: Record<ItemRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  "very rare": "Very Rare",
  legendary: "Legendary",
};

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: "text-gray-300",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  "very rare": "text-purple-400",
  legendary: "text-amber-400",
};

interface RaritySelectProps {
  value: ItemRarity;
  onChange: (r: ItemRarity) => void;
  label: string;
}

function RaritySelect({ value, onChange, label }: RaritySelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}:</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as ItemRarity)}
          className={cn(
            "appearance-none rounded-md border border-border bg-muted/30 px-2 py-1 pr-6 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary",
            RARITY_COLOR[value],
          )}
        >
          {RARITY_ORDER.map((r) => (
            <option key={r} value={r}>
              {RARITY_LABEL[r]} ({RARITY_SLOTS[r]} slot{RARITY_SLOTS[r] > 1 ? "s" : ""})
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
}

interface SlotRowProps {
  index: number;
  rune: Rune | null;
  onRemove: () => void;
}

function SlotRow({ index, rune, onRemove }: SlotRowProps) {
  const isEmpty = rune === null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors",
        isEmpty
          ? "border-dashed border-border/50 text-muted-foreground/40"
          : "border-border bg-muted/20",
      )}
    >
      <span className="shrink-0 w-5 text-center font-mono text-muted-foreground/50">
        {index + 1}
      </span>
      {isEmpty ? (
        <span className="flex-1 italic">Slot vacío</span>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{rune.name}</p>
            <p className="text-muted-foreground/60 truncate">{rune.monsterName}</p>
          </div>
          <button
            onClick={onRemove}
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Quitar ${rune.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  runes: (Rune | null)[];
  slotType: BuildSlotType;
  violations: { rule: string; offenders: string[] }[];
}

function BuildSection({ title, icon, iconColor, runes, slotType, violations }: SectionProps) {
  const { removeRune } = useRuneBuild();

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider", iconColor)}>
        {icon}
        {title}
      </div>

      <div className="space-y-1.5">
        {runes.map((rune, i) => (
          <SlotRow
            key={i}
            index={i}
            rune={rune}
            onRemove={() => removeRune(slotType, i)}
          />
        ))}
      </div>

      {violations.length > 0 && (
        <div className="space-y-1 mt-2">
          {violations.map((v, i) => (
            <div
              key={i}
              className="flex gap-2 rounded-md bg-orange-900/20 border border-orange-700/40 px-3 py-2"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-orange-300 font-medium">{v.rule}</p>
                <p className="text-xs text-orange-400/60 mt-0.5">
                  Conflicto: {v.offenders.join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface EffectBlockProps {
  runeName: string;
  monsterName: string;
  effect: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
}

function EffectBlock({
  runeName,
  monsterName,
  effect,
  accentColor,
  borderColor,
  bgColor,
}: EffectBlockProps) {
  return (
    <div className={cn("rounded-md border px-3 py-2.5 space-y-1.5", borderColor, bgColor)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-xs font-semibold", accentColor)}>{runeName}</span>
        <span className="text-xs text-muted-foreground/50 truncate shrink-0">{monsterName}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {parseFiveToolsMarkup(effect)}
      </p>
    </div>
  );
}

interface AccumulatedEffectsProps {
  weaponRunes: (Rune | null)[];
  armorRunes: (Rune | null)[];
  trinket1Rune: Rune | null;
  trinket2Rune: Rune | null;
}

function AccumulatedEffects({
  weaponRunes,
  armorRunes,
  trinket1Rune,
  trinket2Rune,
}: AccumulatedEffectsProps) {
  const [open, setOpen] = useState(true);

  const weaponFilled = weaponRunes.filter((r): r is Rune => r !== null && !!r.weaponEffect);
  const armorFilled = armorRunes.filter((r): r is Rune => r !== null && !!r.armorEffect);

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
          {/* Weapon effects */}
          {weaponFilled.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs text-orange-400/70 font-medium">
                <Sword className="h-3 w-3" />
                Arma
              </div>
              {weaponFilled.map((rune, i) => (
                <EffectBlock
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

          {/* Armor effects */}
          {armorFilled.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs text-blue-400/70 font-medium">
                <ShieldCheck className="h-3 w-3" />
                Armadura
              </div>
              {armorFilled.map((rune, i) => (
                <EffectBlock
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

          {/* Trinket effects */}
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
                      <p className="text-xs text-muted-foreground/50 italic">{label}</p>
                      {rune.weaponEffect && (
                        <EffectBlock
                          runeName={rune.name}
                          monsterName={rune.monsterName}
                          effect={rune.weaponEffect}
                          accentColor="text-purple-300"
                          borderColor="border-purple-800/30"
                          bgColor="bg-purple-900/10"
                        />
                      )}
                      {rune.armorEffect && (
                        <EffectBlock
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
                Recuerda: solo un trinket activo a la vez.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BuildDrawer() {
  const [open, setOpen] = useState(false);
  const {
    weaponRarity,
    armorRarity,
    weaponRunes,
    armorRunes,
    trinket1Rune,
    trinket2Rune,
    setWeaponRarity,
    setArmorRarity,
    removeRune,
    clearBuild,
    totalRunes,
  } = useRuneBuild();

  const weaponViolations = getWeaponViolations(weaponRunes);
  const armorViolations = getArmorViolations(armorRunes);
  const totalViolations = weaponViolations.length + armorViolations.length;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-amber-600 px-4 py-3 text-white shadow-lg hover:bg-amber-500 transition-colors"
        aria-label="Abrir Build Planner"
      >
        <Layers className="h-5 w-5" />
        {totalRunes > 0 && (
          <span className="text-sm font-semibold">{totalRunes}</span>
        )}
        {totalViolations > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-400 text-[10px] font-bold text-white">
            !
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-bold text-foreground">Build Planner</h2>
            {totalRunes > 0 && (
              <span className="rounded-full bg-amber-600/20 text-amber-400 border border-amber-600/30 px-2 py-0.5 text-xs font-semibold">
                {totalRunes}
              </span>
            )}
            {totalViolations > 0 && (
              <span className="rounded-full bg-orange-900/30 text-orange-400 border border-orange-700/40 px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {totalViolations}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalRunes > 0 && (
              <button
                onClick={clearBuild}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Limpiar build"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 hover:bg-accent text-muted-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {totalRunes === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
              <Layers className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Tu build está vacío.</p>
              <p className="text-xs text-muted-foreground/60">
                Abre el detalle de una runa y agrégala a tu arma, armadura o trinket.
              </p>
            </div>
          ) : (
            <>
              {/* Weapon section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <RaritySelect
                    label="Arma"
                    value={weaponRarity}
                    onChange={setWeaponRarity}
                  />
                  <span className="text-xs text-muted-foreground">
                    {weaponRunes.filter(Boolean).length}/{RARITY_SLOTS[weaponRarity]} slots
                  </span>
                </div>
                <BuildSection
                  title="Arma"
                  icon={<Sword className="h-3.5 w-3.5" />}
                  iconColor="text-orange-400"
                  runes={weaponRunes}
                  slotType="weapon"
                  violations={weaponViolations}
                />
              </div>

              <div className="border-t border-border/50" />

              {/* Armor section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <RaritySelect
                    label="Armadura"
                    value={armorRarity}
                    onChange={setArmorRarity}
                  />
                  <span className="text-xs text-muted-foreground">
                    {armorRunes.filter(Boolean).length}/{RARITY_SLOTS[armorRarity]} slots
                  </span>
                </div>
                <BuildSection
                  title="Armadura"
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  iconColor="text-blue-400"
                  runes={armorRunes}
                  slotType="armor"
                  violations={armorViolations}
                />
              </div>

              <div className="border-t border-border/50" />

              {/* Trinkets section */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Gem className="h-3.5 w-3.5" />
                  Trinkets
                </div>

                {/* Trinket 1 */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Trinket 1</p>
                  {trinket1Rune ? (
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{trinket1Rune.name}</p>
                        <p className="text-muted-foreground/60 truncate">{trinket1Rune.monsterName}</p>
                      </div>
                      <button
                        onClick={() => removeRune("trinket1")}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border/50 px-3 py-2 text-xs text-muted-foreground/40 italic">
                      Slot vacío
                    </div>
                  )}
                </div>

                {/* Trinket 2 */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Trinket 2</p>
                  {trinket2Rune ? (
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{trinket2Rune.name}</p>
                        <p className="text-muted-foreground/60 truncate">{trinket2Rune.monsterName}</p>
                      </div>
                      <button
                        onClick={() => removeRune("trinket2")}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border/50 px-3 py-2 text-xs text-muted-foreground/40 italic">
                      Slot vacío
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground/50 italic">
                  Solo un trinket activo a la vez. Puedes intercambiarlos como acción.
                </p>
              </div>

              <div className="border-t border-border/50" />

              {/* Accumulated effects summary */}
              <AccumulatedEffects
                weaponRunes={weaponRunes}
                armorRunes={armorRunes}
                trinket1Rune={trinket1Rune}
                trinket2Rune={trinket2Rune}
              />
            </>
          )}
        </div>

        {/* Footer */}
        {totalRunes > 0 && (
          <div className="shrink-0 border-t border-border px-5 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{totalRunes} material{totalRunes !== 1 ? "es" : ""} en el build</span>
              {totalViolations > 0 ? (
                <span className="flex items-center gap-1 text-orange-400 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {totalViolations} conflicto{totalViolations !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-green-400 text-xs font-medium">Build válido ✓</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground/60 italic">
              Los cambios no se guardan entre sesiones.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
