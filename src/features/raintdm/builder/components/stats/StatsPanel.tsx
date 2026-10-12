import { useState, type ReactNode } from "react";
import { Dices, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useBuilderUiMode } from "../../context/BuilderUiModeContext";
import { pickRandomCharacterName } from "../../utils/randomizer/identity-randomizer.utils";
import {
  parseAlignmentAxes,
} from "../../utils/alignment.utils";
import { getFeatSlotLevels } from "../../utils/builder-class.utils";
import { AbilityScoresSection } from "./ability-scores/AbilityScoresSection";
import { BuilderPanel } from "../shared/BuilderPanel";
import { ConfirmActionDialog } from "../shared/ConfirmActionDialog";
import { MulticlassPanel } from "./MulticlassPanel";
import { NumberStepper } from "../shared";

function ActionTooltipContent({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <TooltipContent side="bottom" className="max-w-56 space-y-0.5">
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-[11px] leading-snug text-muted-foreground">
        {description}
      </p>
    </TooltipContent>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
      {children}
    </p>
  );
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-[11px] font-medium text-muted-foreground"
    >
      {children}
    </Label>
  );
}

type PendingConfirm =
  | { kind: "level"; nextLevel: number; lostFeatSlots: number }
  | { kind: "multiclass-off" };

export function StatsPanel() {
  const {
    character,
    setName,
    setCreatureSize,
    setLawChaosAlignment,
    setGoodEvilAlignment,
    setLevel,
    multiclassEnabled,
    setMulticlassEnabled,
    featSelections,
    class: classSelection,
    species,
  } = useCharacterBuilder();
  const { isSimple } = useBuilderUiMode();
  const { lawChaos, goodEvil } = parseAlignmentAxes(character.alignment);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );
  const [rollingName, setRollingName] = useState(false);

  async function handleRandomName() {
    setRollingName(true);
    try {
      setName(await pickRandomCharacterName(species?.name ?? null));
    } catch {
      toast.error("Could not generate a random name");
    } finally {
      setRollingName(false);
    }
  }

  function handleLevelChange(nextLevel: number) {
    if (multiclassEnabled) return;
    if (nextLevel >= character.level) {
      setLevel(nextLevel);
      return;
    }
    const className = classSelection?.name ?? "";
    const currentSlots = getFeatSlotLevels(className, character.level).length;
    const nextSlots = getFeatSlotLevels(className, nextLevel).length;
    const filledBeyond = featSelections.slice(nextSlots).filter(Boolean).length;
    if (filledBeyond > 0 || currentSlots > nextSlots) {
      setPendingConfirm({
        kind: "level",
        nextLevel,
        lostFeatSlots: Math.max(filledBeyond, currentSlots - nextSlots),
      });
      return;
    }
    setLevel(nextLevel);
  }

  function handleMulticlassToggle(checked: boolean) {
    if (checked) {
      setMulticlassEnabled(true);
      return;
    }
    if (multiclassEnabled) {
      setPendingConfirm({ kind: "multiclass-off" });
      return;
    }
    setMulticlassEnabled(false);
  }

  function runPendingConfirm() {
    if (!pendingConfirm) return;
    switch (pendingConfirm.kind) {
      case "level":
        setLevel(pendingConfirm.nextLevel);
        toast.message(
          pendingConfirm.lostFeatSlots > 0
            ? `Level set to ${pendingConfirm.nextLevel} · ${pendingConfirm.lostFeatSlots} feat pick${pendingConfirm.lostFeatSlots === 1 ? "" : "s"} removed`
            : `Level set to ${pendingConfirm.nextLevel}`,
        );
        break;
      case "multiclass-off":
        setMulticlassEnabled(false);
        toast.message("Multiclass disabled");
        break;
    }
  }

  const confirmCopy =
    pendingConfirm?.kind === "level"
          ? {
              title: `Lower level to ${pendingConfirm.nextLevel}?`,
              description:
                "Lowering level removes feat slots and optional features that no longer apply.",
              confirmLabel: "Lower level",
              lossItems: [
                `${pendingConfirm.lostFeatSlots} feat pick${pendingConfirm.lostFeatSlots === 1 ? "" : "s"} may be removed`,
              ],
            }
          : pendingConfirm?.kind === "multiclass-off"
            ? {
                title: "Disable multiclass?",
                description:
                  "Additional class entries will be cleared and total level stays on your primary class.",
                confirmLabel: "Disable multiclass",
              }
              : null;

  return (
    <TooltipProvider delayDuration={300}>
      <BuilderPanel
        sectionId="ability-scores"
        title={
          <>
            <User className="h-3.5 w-3.5" aria-hidden /> Character
          </>
        }
      >
        <div className="space-y-4">
          {/* ─── Identity ─── */}
          <section className="space-y-2.5">
            <div className="space-y-1">
              <FieldLabel htmlFor="character-name">Name</FieldLabel>
              <div className="flex items-center gap-1">
                <Input
                  id="character-name"
                  type="text"
                  value={character.name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Character name"
                  className="h-8 text-xs"
                  aria-label="Character name"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={rollingName}
                      onClick={() => void handleRandomName()}
                      aria-label="Random name"
                    >
                      <Dices
                        className={cn(
                          "h-3.5 w-3.5",
                          rollingName && "animate-spin",
                        )}
                        aria-hidden
                      />
                    </Button>
                  </TooltipTrigger>
                  <ActionTooltipContent
                    title="Random name"
                    description="Roll a new name only, without touching the rest of the build. Uses the selected species' name list when available."
                  />
                </Tooltip>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <FieldLabel htmlFor="character-size">Size</FieldLabel>
                <Select
                  id="character-size"
                  value={character.size === "S" ? "S" : "M"}
                  onChange={(e) => setCreatureSize(e.target.value as "M" | "S")}
                  className="h-8 w-full px-2 text-xs"
                  aria-label="Creature size"
                >
                  <option value="M">Medium</option>
                  <option value="S">Small</option>
                </Select>
              </div>
              <div className="space-y-1">
                <FieldLabel>
                  {multiclassEnabled ? "Total level" : "Level"}
                </FieldLabel>
                <div className="flex h-8 items-center">
                  <NumberStepper
                    value={character.level}
                    min={1}
                    max={20}
                    onChange={handleLevelChange}
                    ariaLabel="Level"
                    disabled={multiclassEnabled}
                    title={
                      multiclassEnabled
                        ? "Adjust levels in the multiclass section below"
                        : undefined
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <FieldLabel htmlFor="alignment-law-chaos">
                  Law / Chaos
                </FieldLabel>
                <Select
                  id="alignment-law-chaos"
                  value={lawChaos}
                  onChange={(e) =>
                    setLawChaosAlignment(e.target.value as "L" | "N" | "C")
                  }
                  className="h-8 w-full px-2 text-xs"
                  aria-label="Lawful, neutral, or chaotic alignment"
                >
                  <option value="L">Lawful</option>
                  <option value="N">Neutral</option>
                  <option value="C">Chaotic</option>
                </Select>
              </div>
              <div className="space-y-1">
                <FieldLabel htmlFor="alignment-good-evil">
                  Good / Evil
                </FieldLabel>
                <Select
                  id="alignment-good-evil"
                  value={goodEvil}
                  onChange={(e) =>
                    setGoodEvilAlignment(e.target.value as "G" | "N" | "E")
                  }
                  className="h-8 w-full px-2 text-xs"
                  aria-label="Good, neutral, or evil alignment"
                >
                  <option value="G">Good</option>
                  <option value="N">Neutral</option>
                  <option value="E">Evil</option>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          <AbilityScoresSection compact />

          {/* ─── Class progression (advanced; always shown while in use) ─── */}
          {(!isSimple || multiclassEnabled) && (
            <section className="space-y-2">
              <SectionHeading>Class progression</SectionHeading>
              <div className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
                <Checkbox
                  id="multiclass-toggle"
                  checked={multiclassEnabled}
                  onCheckedChange={(checked) =>
                    handleMulticlassToggle(checked === true)
                  }
                  className="mt-0.5 h-3.5 w-3.5"
                  aria-label="Activate multiclass"
                />
                <div className="min-w-0 space-y-0.5">
                  <Label
                    htmlFor="multiclass-toggle"
                    className="cursor-pointer text-xs font-medium text-foreground"
                  >
                    Multiclass
                  </Label>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Split your total level across two or more classes (D&amp;D
                    5e rules). An advanced option — most first characters use
                    a single class.
                  </p>
                </div>
              </div>
              <MulticlassPanel />
            </section>
          )}
        </div>
      </BuilderPanel>

      {confirmCopy && (
        <ConfirmActionDialog
          open={pendingConfirm !== null}
          onOpenChange={(open) => {
            if (!open) setPendingConfirm(null);
          }}
          title={confirmCopy.title}
          description={confirmCopy.description}
          lossItems={
            "lossItems" in confirmCopy ? confirmCopy.lossItems : undefined
          }
          confirmLabel={confirmCopy.confirmLabel}
          onConfirm={runPendingConfirm}
        />
      )}
    </TooltipProvider>
  );
}
