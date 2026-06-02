import { useMemo } from "react";
import { Dices, RotateCcw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { SkillKey } from "@/shared/types";
import { MonsterStatBlock } from "@/features/monsters/components/MonsterStatBlock";
import { useMonstieCreator } from "../context/MonstieCreatorContext";
import { formatAbilityScoresLine } from "../utils/monstie-abilities";
import { mapAbilitiesFromOriginal } from "../utils/monstie-abilities";
import {
  getCreatureFeatureOptions,
  getSignatureAttackOptions,
  getTraitOptions,
} from "../utils/monstie-actions";
import { getSidekickProficiencyBonus } from "../utils/monstie-stats";

const SKILL_LABELS: Record<string, string> = {
  acr: "Acrobatics",
  ani: "Animal Handling",
  arc: "Arcana",
  ath: "Athletics",
  dec: "Deception",
  his: "History",
  ins: "Insight",
  itm: "Intimidation",
  inv: "Investigation",
  med: "Medicine",
  nat: "Nature",
  prc: "Perception",
  prf: "Performance",
  per: "Persuasion",
  rel: "Religion",
  slt: "Sleight of Hand",
  ste: "Stealth",
  sur: "Survival",
};

function OptionChip({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors text-left",
        selected
          ? "bg-primary/20 text-primary border-primary/40"
          : "bg-card border-border text-muted-foreground hover:border-primary/30",
        disabled && !selected && "opacity-40 cursor-not-allowed",
      )}
    >
      {label}
    </button>
  );
}

export function MonstieCreatorPanel() {
  const {
    loading,
    eligibleMonsters,
    draft,
    baseMonster,
    builtMonstie,
    maxSkillSlots,
    maxTraitSlots,
    maxCreatureSlots,
    classFeatures,
    setDraft,
    selectBaseMonster,
    toggleSkill,
    toggleTrait,
    toggleCreatureFeature,
    generateRandom,
    resetDraft,
  } = useMonstieCreator();

  const mappedAbilities = useMemo(
    () =>
      baseMonster ? mapAbilitiesFromOriginal(baseMonster.abilities) : null,
    [baseMonster],
  );

  const signatureOptions = useMemo(
    () => (baseMonster ? getSignatureAttackOptions(baseMonster) : []),
    [baseMonster],
  );

  const traitOptions = useMemo(
    () => (baseMonster ? getTraitOptions(baseMonster) : []),
    [baseMonster],
  );

  const creatureOptions = useMemo(
    () => (baseMonster ? getCreatureFeatureOptions(baseMonster) : []),
    [baseMonster],
  );

  const featuresForLevel = useMemo(
    () => classFeatures.filter((f) => f.level <= draft.level),
    [classFeatures, draft.level],
  );

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        Cargando monstruos y reglas de Monstie Sidekick…
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={generateRandom}>
            <Dices className="h-4 w-4 mr-1.5" />
            Generar aleatorio
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={resetDraft}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reiniciar
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Configuración
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Monstruo base (MHMM)
              </span>
              <Select
                value={draft.baseMonsterName}
                onChange={(e) => selectBaseMonster(e.target.value)}
              >
                <option value="">— Elegir monstruo —</option>
                {eligibleMonsters.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                    {m.group?.length ? ` (${m.group[0]})` : ""}
                  </option>
                ))}
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {eligibleMonsters.length} monstruos elegibles (sin Elder Dragon
                ni Paragon).
              </p>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Nombre del Monstie
              </span>
              <Input
                value={draft.customName}
                onChange={(e) => setDraft({ customName: e.target.value })}
                placeholder="Ej. Rajang Monstie"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Nivel (1–20)
              </span>
              <Select
                value={String(draft.level)}
                onChange={(e) => setDraft({ level: Number(e.target.value) })}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Nivel {lvl} (PB +{getSidekickProficiencyBonus(lvl)})
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Signature Attack
              </span>
              <Select
                value={draft.signatureAttackName}
                onChange={(e) =>
                  setDraft({ signatureAttackName: e.target.value })
                }
                disabled={!baseMonster}
              >
                <option value="">— Seleccionar —</option>
                {signatureOptions.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          {mappedAbilities && (
            <div className="rounded-md bg-muted/30 border border-border px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1">
                Features (array 15, 14, 13, 12, 10, 8 according to the original
                monster)
              </p>
              <p className="text-sm font-mono text-foreground">
                {formatAbilityScoresLine(mappedAbilities)}
              </p>
            </div>
          )}
        </div>

        {baseMonster && (
          <>
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Skill Proficiencies
                </h4>
                <Badge variant="outline" className="text-xs">
                  {draft.selectedSkills.length}/{maxSkillSlots}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(baseMonster.skills) as SkillKey[]).map((key) => (
                  <OptionChip
                    key={key}
                    label={SKILL_LABELS[key] ?? key}
                    selected={draft.selectedSkills.includes(key)}
                    disabled={
                      !draft.selectedSkills.includes(key) &&
                      draft.selectedSkills.length >= maxSkillSlots
                    }
                    onClick={() => toggleSkill(key)}
                  />
                ))}
                {Object.keys(baseMonster.skills).length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    The base monster has no skills in its stat block.
                  </p>
                )}
              </div>
            </div>

            {maxTraitSlots > 0 && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Monstie Traits
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {draft.selectedTraits.length}/{maxTraitSlots}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {traitOptions.map((t) => (
                    <OptionChip
                      key={t.name}
                      label={t.name}
                      selected={draft.selectedTraits.includes(t.name)}
                      disabled={
                        !draft.selectedTraits.includes(t.name) &&
                        draft.selectedTraits.length >= maxTraitSlots
                      }
                      onClick={() => toggleTrait(t.name)}
                    />
                  ))}
                </div>
              </div>
            )}

            {maxCreatureSlots > 0 && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Creature (traits / actions)
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {draft.selectedCreatureFeatures.length}/{maxCreatureSlots}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {creatureOptions.map((c) => (
                    <OptionChip
                      key={c.name}
                      label={c.name}
                      selected={draft.selectedCreatureFeatures.includes(c.name)}
                      disabled={
                        !draft.selectedCreatureFeatures.includes(c.name) &&
                        draft.selectedCreatureFeatures.length >=
                          maxCreatureSlots
                      }
                      onClick={() => toggleCreatureFeature(c.name)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {featuresForLevel.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Class features up to level {draft.level}
            </h4>
            <div className="space-y-3 max-h-64 overflow-auto pr-1">
              {featuresForLevel.map((f) => (
                <div
                  key={`${f.name}-${f.level}`}
                  className="border-l-2 border-primary/40 pl-3"
                >
                  <p className="text-sm font-medium text-primary">
                    {f.name}{" "}
                    <span className="text-muted-foreground font-normal">
                      (niv. {f.level})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">
                    {f.entries[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="xl:sticky xl:top-4 xl:self-start">
        <div className="rounded-lg border-2 border-amber-800/40 bg-gradient-to-b from-amber-950/20 to-card p-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">
            Preview
          </h3>
          {builtMonstie ? (
            <MonsterStatBlock monster={builtMonstie} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose a base monster from the Monster Manual to generate the stat
              block of your monstie sidekick.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
