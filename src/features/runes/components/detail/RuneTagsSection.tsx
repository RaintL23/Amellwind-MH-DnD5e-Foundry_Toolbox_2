import { ShieldCheck, Sword } from "lucide-react";
import { Rune } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { formatTag } from "../../utils/rune-tag.utils";

interface RuneTagsSectionProps {
  rune: Rune;
}

export function RuneTagsSection({ rune }: RuneTagsSectionProps) {
  if (rune.tags.length === 0) return null;

  const classTags = rune.tags.filter((t) => t.startsWith("class:"));
  const weaponTypeTags = rune.tags.filter((t) => t.startsWith("weapon-type:"));
  const typeTags = rune.tags.filter((t) => t.startsWith("type:"));
  const weaponMechanicTags = rune.weaponTags.filter((t) => t.startsWith("mechanic:"));
  const armorMechanicTags = rune.armorTags.filter((t) => t.startsWith("mechanic:"));

  return (
    <div>
      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
        Tags
      </h4>
      <div className="space-y-2">
        {classTags.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-muted-foreground w-24">Class:</span>
            {classTags.map((t) => (
              <Badge key={t} variant="blue">
                {formatTag(t)}
              </Badge>
            ))}
          </div>
        )}
        {weaponTypeTags.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-muted-foreground w-24">Weapon type:</span>
            {weaponTypeTags.map((t) => (
              <Badge key={t} variant="orange">
                {formatTag(t)}
              </Badge>
            ))}
          </div>
        )}
        {typeTags.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-muted-foreground w-24">Type:</span>
            {typeTags.map((t) => (
              <Badge key={t} variant="red">
                {formatTag(t)}
              </Badge>
            ))}
          </div>
        )}
        {weaponMechanicTags.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-muted-foreground w-24">
              <Sword className="inline h-3 w-3 mr-0.5" />
              Mechanic:
            </span>
            {weaponMechanicTags.map((t) => (
              <Badge key={t} variant="green">
                {formatTag(t)}
              </Badge>
            ))}
          </div>
        )}
        {armorMechanicTags.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-muted-foreground w-24">
              <ShieldCheck className="inline h-3 w-3 mr-0.5" />
              Mechanic:
            </span>
            {armorMechanicTags.map((t) => (
              <Badge key={t} variant="green">
                {formatTag(t)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
