import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getDndLevelBracket,
  getLevelBracket,
} from "@/shared/utils/guide-text.utils";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import {
  BUILDER_WORKFLOW_STEPS,
  STARTING_ARMOR_TABLE,
  STARTING_MATERIALS_TABLE,
  STARTING_WEALTH_TABLE,
  STARTING_WEAPONS_TABLE,
} from "@/features/amellwind/character-guide/data/character-guide.data";
import {
  DND_BUILDER_WORKFLOW_STEPS,
  DND_STARTING_EQUIPMENT_TABLE,
} from "@/features/dnd/character-guide/data/dnd-character-guide.data";

const GuideTable = lazy(() =>
  import("@/features/amellwind/character-guide/components/GuideTable").then((m) => ({
    default: m.GuideTable,
  })),
);

function findTableRow(table: { rows: string[][] }, bracket: string) {
  return table.rows.find((row) => row[0] === bracket);
}

/** Tips button + dialog; content switches with Amellwind Homebrew on/off. */
export function CharacterCreationTipsPanel() {
  const { character, useAmellwindHomebrew } = useCharacterBuilder();
  const [open, setOpen] = useState(false);
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

  const dialogTitle = useAmellwindHomebrew
    ? "Amellwind Character Creation Tips"
    : "D&D Character Creation Tips";

  const guideHref = useAmellwindHomebrew
    ? "/character-guide"
    : "/dnd-character-guide";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-auto shrink-0 gap-1.5 self-stretch px-3 py-2"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Lightbulb className="h-3.5 w-3.5 text-primary" />
        Tips
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl gap-0 p-0">
          <DialogHeader className="p-5 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary shrink-0" />
              {dialogTitle}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Suggested workflow and starting gear for the current Builder mode
              {useAmellwindHomebrew ? " (Amellwind Homebrew)" : " (D&D 5e)"}.
            </DialogDescription>
            <Link
              to={guideHref}
              className="inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline"
            >
              Full guide
              <ExternalLink className="h-3 w-3" />
            </Link>
          </DialogHeader>

          <DialogBody className="space-y-4 px-5 pb-5">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suggested workflow
              </h3>
              <ol className="space-y-2">
                {workflowSteps.map((step) => (
                  <li key={step.step} className="flex gap-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
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
                            className="whitespace-nowrap text-primary hover:underline"
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
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Starting gear for level {character.level} ({levelBracket})
                </h3>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-2 rounded-md border border-border bg-card/80 p-3">
                    <p className="text-xs font-medium text-foreground">Wealth</p>
                    <p className="text-sm text-muted-foreground">
                      {amellwindRecommendations.wealth?.[1] ?? "—"}
                    </p>
                    <p className="pt-1 text-xs font-medium text-foreground">
                      Weapons
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {amellwindRecommendations.weapons?.[1] ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Materials: {amellwindRecommendations.weapons?.[2] ?? "—"}
                    </p>
                  </div>
                  <div className="space-y-2 rounded-md border border-border bg-card/80 p-3">
                    <p className="text-xs font-medium text-foreground">
                      Armor materials
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {amellwindRecommendations.armor?.[1] ?? "—"}
                    </p>
                    <p className="pt-1 text-xs font-medium text-foreground">
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
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Starting equipment for level {character.level} (
                  {dndLevelBracket})
                </h3>
                <div className="space-y-2 rounded-md border border-border bg-card/80 p-3">
                  <p className="text-xs font-medium text-foreground">
                    Equipment and money
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dndRecommendations.equipment?.[1] ?? "—"}
                  </p>
                  <p className="pt-1 text-xs font-medium text-foreground">
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
                <p className="mt-2 text-xs italic text-muted-foreground">
                  The DM decides whether your character starts with more than
                  standard level-1 equipment. These values are a guide only.
                </p>
              </div>
            )}

            {useAmellwindHomebrew && (
              <p className="text-xs italic text-muted-foreground">
                All options in Amellwind&apos;s Guide require DM approval.
                Artificers gain extra material slots instead of extra attunements
                at levels 10, 14, and 18.
              </p>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
