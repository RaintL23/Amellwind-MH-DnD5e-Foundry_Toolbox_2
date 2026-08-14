import { useNavigate } from "react-router-dom";
import { ArrowLeft, Swords } from "lucide-react";
import { Monster } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { MhTokenImage } from "@/shared/components/MhTokenImage";
import { resolveMhTokenPath } from "@/shared/utils/mh-token.utils";
import { getTier } from "@/shared/utils/cr.utils";

interface MonsterDetailHeaderProps {
  monster: Monster;
}

export function MonsterDetailHeader({ monster }: MonsterDetailHeaderProps) {
  const navigate = useNavigate();
  const tier = getTier(monster.cr);
  const tokenPath = resolveMhTokenPath(monster.name);

  return (
    <div className="shrink-0 border-b border-border px-6 py-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Monsters
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {tokenPath ? (
          <div className="shrink-0 self-start rounded-full p-1 ring-2 ring-amber-400/30 bg-muted/20 shadow-md">
            <MhTokenImage
              name={monster.name}
              size="xl"
              priority
              className="border-amber-400/20"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1 space-y-2">
          {!tokenPath ? (
            <div className="flex items-start gap-3">
              <Swords className="h-6 w-6 text-amber-400 shrink-0 mt-1" />
              <h1 className="text-2xl font-bold text-amber-400">{monster.name}</h1>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-amber-400">{monster.name}</h1>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">CR {monster.cr}</Badge>
            <Badge variant="secondary">Tier {tier}</Badge>
            <Badge variant="outline" className="capitalize">
              {monster.type.type}
            </Badge>
            {monster.group?.map((g) => (
              <Badge key={g} variant="outline">
                {g}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground">
              {monster.source}
              {monster.page != null ? ` p.${monster.page}` : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
