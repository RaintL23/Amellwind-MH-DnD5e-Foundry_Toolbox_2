import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mapMonster } from "@/features/amellwind/monsters/mappers/monster.mapper";
import { MonsterStatBlock } from "@/features/amellwind/monsters/components/MonsterStatBlock";
import {
  GUILD_KNIGHT_LEGENDARY_NOTE,
  GUILD_KNIGHTS,
  GUILD_KNIGHTS_INTRO,
} from "../data/guild-knights.data";

export function GuildKnightsPage() {
  const knights = useMemo(() => GUILD_KNIGHTS.map(mapMonster), []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Guild Knights</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Guild Knight stat blocks in four ranks, from Appendix C (Old World
          Bestiary) of{" "}
          <span className="text-foreground/80">
            Amellwind&apos;s Guide to Monster Hunting
          </span>
          .
        </p>
        <p className="text-sm text-muted-foreground max-w-3xl mt-2">
          {GUILD_KNIGHTS_INTRO}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto grid gap-5 xl:grid-cols-2">
          {knights.map((knight) => (
            <section
              key={knight.name}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h2 className="text-lg font-bold text-amber-400">
                  {knight.name}
                </h2>
                <Badge variant="outline">CR {knight.cr}</Badge>
              </div>
              <MonsterStatBlock monster={knight} />
              {knight.legendaryActions && (
                <p className="mt-3 text-xs italic text-muted-foreground">
                  {GUILD_KNIGHT_LEGENDARY_NOTE}
                </p>
              )}
            </section>
          ))}

          <div className="xl:col-span-2 rounded-lg border border-border bg-card/50 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Swap materials using the loot tables in the bestiary, keeping to
              the same CR range.
            </p>
            <Link
              to="/monsters"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open Bestiary →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
