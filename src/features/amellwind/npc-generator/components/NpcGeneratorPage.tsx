import { UserCog } from "lucide-react";
import { NpcCreatorProvider } from "../context/NpcCreatorContext";
import { NpcCreatorPanel } from "./NpcCreatorPanel";

export function NpcGeneratorPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <UserCog className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">NPC Generator</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Generate humanoid NPC stat blocks for your Amellwind Monster Hunter
          campaign. Combine MH species, guild backgrounds, and combat templates
          scaled by hit dice.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <NpcCreatorProvider>
            <NpcCreatorPanel />
          </NpcCreatorProvider>
        </div>
      </div>
    </div>
  );
}
