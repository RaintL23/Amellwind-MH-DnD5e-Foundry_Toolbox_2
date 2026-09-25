import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dices,
  Lock,
  LockOpen,
  Plus,
  Square,
  Swords,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CombatState } from "../utils/combat-tracker.types";

interface CombatToolbarProps {
  state: CombatState;
  activeName: string | null;
  selectedCount: number;
  initiativeEditable: boolean;
  onStart: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRollInitiative: (scope: "all" | "npcs") => void;
  onToggleInitiativeEdit: () => void;
  onAdd: () => void;
  onEnd: () => void;
  onApplyHpSelected: () => void;
}

export function CombatToolbar({
  state,
  activeName,
  selectedCount,
  initiativeEditable,
  onStart,
  onNext,
  onPrev,
  onRollInitiative,
  onToggleInitiativeEdit,
  onAdd,
  onEnd,
  onApplyHpSelected,
}: CombatToolbarProps) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const hasCombatants = state.combatants.length > 0;
  const hasNpcs = state.combatants.some((c) => c.kind === "npc");
  const canEditInitiative = !state.started || initiativeEditable;

  return (
    <>
      <div className="sticky top-0 z-10 space-y-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="tabular-nums">
            Round {state.round}
          </Badge>
          {state.started && activeName ? (
            <span className="text-sm text-muted-foreground">
              Turn:{" "}
              <span className="font-medium text-foreground">{activeName}</span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {state.started ? "No active turn" : "Setup — add combatants"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!state.started ? (
            <Button
              type="button"
              size="sm"
              disabled={!hasCombatants}
              onClick={onStart}
            >
              <Swords className="mr-1.5 h-4 w-4" />
              Start Combat
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onPrev}
                aria-label="Previous turn"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="md"
                className="min-w-28 font-semibold"
                onClick={onNext}
              >
                Next Turn
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!hasCombatants || !canEditInitiative}
                aria-haspopup="menu"
              >
                <Dices className="mr-1.5 h-4 w-4" />
                Roll Init
                <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => onRollInitiative("all")}>
                Roll for All
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!hasNpcs}
                onSelect={() => onRollInitiative("npcs")}
              >
                Roll for NPCs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {state.started ? (
            <Button
              type="button"
              size="sm"
              variant={initiativeEditable ? "secondary" : "outline"}
              onClick={onToggleInitiativeEdit}
              aria-pressed={initiativeEditable}
              title={
                initiativeEditable
                  ? "Lock initiative editing"
                  : "Unlock initiative editing"
              }
            >
              {initiativeEditable ? (
                <LockOpen className="mr-1.5 h-4 w-4" />
              ) : (
                <Lock className="mr-1.5 h-4 w-4" />
              )}
              {initiativeEditable ? "Lock Init" : "Edit Init"}
            </Button>
          ) : null}

          <Button type="button" size="sm" variant="outline" onClick={onAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>

          {selectedCount > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onApplyHpSelected}
            >
              Apply HP to {selectedCount}
            </Button>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto border-destructive/50 text-destructive hover:bg-destructive/10"
            disabled={!hasCombatants && !state.started}
            onClick={() => setConfirmEnd(true)}
          >
            <Square className="mr-1.5 h-3.5 w-3.5" />
            End Combat
          </Button>
        </div>
      </div>

      {state.started ? (
        <div className="fixed bottom-4 right-4 z-20 sm:hidden">
          <Button
            type="button"
            size="lg"
            className="shadow-lg"
            onClick={onNext}
          >
            Next Turn
          </Button>
        </div>
      ) : null}

      <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>End combat?</DialogTitle>
            <DialogDescription>
              This clears all combatants, HP, death saves, and round progress.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="pb-6">
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmEnd(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setConfirmEnd(false);
                  onEnd();
                }}
              >
                End Combat
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
