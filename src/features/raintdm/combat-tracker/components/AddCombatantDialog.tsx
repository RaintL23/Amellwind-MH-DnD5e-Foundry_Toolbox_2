import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Combatant } from "../utils/combat-tracker.types";
import { CombatantForm } from "./CombatantForm";
import { CompendiumMonsterPicker } from "./CompendiumMonsterPicker";

interface AddCombatantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: string[];
  onAdd: (combatants: Combatant[]) => void;
}

export function AddCombatantDialog({
  open,
  onOpenChange,
  existingNames,
  onAdd,
}: AddCombatantDialogProps) {
  function handleAdd(combatants: Combatant[]) {
    onAdd(combatants);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add combatant</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Tabs defaultValue="compendium">
            <TabsList className="mb-3">
              <TabsTrigger value="compendium">Compendium</TabsTrigger>
              <TabsTrigger value="pc">PC</TabsTrigger>
              <TabsTrigger value="npc">Custom NPC</TabsTrigger>
            </TabsList>
            <TabsContent value="compendium">
              <CompendiumMonsterPicker
                existingNames={existingNames}
                onAdd={handleAdd}
              />
            </TabsContent>
            <TabsContent value="pc">
              <CombatantForm
                kind="pc"
                onSubmit={(c) => {
                  handleAdd([c]);
                  onOpenChange(false);
                }}
              />
            </TabsContent>
            <TabsContent value="npc">
              <CombatantForm
                kind="npc"
                onSubmit={(c) => {
                  handleAdd([c]);
                  onOpenChange(false);
                }}
              />
            </TabsContent>
          </Tabs>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
