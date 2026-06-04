import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { NpcDraft } from "@/shared/types/npc.types";
import {
  BACKGROUND_FACTION_LABELS,
  SPECIES_CATEGORY_LABELS,
} from "@/shared/types";
import {
  HIT_DIE_OPTIONS,
  NPC_ATTRIBUTE_ARRAY_LABELS,
  NPC_GENDER_LABELS,
  NPC_HIDE_FEATURES_LABELS,
  NPC_TEMPLATE_CATEGORY_LABELS,
  type NpcTemplateCategory,
} from "@/shared/types/npc.types";
import { useNpcCreator } from "../context/NpcCreatorContext";
import { NPC_TEMPLATE_TIER_LABELS } from "../data/npc-power-scaling.data";
import {
  formatHitDiceOptionLabel,
  getHitDiceOptionsForTier,
  resolveNpcPowerProfile,
} from "../utils/npc-power-scaling";

function RandomizeButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9 shrink-0"
      onClick={onClick}
      title={`Randomize ${label}`}
      aria-label={`Randomize ${label}`}
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  );
}

function FieldRow({
  label,
  onRandomize,
  children,
}: {
  label: string;
  onRandomize?: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">{children}</div>
        {onRandomize && <RandomizeButton onClick={onRandomize} label={label} />}
      </div>
    </label>
  );
}

const TEMPLATE_CATEGORIES: NpcTemplateCategory[] = [
  "strength-combatant",
  "dexterity-combatant",
  "non-combatant",
  "caster",
  "support",
];

export function NpcFormFields() {
  const { species, backgrounds, templates, draft, setDraft, randomizeField } =
    useNpcCreator();

  const templatesByCategory = TEMPLATE_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = templates.filter((t) => t.category === cat);
      return acc;
    },
    {} as Record<NpcTemplateCategory, typeof templates>,
  );

  const speciesGroups = Object.entries(SPECIES_CATEGORY_LABELS).map(
    ([key, label]) => ({
      key,
      label,
      items: species.filter((s) => s.category === key),
    }),
  );

  const backgroundGroups = Object.entries(BACKGROUND_FACTION_LABELS).map(
    ([key, label]) => ({
      key,
      label,
      items: backgrounds.filter((b) => b.faction === key),
    }),
  );

  const selectedTemplate = templates.find((t) => t.id === draft.templateId);
  const templateTier = selectedTemplate?.tier ?? 2;
  const hitDiceOptions = getHitDiceOptionsForTier(templateTier);
  const powerPreview = resolveNpcPowerProfile(templateTier, draft.hitDiceCount);

  return (
    <div className="space-y-4">
      <FieldRow
        label="Character Name"
        onRandomize={() => randomizeField("customName")}
      >
        <Input
          value={draft.customName}
          onChange={(e) => setDraft({ customName: e.target.value })}
          placeholder="Leave blank for auto-generated name"
        />
      </FieldRow>

      <FieldRow
        label="Character Gender"
        onRandomize={() => randomizeField("gender")}
      >
        <Select
          value={draft.gender}
          onChange={(e) =>
            setDraft({ gender: e.target.value as NpcDraft["gender"] })
          }
        >
          <option value="random">Random</option>
          {Object.entries(NPC_GENDER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FieldRow>

      <FieldRow
        label="Template"
        onRandomize={() => randomizeField("templateId")}
      >
        <Select
          value={draft.templateId}
          onChange={(e) => setDraft({ templateId: e.target.value })}
        >
          <option value="">— Select template —</option>
          {TEMPLATE_CATEGORIES.map((cat) => {
            const items = templatesByCategory[cat];
            if (!items.length) return null;
            return (
              <optgroup
                key={cat}
                label={NPC_TEMPLATE_CATEGORY_LABELS[cat]}
              >
                {items.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </Select>
      </FieldRow>

      <FieldRow label="Species" onRandomize={() => randomizeField("speciesId")}>
        <Select
          value={draft.speciesId}
          onChange={(e) => setDraft({ speciesId: e.target.value })}
        >
          <option value="">— Select species —</option>
          {speciesGroups.map(({ key, label, items }) => {
            if (!items.length) return null;
            return (
              <optgroup key={key} label={label}>
                {items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.parentSpecies ? ` (${s.parentSpecies})` : ""}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </Select>
      </FieldRow>

      <FieldRow
        label="Background"
        onRandomize={() => randomizeField("backgroundId")}
      >
        <Select
          value={draft.backgroundId}
          onChange={(e) => setDraft({ backgroundId: e.target.value })}
        >
          <option value="">— None —</option>
          {backgroundGroups.map(({ key, label, items }) => {
            if (!items.length) return null;
            return (
              <optgroup key={key} label={label}>
                {items.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </Select>
      </FieldRow>

      <FieldRow
        label="Attribute Array"
        onRandomize={() => randomizeField("attributeArray")}
      >
        <Select
          value={draft.attributeArray}
          onChange={(e) =>
            setDraft({
              attributeArray: e.target.value as NpcDraft["attributeArray"],
            })
          }
        >
          {Object.entries(NPC_ATTRIBUTE_ARRAY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FieldRow>

      <FieldRow
        label="Number of Hit Dice"
        onRandomize={() => randomizeField("hitDiceCount")}
      >
        <div className="space-y-1.5">
          <Select
            value={String(draft.hitDiceCount)}
            onChange={(e) =>
              setDraft({ hitDiceCount: Number(e.target.value) })
            }
          >
            {hitDiceOptions.map((n) => (
              <option key={n} value={n}>
                {formatHitDiceOptionLabel(templateTier, n)}
              </option>
            ))}
          </Select>
          {selectedTemplate && (
            <p className="text-[11px] text-muted-foreground leading-snug">
              {NPC_TEMPLATE_TIER_LABELS[templateTier] ?? `Tier ${templateTier + 1}`}
              {" · "}
              MM baseline: {powerPreview.mmReference}
              {" · "}
              MH gear: {powerPreview.weaponRarityLabel}
              {powerPreview.statBoost > 0 && (
                <>
                  {" · "}
                  +{powerPreview.statBoost} primary/Con
                </>
              )}
              {powerPreview.attackHitBonus > 0 && (
                <>
                  {" · "}
                  +{powerPreview.attackHitBonus} hit
                </>
              )}
              {powerPreview.bonusDamageDice > 0 && (
                <>
                  {" · "}
                  +{powerPreview.bonusDamageDice} damage die
                </>
              )}
              {powerPreview.flatDamageBonus > 0 && (
                <>
                  {" · "}
                  +{powerPreview.flatDamageBonus} damage
                </>
              )}
            </p>
          )}
        </div>
      </FieldRow>

      <FieldRow
        label="Hit Dice"
        onRandomize={() => randomizeField("hitDie")}
      >
        <Select
          value={String(draft.hitDie)}
          onChange={(e) =>
            setDraft({ hitDie: Number(e.target.value) as NpcDraft["hitDie"] })
          }
        >
          {HIT_DIE_OPTIONS.map(({ die, label }) => (
            <option key={die} value={die}>
              {label}
            </option>
          ))}
        </Select>
      </FieldRow>

      <FieldRow
        label="Hide Features"
        onRandomize={() => randomizeField("hideFeatures")}
      >
        <Select
          value={draft.hideFeatures}
          onChange={(e) =>
            setDraft({
              hideFeatures: e.target.value as NpcDraft["hideFeatures"],
            })
          }
        >
          {Object.entries(NPC_HIDE_FEATURES_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FieldRow>
    </div>
  );
}
