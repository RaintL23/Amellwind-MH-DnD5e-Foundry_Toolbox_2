import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Lightbulb, ExternalLink } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  getDndLevelBracket,
  getLevelBracket,
} from "@/shared/utils/guide-text.utils";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import {
  BUILDER_WORKFLOW_STEPS,
  DND_BUILDER_WORKFLOW_STEPS,
  DND_STARTING_EQUIPMENT_TABLE,
  STARTING_ARMOR_TABLE,
  STARTING_MATERIALS_TABLE,
  STARTING_WEALTH_TABLE,
  STARTING_WEAPONS_TABLE,
} from "@/features/character-guide/data/character-guide.data";
const GuideTable = lazy(() =>
  import("@/features/character-guide/components/GuideTable").then((m) => ({
    default: m.GuideTable,
  })),
);

function findTableRow(table: { rows: string[][] }, bracket: string) {
  return table.rows.find((row) => row[0] === bracket);
}

export function CharacterCreationTipsPanel() {
  const [open, setOpen] = useState(false);
  const { character, useAmellwindHomebrew } = useCharacterBuilder();
  const levelBracket = getLevelBracket(character.level);
  const dndLevelBracket = getDndLevelBracket(character.level);

  const amellwindRecommendations = useMemo(() => {
    const wealth = findTableRow(STARTING_WEALTH_TABLE, levelBracket);
    const weapons = findTableRow(STARTING_WEAPONS_TABLE, levelBracket);
    const armor = findTableRow(STARTING_ARMOR_TABLE, levelBracket);
    const materials = findTableRow(STARTING_MATERIALS_TABLE, levelBracket);
    return { wealth, weapons, armor, materials };
  }, [levelBracket]);

  const dndRecommendations = useMemo(() => {
    const equipment = findTableRow(DND_STARTING_EQUIPMENT_TABLE, dndLevelBracket);
    return { equipment };
  }, [dndLevelBracket]);

  const workflowSteps = useAmellwindHomebrew
    ? BUILDER_WORKFLOW_STEPS
    : DND_BUILDER_WORKFLOW_STEPS;

  const panelTitle = useAmellwindHomebrew
    ? "Amellwind Character Creation Tips"
    : "D&D Character Creation Tips";

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-primary/10 transition-colors"
      >
        <Lightbulb className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground flex-1">
          {panelTitle}
        </span>
        {useAmellwindHomebrew && (
          <Link
            to="/character-guide"
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:inline-flex items-center gap-1 text-xs text-primary hover:underline mr-2"
          >
            Full guide
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-4 border-t border-primary/10">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Suggested workflow
              </h3>
              <ol className="space-y-2">
                {workflowSteps.map((step) => (
                  <li key={step.step} className="flex gap-2 text-sm">
                    <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                      {step.step}
                    </span>
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">
                        {step.title}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        — {step.description}
                      </span>
                      {step.link && (
                        <>
                          {" "}
                          <Link
                            to={step.link.to}
                            className="text-primary hover:underline whitespace-nowrap"
                          >
                            {step.link.label}
                          </Link>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {character.level > 1 && useAmellwindHomebrew && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Starting gear for level {character.level} ({levelBracket})
                </h3>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-md border border-border bg-card/80 p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      Wealth
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {amellwindRecommendations.wealth?.[1] ?? "—"}
                    </p>
                    <p className="text-xs font-medium text-foreground pt-1">
                      Weapons
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {amellwindRecommendations.weapons?.[1] ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Materials: {amellwindRecommendations.weapons?.[2] ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-card/80 p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      Armor materials
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {amellwindRecommendations.armor?.[1] ?? "—"}
                    </p>
                    <p className="text-xs font-medium text-foreground pt-1">
                      Monster materials
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {amellwindRecommendations.materials?.[1] ?? "—"} starting
                      materials
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Suspense fallback={null}>
                    <GuideTable
                      table={STARTING_WEAPONS_TABLE}
                      highlightRow={levelBracket}
                    />
                  </Suspense>
                </div>
              </div>
            )}

            {character.level > 1 && !useAmellwindHomebrew && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Starting equipment for level {character.level} ({dndLevelBracket})
                </h3>
                <div className="rounded-md border border-border bg-card/80 p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">
                    Equipment and money
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dndRecommendations.equipment?.[1] ?? "—"}
                  </p>
                  <p className="text-xs font-medium text-foreground pt-1">
                    Magic items
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dndRecommendations.equipment?.[2] ?? "—"}
                  </p>
                </div>
                <div className="mt-3">
                  <Suspense fallback={null}>
                    <GuideTable
                      table={DND_STARTING_EQUIPMENT_TABLE}
                      highlightRow={dndLevelBracket}
                    />
                  </Suspense>
                </div>
                <p className="mt-2 text-xs text-muted-foreground italic">
                  The DM decides whether your character starts with more than
                  standard level-1 equipment. These values are a guide only.
                </p>
              </div>
            )}

            {useAmellwindHomebrew && (
              <p className="text-xs text-muted-foreground italic">
                All options in Amellwind&apos;s Guide require DM approval.
                Artificers gain extra material slots instead of extra attunements
                at levels 10, 14, and 18.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
