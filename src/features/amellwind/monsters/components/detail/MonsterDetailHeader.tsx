import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Swords, ZoomIn } from "lucide-react";
import { Monster } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { MhTokenImage } from "@/shared/components/MhTokenImage";
import { resolveMhTokenPath } from "@/shared/utils/mh-token.utils";
import { getTier } from "@/shared/utils/cr.utils";

interface MonsterDetailHeaderProps {
  monster: Monster;
}

export function MonsterDetailHeader({ monster }: MonsterDetailHeaderProps) {
  const navigate = useNavigate();
  const [zoomOpen, setZoomOpen] = useState(false);
  const tier = getTier(monster.cr);
  const tokenPath = resolveMhTokenPath(monster.name);

  return (
    <div className="shrink-0 border-b border-border px-6 py-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors mb-3"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Monsters
      </button>

      <div className="space-y-2">
        <div className="flex items-center gap-3 min-w-0">
          {tokenPath ? (
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="group relative shrink-0 rounded-full p-0.5 ring-1 ring-amber-400/30 bg-muted/20 shadow-sm transition-shadow hover:ring-amber-400/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              aria-label={`View ${monster.name} portrait`}
            >
              <MhTokenImage
                name={monster.name}
                size="md"
                priority
                className="border-amber-400/20"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5 text-white drop-shadow" />
              </span>
            </button>
          ) : (
            <Swords className="h-8 w-8 text-amber-400 shrink-0" />
          )}

          <h1 className="min-w-0 text-2xl font-bold leading-8 text-amber-400 truncate">
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

      {tokenPath ? (
        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent className="max-w-sm border-amber-400/20 bg-card p-6">
            <DialogTitle className="sr-only">{monster.name} portrait</DialogTitle>
            <DialogDescription className="sr-only">
              Enlarged portrait of {monster.name}
            </DialogDescription>
            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="rounded-full p-1.5 ring-2 ring-amber-400/40 bg-muted/20 shadow-lg">
                <MhTokenImage
                  name={monster.name}
                  size="xl"
                  priority
                  className="h-56 w-56 border-amber-400/20"
                />
              </div>
              <p className="text-center text-sm font-medium text-amber-400">
                {monster.name}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
