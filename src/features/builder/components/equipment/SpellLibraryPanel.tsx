import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronUp,
  Info,
  Lock,
  Search,
  Sparkles,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import type { Spell } from "@/shared/types";
import type {
  BuilderSpellSelection,
  BuilderSpellSelections,
} from "@/shared/types";
import type { SpellcastingInfo } from "../../hooks/useSpellcasting";
import { parseSpellLevel, isPactSpellSlot } from "../../hooks/useBuilderSlotSelection";
import type { SpellLevelSlot, BuilderPactSpellSlot } from "@/shared/types";
import { BuilderPanel } from "../shared/BuilderPanel";
import { ScrollableWhenNeeded } from "../shared/ScrollableWhenNeeded";
import { RpgbotRatingBadge } from "../shared/RpgbotRatingBadge";
import { cn } from "@/shared/utils/cn";
import {
  resolveSpellGuideKey,
  slugifyRpgbotKey,
  sortByRpgbotRating,
  toRpgbotClassSlug,
} from "@/features/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsLookup } from "@/features/builder/hooks/useRpgbotRatingsLookup";
import type { RpgbotRatingLookupEntry } from "@/features/builder/data/rpgbot-ratings.types";
import { SpellExpandedDetails } from "@/features/spells/components/SpellExpandedDetails";
import { SpellMetaBadges } from "./SpellMetaBadges";
import {
  grantsForSpellLevel,
  spellMatchesCharacterSpellList,
  spellNamesMatch,
  type SubclassSpellGrant,
} from "../../utils/subclass-spells.utils";
import {
  grantsForPactPool,
  PACT_SPELL_POOL_LEVEL,
} from "../../utils/pact-magic.utils";

// ─── Damage parsing ───────────────────────────────────────────────────────────

/** Extracts the first dice notation (NdX) from a spell's description. */
function parseSpellDamageRoll(description: string[]): string | null {
  const text = description.join(" ");
  // Match patterns like 8d6, 2d4+5, 1d10, etc.
  const match = text.match(/\b(\d+d\d+)(?:\s*\+\s*\d+)?\b/i);
  return match ? match[1] : null;
}

function parseDice(notation: string): { count: number; sides: number } | null {
  const m = notation.match(/^(\d+)d(\d+)$/i);
  if (!m) return null;
  return { count: parseInt(m[1], 10), sides: parseInt(m[2], 10) };
}

function averageRoll(count: number, sides: number): number {
  return Math.floor(count * ((sides + 1) / 2));
}

function spellToSelection(spell: Spell): BuilderSpellSelection {
  const damageRoll = parseSpellDamageRoll(spell.description);
  return {
    id: spell.id,
    name: spell.name,
    level: spell.level,
    source: spell.source,
    school: spell.schoolName,
    damageRoll: damageRoll ?? undefined,
  };
}

// ─── Source badge ─────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  PHB: "bg-amber-950/50 text-amber-300 border-amber-700/40",
  XPHB: "bg-sky-950/50 text-sky-300 border-sky-700/40",
  XGE: "bg-emerald-950/50 text-emerald-300 border-emerald-700/40",
  TCE: "bg-violet-950/50 text-violet-300 border-violet-700/40",
};

function SourceBadge({ source }: { source: string }) {
  const cls =
    SOURCE_COLORS[source] ??
    "bg-muted/40 text-muted-foreground border-border/50";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1 py-0 text-[9px] font-medium",
        cls,
      )}
    >
      {source}
    </span>
  );
}

// ─── Damage result ─────────────────────────────────────────────────────────────

function DamageResult({ damageRoll }: { damageRoll: string }) {
  const dice = parseDice(damageRoll);
  const avg = dice ? averageRoll(dice.count, dice.sides) : null;
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-md border border-amber-700/40 bg-amber-950/30 px-2 py-1.5 text-xs">
      <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400" />
      <span className="font-medium text-amber-200">{damageRoll}</span>
      {avg !== null && (
        <span className="text-amber-300/70">(~{avg} prom.)</span>
      )}
    </div>
  );
}

function findSpellByName(spells: Spell[], name: string): Spell | undefined {
  return spells.find((s) => spellNamesMatch(s.name, name));
}

function SpellInfoToggleButton({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={expanded ? "Ocultar detalles" : "Ver detalles del hechizo"}
      aria-expanded={expanded}
      aria-label={
        expanded ? "Ocultar detalles del hechizo" : "Ver detalles del hechizo"
      }
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {expanded ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <Info className="h-3 w-3" />
      )}
    </button>
  );
}

