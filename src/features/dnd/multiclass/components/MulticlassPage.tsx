import { GitMerge } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useClassList } from "@/features/dnd/classes/hooks/useClassList";
import { MulticlassRulesPanel } from "./MulticlassRulesPanel";
import { MulticlassSpellSlotCalculator } from "./MulticlassSpellSlotCalculator";
import { MulticlassClassRequirementsTable } from "./MulticlassClassRequirementsTable";

export function MulticlassPage() {
  const { listClasses, loading } = useClassList();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-start gap-3">
          <GitMerge className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Multiclassing
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Official D&amp;D 5e multiclass rules, per-class prerequisites and
              proficiencies, and an automatic spell slot calculator based on your
              class levels (full, half, and third casters).
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <Tabs defaultValue="rules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="calculator">Spell Slot Calculator</TabsTrigger>
            <TabsTrigger value="requirements">Class Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <MulticlassRulesPanel />
          </TabsContent>

          <TabsContent value="calculator">
            <MulticlassSpellSlotCalculator classes={listClasses} />
          </TabsContent>

          <TabsContent value="requirements" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ability score minimums and proficiencies gained when multiclassing
              into each official class. Click a class name to open its full
              detail page.
            </p>
            <MulticlassClassRequirementsTable
              classes={listClasses}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
