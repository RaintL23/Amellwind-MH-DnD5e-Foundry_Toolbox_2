import type { LevelTier } from "@/shared/types";

export function EncounterTable({ tier }: { tier: LevelTier }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-card/80">
            <th className="px-2 py-1.5 text-center text-muted-foreground font-medium w-10">
              d10
            </th>
            <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">
              Encounter
            </th>
          </tr>
        </thead>
        <tbody>
          {tier.encounters.map((enc) => (
            <tr
              key={enc.roll}
              className="border-t border-border/50 hover:bg-accent/20 transition-colors"
            >
              <td className="px-2 py-1.5 text-center font-bold text-muted-foreground">
                {enc.roll}
              </td>
              <td className="px-2 py-1.5 text-foreground">{enc.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
