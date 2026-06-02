import type { MonstieSidekickClass } from "@/shared/types";
import { getSidekickProficiencyBonus } from "../utils/monstie-stats";

interface MonstieProgressionTableProps {
  sidekickClass: MonstieSidekickClass;
}

export function MonstieProgressionTable({
  sidekickClass,
}: MonstieProgressionTableProps) {
  const { progression, page, source } = sidekickClass;

  if (progression.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-baseline gap-2">
        <h3 className="text-base font-semibold text-foreground">
          Level progression
        </h3>
        {page != null && (
          <span className="text-xs text-muted-foreground">
            {source} p. {page}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Features of the {sidekickClass.name} class that the Monstie gets at each
        level.
      </p>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-20">
                Level
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16">
                PB
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Features
              </th>
            </tr>
          </thead>
          <tbody>
            {progression.map(({ level, features }) => (
              <tr
                key={level}
                className="border-b border-border/60 last:border-0"
              >
                <td className="px-3 py-2 font-semibold text-primary align-top">
                  {level}
                </td>
                <td className="px-3 py-2 text-muted-foreground align-top whitespace-nowrap">
                  +{getSidekickProficiencyBonus(level)}
                </td>
                <td className="px-3 py-2 text-foreground align-top">
                  <ul className="list-disc list-inside space-y-0.5">
                    {features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
