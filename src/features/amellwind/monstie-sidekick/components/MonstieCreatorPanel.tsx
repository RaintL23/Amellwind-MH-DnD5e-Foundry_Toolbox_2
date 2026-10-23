import { useMemo } from "react";
import { Dices, Minus, Plus, RotateCcw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { ABILITY_KEYS } from "@/shared/utils/ability-scores";
import { formatModifier, getAbilityModifier } from "@/shared/utils/cr.utils";
import { ABILITY_ABBREVIATIONS, SKILL_LABELS } from "@/shared/constants/dnd";
import { MonsterStatBlock } from "@/features/amellwind/monsters/components/MonsterStatBlock";
import { useMonstieCreator } from "../context/MonstieCreatorContext";
import { hasRulesSignatureAttack } from "../utils/monstie-actions";
import {
  getSidekickProficiencyBonus,
  hasMonstieSavingThrows,
  MONSTIE_ABILITY_CAP,
  sumAbilityIncreases,
} from "../utils/monstie-stats";

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

function SectionCard({
  title,
  badge,
  hint,
  children,
}: {
  title: string;
  badge?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {badge && (
          <Badge variant="outline" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export function MonstieCreatorPanel() {
  const {
    loading,
    eligibleMonsters,
    draft,
    baseMonster,
    choices,
    builtMonstie,
    classFeatures,
    setDraft,
    setLevel,
    selectBaseMonster,
    toggleSkill,
    toggleTrait,
    toggleCreatureFeature,
    changeAbilityIncrease,
    generateRandom,
    resetDraft,
  } = useMonstieCreator();

  const featuresForLevel = useMemo(
    () => classFeatures.filter((f) => f.level <= draft.level),
    [classFeatures, draft.level],
  );

  const pointsUsed = choices ? sumAbilityIncreases(choices.abilityIncreases) : 0;
  const rulesSignature = baseMonster ? hasRulesSignatureAttack(baseMonster) : true;
  const showSaveFallback =
    choices !== null &&
    hasMonstieSavingThrows(choices.level) &&
    !choices.baseHasSaves;

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        Loading monsters and Monstie Sidekick rules...
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
      <div className="space-y-5 min-w-0">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={generateRandom}>
            <Dices className="h-4 w-4 mr-1.5" />
            Generate random
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={resetDraft}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Configuration
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Original monster (MHMM)
              </span>
              <Select
                value={draft.baseMonsterName}
                onChange={(e) => selectBaseMonster(e.target.value)}
              >
                <option value="">— Choose monster —</option>
                {eligibleMonsters.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                    {m.group?.length ? ` (${m.group[0]})` : ""}
                  </option>
                ))}
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {eligibleMonsters.length} eligible monsters (no Elder Dragons,
                Paragons or tempered versions).
              </p>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Monstie name
              </span>
              <Input
                value={draft.customName}
                onChange={(e) => setDraft({ customName: e.target.value })}
                placeholder="Example: Rajang Monstie"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Level (1–20)
              </span>
              <Select
                value={String(draft.level)}
                onChange={(e) => setLevel(Number(e.target.value))}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Level {lvl} (Proficiency Bonus +
                    {getSidekickProficiencyBonus(lvl)})
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Attack (template action)
              </span>
              <Select
                value={draft.baseAttackName}
                onChange={(e) => setDraft({ baseAttackName: e.target.value })}
                disabled={!choices || choices.baseAttackOptions.length === 0}
              >
                <option value="">— Choose —</option>
                {choices?.baseAttackOptions.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">
                Signature Attack
              </span>
              <Select
                value={draft.signatureAttackName}
                onChange={(e) =>
                  setDraft({ signatureAttackName: e.target.value })
                }
                disabled={!choices || choices.signatureOptions.length === 0}
              >
                <option value="">— Choose —</option>
                {choices?.signatureOptions.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </Select>
              {!rulesSignature && (
                <p className="text-[11px] text-amber-500">
                  The original monster has no recharge or limited-use action.
                  Agree on a signature attack with your DM.
                </p>
              )}
            </label>
          </div>
        </div>

        {choices && (
          <>
            <SectionCard
              title="Ability Scores"
              badge={`${pointsUsed}/${choices.abilityBudget} points`}
              hint="Array 15, 14, 13, 12, 10, 8 placed like the original monster. Points come from Ability Score Improvements and feature fallbacks (max 20)."
            >
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ABILITY_KEYS.map((key) => {
                  const bonus = choices.abilityIncreases[key] ?? 0;
                  const score = choices.abilities[key];
                  return (
                    <div
                      key={key}
                      className="rounded-md border border-border bg-muted/30 px-2 py-1.5 text-center"
                    >
                      <p className="text-[11px] font-bold text-muted-foreground">
                        {ABILITY_ABBREVIATIONS[key]}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {score}{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          ({formatModifier(getAbilityModifier(score))})
                        </span>
                      </p>
                      {choices.abilityBudget > 0 && (
                        <div className="mt-1 flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            disabled={bonus <= 0}
                            onClick={() => changeAbilityIncrease(key, -1)}
                            aria-label={`Decrease ${ABILITY_ABBREVIATIONS[key]}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            disabled={
                              pointsUsed >= choices.abilityBudget ||
                              score >= MONSTIE_ABILITY_CAP
                            }
                            onClick={() => changeAbilityIncrease(key, 1)}
                            aria-label={`Increase ${ABILITY_ABBREVIATIONS[key]}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="Monstie Proficiencies"
              badge={`${choices.selectedSkills.length}/${choices.maxSkillSlots}`}
            >
              <div className="flex flex-wrap gap-1.5">
                {choices.skillOptions.map((key) => (
                  <OptionChip
                    key={key}
                    label={SKILL_LABELS[key] ?? key}
                    selected={choices.selectedSkills.includes(key)}
                    disabled={
                      !choices.selectedSkills.includes(key) &&
                      choices.selectedSkills.length >= choices.maxSkillSlots
                    }
                    onClick={() => toggleSkill(key)}
                  />
                ))}
                {choices.skillOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    The original monster has no skills in its stat block.
                  </p>
                )}
              </div>
            </SectionCard>

            {choices.level >= 2 && (
              <SectionCard
                title="Monstie Traits"
                badge={`${choices.selectedTraits.length}/${choices.maxTraitSlots}`}
                hint={
                  choices.traitOptions.length === 0
                    ? "The original monster has no non-damage traits: each Monstie Trait grants +1 ability point instead."
                    : undefined
                }
              >
                <div className="flex flex-wrap gap-1.5">
                  {choices.traitOptions.map((t) => (
                    <OptionChip
                      key={t.name}
                      label={t.name}
                      selected={choices.selectedTraits.includes(t.name)}
                      disabled={
                        !choices.selectedTraits.includes(t.name) &&
                        choices.selectedTraits.length >= choices.maxTraitSlots
                      }
                      onClick={() => toggleTrait(t.name)}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {choices.maxCreatureSlots > 0 && (
              <SectionCard
                title="Creature (traits / actions)"
                badge={`${choices.selectedCreatureFeatures.length}/${choices.maxCreatureSlots}`}
              >
                <div className="flex flex-wrap gap-1.5">
                  {choices.creatureOptions.map((c) => (
                    <OptionChip
                      key={c.name}
                      label={c.name}
                      selected={choices.selectedCreatureFeatures.includes(c.name)}
                      disabled={
                        !choices.selectedCreatureFeatures.includes(c.name) &&
                        choices.selectedCreatureFeatures.length >=
                          choices.maxCreatureSlots
                      }
                      onClick={() => toggleCreatureFeature(c.name)}
                    />
                  ))}
                  {choices.creatureOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No remaining traits or actions qualify.
                    </p>
                  )}
                </div>
              </SectionCard>
            )}

            {showSaveFallback && (
              <SectionCard
                title="Saving Throws (7th level)"
                hint="The original monster has no saving throw proficiencies: gain one of its condition immunities, or +2 ability points."
              >
                <Select
                  value={draft.saveFallbackCondition}
                  onChange={(e) =>
                    setDraft({ saveFallbackCondition: e.target.value })
                  }
                >
                  <option value="">+2 ability points</option>
                  {choices.conditionImmunityOptions.map((c) => (
                    <option key={c} value={c}>
                      Immunity: {c}
                    </option>
                  ))}
                </Select>
              </SectionCard>
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
                      (lvl {f.level})
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

      <div className="xl:sticky xl:top-4 xl:self-start min-w-0">
        <div className="rounded-lg border-2 border-amber-800/40 bg-gradient-to-b from-amber-950/20 to-card p-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">
            Preview
          </h3>
          {builtMonstie ? (
            <>
              <h2 className="text-lg font-bold text-foreground mb-2">
                {builtMonstie.name}
              </h2>
              <MonsterStatBlock monster={builtMonstie} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose an original monster from the Monster Manual to generate the
              stat block of your monstie sidekick.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