// ─── Subclass grant row (always prepared / bonus known) ───────────────────────

function SubclassGrantRow({
  grant,
  spell,
  badge,
}: {
  grant: SubclassSpellGrant;
  spell: Spell | undefined;
  badge: string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDamage, setShowDamage] = useState(false);
  const damageRoll = spell ? parseSpellDamageRoll(spell.description) : null;

  return (
    <div className="mb-1 rounded-md border border-emerald-400/30 bg-emerald-400/5 px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {grant.name}
        </span>
        <span className="shrink-0 rounded border border-emerald-700/40 bg-emerald-950/40 px-1 py-0 text-[9px] font-medium text-emerald-300">
          {badge}
        </span>
        {spell && <SpellMetaBadges spell={spell} />}
        {spell && <SourceBadge source={spell.source} />}
        {spell && (
          <SpellInfoToggleButton
            expanded={showDetails}
            onToggle={() => setShowDetails((p) => !p)}
          />
        )}
        {damageRoll && (
          <button
            type="button"
            onClick={() => setShowDamage((p) => !p)}
            title="Calcular daño"
            className="flex h-5 w-5 items-center justify-center rounded bg-amber-950/50 text-amber-400 transition-colors hover:bg-amber-950/80"
          >
            {showDamage ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
      {spell?.schoolName && !showDetails && (
        <p className="pl-5 text-[10px] text-muted-foreground">
          {spell.schoolName}
        </p>
      )}
      {showDetails && spell && (
        <SpellExpandedDetails spell={spell} className="pl-5" />
      )}
      {showDamage && damageRoll && (
        <div className="pl-1">
          <DamageResult damageRoll={damageRoll} />
        </div>
      )}
    </div>
  );
}

// ─── Selected spell row ───────────────────────────────────────────────────────

function SelectedSpellRow({
  spell,
  fullSpell,
  onRemove,
}: {
  spell: BuilderSpellSelection;
  fullSpell: Spell | undefined;
  onRemove: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDamage, setShowDamage] = useState(false);
  const hasDamage = !!spell.damageRoll;

  return (
    <div className="mb-1 rounded-md border border-violet-400/30 bg-violet-400/5 px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {spell.name}
        </span>
        {fullSpell && <SpellMetaBadges spell={fullSpell} />}
        {spell.source && <SourceBadge source={spell.source} />}
        {fullSpell && (
          <SpellInfoToggleButton
            expanded={showDetails}
            onToggle={() => setShowDetails((p) => !p)}
          />
        )}
        {hasDamage && (
          <button
            type="button"
            onClick={() => setShowDamage((p) => !p)}
            title="Calcular daño"
            className="flex h-5 w-5 items-center justify-center rounded bg-amber-950/50 text-amber-400 transition-colors hover:bg-amber-950/80"
          >
            {showDamage ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          title="Quitar hechizo"
          className="flex h-5 w-5 items-center justify-center rounded bg-destructive/20 text-destructive-foreground transition-colors hover:bg-destructive/40"
        >
          <X className="h-2.5 w-2.5" strokeWidth={3} />
        </button>
      </div>
      {spell.school && !showDetails && (
        <p className="pl-5 text-[10px] text-muted-foreground">{spell.school}</p>
      )}
      {showDetails && fullSpell && (
        <SpellExpandedDetails spell={fullSpell} className="pl-5" />
      )}
      {showDamage && spell.damageRoll && (
        <div className="pl-1">
          <DamageResult damageRoll={spell.damageRoll} />
        </div>
      )}
    </div>
  );
}

// ─── Available spell row ──────────────────────────────────────────────────────

function AvailableSpellRow({
  spell,
  disabled,
  disabledHint,
  rpgbotRating,
  onSelect,
}: {
  spell: Spell;
  disabled: boolean;
  disabledHint?: string;
  rpgbotRating?: RpgbotRatingLookupEntry | null;
  onSelect: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={cn(
        "mb-1 rounded-md border px-2 py-1.5 transition-colors",
        disabled
          ? "border-border/30 opacity-40"
          : "border-border/60 hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          title={disabled ? disabledHint : `Añadir ${spell.name}`}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 text-left",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          <Wand2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
            {spell.name}
          </span>
          {rpgbotRating && <RpgbotRatingBadge rating={rpgbotRating} />}
          <SpellMetaBadges spell={spell} />
          <SourceBadge source={spell.source} />
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {spell.schoolName}
          </span>
        </button>
        <SpellInfoToggleButton
          expanded={showDetails}
          onToggle={() => setShowDetails((p) => !p)}
        />
      </div>
      {showDetails && <SpellExpandedDetails spell={spell} className="pl-5" />}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface SpellLibraryPanelProps {
  selectedSlot: SpellLevelSlot | BuilderPactSpellSlot;
  className: string;
  characterLevel: number;
  spellcastingInfo: SpellcastingInfo;
  spellSelections: BuilderSpellSelections;
  allSpells: Spell[];
  spellsLoading: boolean;
  spellLevelByName: Map<string, number>;
  onAddSpell: (level: number, spell: BuilderSpellSelection) => void;
  onRemoveSpell: (level: number, spellId: string) => void;
}

export function SpellLibraryPanel({
  selectedSlot,
  className,
  characterLevel,
  spellcastingInfo,
  spellSelections,
  allSpells,
  spellsLoading,
  spellLevelByName,
  onAddSpell,
  onRemoveSpell,
}: SpellLibraryPanelProps) {
  const isPactPool = isPactSpellSlot(selectedSlot);
  const spellLevel = isPactPool ? null : parseSpellLevel(selectedSlot);
  const selectionLevel = isPactPool ? PACT_SPELL_POOL_LEVEL : spellLevel!;
  const loading = spellsLoading;
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [selectedSlot]);

  const selectedAtLevel = useMemo(
    () => (spellSelections ?? {})[selectionLevel] ?? [],
    [spellSelections, selectionLevel],
  );

  const selectedIds = useMemo(
    () => new Set(selectedAtLevel.map((s) => s.id)),
    [selectedAtLevel],
  );

  const isCantrip = !isPactPool && spellLevel === 0;
  const atCantripCapacity =
    isCantrip && selectedAtLevel.length >= spellcastingInfo.cantripCount;
  const atSpellCapacity =
    !isCantrip &&
    spellcastingInfo.maxPreparedOrKnown > 0 &&
    spellcastingInfo.selectedSpellCount >= spellcastingInfo.maxPreparedOrKnown;

  const isAtCapacity = isCantrip ? atCantripCapacity : atSpellCapacity;

  const q = search.toLowerCase().trim();
  const pactMaxLevel = spellcastingInfo.pactMaxSpellLevel;

  const subclassSlug = useMemo(() => {
    const raw =
      spellcastingInfo.subclassShortName ?? spellcastingInfo.subclassName;
    return raw ? slugifyRpgbotKey(raw) : null;
  }, [spellcastingInfo.subclassName, spellcastingInfo.subclassShortName]);

  const rpgbotSpellContext = useMemo(() => {
    const classSlug = toRpgbotClassSlug(className);
    if (!classSlug) return null;
    return {
      classSlug,
      guideKey: resolveSpellGuideKey(classSlug, subclassSlug),
      category: "spell",
    };
  }, [className, subclassSlug]);

  const { lookup: rpgbotSpellLookup } = useRpgbotRatingsLookup(
    rpgbotSpellContext,
  );

  const alwaysPreparedAtLevel = useMemo(() => {
    if (isPactPool) {
      return grantsForPactPool(
        spellcastingInfo.subclassAlwaysPrepared,
        pactMaxLevel,
        spellLevelByName,
        allSpells,
      );
    }
    return grantsForSpellLevel(
      spellcastingInfo.subclassAlwaysPrepared,
      spellLevel!,
      spellLevelByName,
      allSpells,
    );
  }, [
    isPactPool,
    pactMaxLevel,
    spellcastingInfo.subclassAlwaysPrepared,
    spellLevel,
    spellLevelByName,
    allSpells,
  ]);

  const bonusKnownAtLevel = useMemo(() => {
    if (isPactPool) {
      return grantsForPactPool(
        spellcastingInfo.subclassBonusKnown,
        pactMaxLevel,
        spellLevelByName,
        allSpells,
      );
    }
    return grantsForSpellLevel(
      spellcastingInfo.subclassBonusKnown,
      spellLevel!,
      spellLevelByName,
      allSpells,
    );
  }, [
    isPactPool,
    pactMaxLevel,
    spellcastingInfo.subclassBonusKnown,
    spellLevel,
    spellLevelByName,
    allSpells,
  ]);

  const optionalFeatureAtLevel = useMemo(() => {
    if (isPactPool) {
      return grantsForPactPool(
        spellcastingInfo.optionalFeatureGranted,
        pactMaxLevel,
        spellLevelByName,
        allSpells,
      );
    }
    return grantsForSpellLevel(
      spellcastingInfo.optionalFeatureGranted,
      spellLevel!,
      spellLevelByName,
      allSpells,
    );
  }, [
    isPactPool,
    pactMaxLevel,
    spellcastingInfo.optionalFeatureGranted,
    spellLevel,
    spellLevelByName,
    allSpells,
  ]);

  const subclassGrantsAtLevel = useMemo(
    () => [...alwaysPreparedAtLevel, ...bonusKnownAtLevel],
    [alwaysPreparedAtLevel, bonusKnownAtLevel],
  );

  const filterGrantBySearch = useCallback(
    (grant: SubclassSpellGrant) => !q || grant.name.toLowerCase().includes(q),
    [q],
  );

  const spellListContext = useMemo(
    () => ({
      className,
      subclassName: spellcastingInfo.subclassName,
      subclassShortName: spellcastingInfo.subclassShortName,
      expandedFilters: spellcastingInfo.expandedSpellFilters,
      characterLevel,
      availableSpellSlotLevels: spellcastingInfo.availableSpellSlotLevels,
      selectedSpellLevel: isPactPool ? 0 : spellLevel!,
      isPactPool,
      spellcastingFromSubclass: spellcastingInfo.spellcastingFromSubclass,
    }),
    [
      className,
      spellcastingInfo.subclassName,
      spellcastingInfo.subclassShortName,
      spellcastingInfo.expandedSpellFilters,
      spellcastingInfo.availableSpellSlotLevels,
      spellcastingInfo.spellcastingFromSubclass,
      characterLevel,
      isPactPool,
      spellLevel,
    ],
  );

  const spellMatchesClassList = useCallback(
    (spell: Spell) => spellMatchesCharacterSpellList(spell, spellListContext),
    [spellListContext],
  );

  const availableSpells = useMemo(() => {
    if (isAtCapacity) return [];
    const spells = allSpells.filter((s) => {
      if (isPactPool) {
        if (s.level < 1 || s.level > pactMaxLevel) return false;
      } else if (s.level !== spellLevel) {
        return false;
      }
      if (!spellMatchesClassList(s)) return false;
      if (selectedIds.has(s.id)) return false;
      if (subclassGrantsAtLevel.some((g) => spellNamesMatch(s.name, g.name))) {
        return false;
      }
      if (optionalFeatureAtLevel.some((g) => spellNamesMatch(s.name, g.name))) {
        return false;
      }
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });

    return sortByRpgbotRating(
      spells,
      (s) => rpgbotSpellLookup?.(s.name, s.source) ?? null,
      (s) => s.name,
    );
  }, [
    allSpells,
    isPactPool,
    pactMaxLevel,
    spellLevel,
    selectedIds,
    subclassGrantsAtLevel,
    optionalFeatureAtLevel,
    q,
    spellMatchesClassList,
    isAtCapacity,
    rpgbotSpellLookup,
  ]);

  const handleSelect = useCallback(
    (spell: Spell) => {
      onAddSpell(selectionLevel, spellToSelection(spell));
    },
    [onAddSpell, selectionLevel],
  );

  const levelLabel = isPactPool
    ? spellcastingInfo.isPreparedCaster
      ? `Prepared Spells (1–${pactMaxLevel})`
      : `Spells Known (1–${pactMaxLevel})`
    : spellLevel === 0
      ? "Cantrips"
      : `Nivel ${spellLevel}`;

  const capacityHint = isCantrip
    ? `${selectedAtLevel.length}/${spellcastingInfo.cantripCount} cantrips available`
    : isPactPool
      ? spellcastingInfo.maxPreparedOrKnown > 0
        ? `${spellcastingInfo.selectedSpellCount}/${spellcastingInfo.maxPreparedOrKnown} ${
            spellcastingInfo.isPreparedCaster
              ? "prepared"
              : "pact spells known"
          } · ${spellcastingInfo.pactSlotCount} slot${
            spellcastingInfo.pactSlotCount !== 1 ? "s" : ""
          } (niv. ${pactMaxLevel})`
        : null
      : spellcastingInfo.maxPreparedOrKnown > 0
        ? `${spellcastingInfo.selectedSpellCount}/${spellcastingInfo.maxPreparedOrKnown} ${spellcastingInfo.isPreparedCaster ? "prepared" : "known"}`
        : null;

  const disabledHint = isCantrip
    ? `Cantrip limit reached (${spellcastingInfo.cantripCount})`
    : isPactPool
      ? `Pact Magic prepared limit reached (${spellcastingInfo.maxPreparedOrKnown})`
      : spellcastingInfo.isPreparedCaster
        ? `Limit of preparation reached (${spellcastingInfo.maxPreparedOrKnown})`
        : `Limit of known spells reached (${spellcastingInfo.maxPreparedOrKnown})`;

  const selectedSectionLabel = isCantrip
    ? "Cantrips"
    : isPactPool
      ? spellcastingInfo.isPreparedCaster
        ? "Prepared Spells"
        : "Spells Known"
      : spellcastingInfo.isPreparedCaster
        ? "Prepared"
        : spellcastingInfo.isPactMagic
          ? "Pact spells known"
          : "Known";

  return (
    <BuilderPanel
      title={
        <span className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          <span>Library — {levelLabel}</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {spellcastingInfo.sectionLabel} · {className}
            {spellcastingInfo.spellcastingAbility
              ? ` · ${spellcastingInfo.spellcastingAbility}`
              : ""}
          </span>
          {capacityHint && (
            <span
              className={cn(
                "ml-auto text-[11px] font-medium tabular-nums",
                isAtCapacity ? "text-rose-400" : "text-emerald-400",
              )}
            >
              {capacityHint}
            </span>
          )}
        </span>
      }
    >
      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search spell name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <ScrollableWhenNeeded>
        {alwaysPreparedAtLevel.filter(filterGrantBySearch).length > 0 && (
          <div className="mb-3">
            <SectionLabel>
              Always prepared spells by subclass
              {spellcastingInfo.subclassName
                ? ` (${spellcastingInfo.subclassName})`
                : ""}
            </SectionLabel>
            {alwaysPreparedAtLevel.filter(filterGrantBySearch).map((grant) => (
              <SubclassGrantRow
                key={`prepared-${grant.name}`}
                grant={grant}
                spell={findSpellByName(allSpells, grant.name)}
                badge="Always prepared spells by subclass"
              />
            ))}
          </div>
        )}

        {bonusKnownAtLevel.filter(filterGrantBySearch).length > 0 && (
          <div className="mb-3">
            <SectionLabel>
              Bonus known spells by subclass
              {spellcastingInfo.subclassName
                ? ` (${spellcastingInfo.subclassName})`
                : ""}
            </SectionLabel>
            {bonusKnownAtLevel.filter(filterGrantBySearch).map((grant) => (
              <SubclassGrantRow
                key={`known-${grant.name}`}
                grant={grant}
                spell={findSpellByName(allSpells, grant.name)}
                badge="Bonus known spells by subclass"
              />
            ))}
          </div>
        )}

        {optionalFeatureAtLevel.filter(filterGrantBySearch).length > 0 && (
          <div className="mb-3">
            <SectionLabel>Granted by optional features</SectionLabel>
            {optionalFeatureAtLevel.filter(filterGrantBySearch).map((grant) => (
              <SubclassGrantRow
                key={`opt-${grant.name}`}
                grant={grant}
                spell={findSpellByName(allSpells, grant.name)}
                badge={
                  grant.grantType === "bonus-known"
                    ? "Bonus known (feature)"
                    : "Granted by feature"
                }
              />
            ))}
          </div>
        )}

        {/* Selected spells */}
        {selectedAtLevel.length > 0 && (
          <div className="mb-3">
            <SectionLabel>{selectedSectionLabel}</SectionLabel>
            {selectedAtLevel.map((spell) => (
              <SelectedSpellRow
                key={spell.id}
                spell={spell}
                fullSpell={allSpells.find((s) => s.id === spell.id)}
                onRemove={() => onRemoveSpell(selectionLevel, spell.id)}
              />
            ))}
          </div>
        )}

        {/* Available spells */}
        {loading ? (
          <EmptyState text="Loading spells..." />
        ) : isAtCapacity ? (
          <EmptyState text={disabledHint} />
        ) : availableSpells.length === 0 && !q ? (
          <EmptyState text={`No spells of ${levelLabel} for ${className}.`} />
        ) : availableSpells.length === 0 && q ? (
          <EmptyState text="No results." />
        ) : (
          <>
            <SectionLabel>Available</SectionLabel>
            {availableSpells.map((spell) => (
              <AvailableSpellRow
                key={spell.id}
                spell={spell}
                disabled={false}
                rpgbotRating={rpgbotSpellLookup?.(spell.name, spell.source)}
                onSelect={() => handleSelect(spell)}
              />
            ))}
          </>
        )}
      </ScrollableWhenNeeded>
    </BuilderPanel>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-primary">
      {children}
    </p>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>
  );
}
