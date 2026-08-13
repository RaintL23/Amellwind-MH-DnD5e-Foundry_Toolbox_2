import { useNavigate } from "react-router-dom";
import { ArrowLeft, Swords } from "lucide-react";
import { Monster } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { getTier } from "@/shared/utils/cr.utils";

interface MonsterDetailHeaderProps {
  monster: Monster;
}

export function MonsterDetailHeader({ monster }: MonsterDetailHeaderProps) {
  const navigate = useNavigate();
  const tier = getTier(monster.cr);

  return (
    <div className="shrink-0 border-b border-border px-6 py-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Monsters
      </button>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Swords className="h-6 w-6 text-amber-400 shrink-0 mt-1" />
          <h1 className="min-w-0 flex-1 text-2xl font-bold text-amber-400">
            {monster.name}
          </h1>
        </div>
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
  );
}
