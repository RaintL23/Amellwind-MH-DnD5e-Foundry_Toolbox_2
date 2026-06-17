import { useState } from "react";
import { Wand2 } from "lucide-react";
import type { Spell } from "@/shared/types";
import type { RpgbotRatingLookupEntry } from "@/features/builder/data/rpgbot-ratings.types";
import { SpellExpandedDetails } from "@/features/spells/components/SpellExpandedDetails";
import { RpgbotRatingBadge } from "@/features/builder/components/shared/RpgbotRatingBadge";
import { cn } from "@/shared/utils/cn";
import { SpellMetaBadges } from "../SpellMetaBadges";
import { SpellInfoToggleButton, SpellLibrarySourceBadge } from "./SpellLibraryShared";

export function AvailableSpellRow({
  spell,
  disabled,
  disabledHint,
  rpgbotRating,
  onSelect,
}: {
  spell: Spell;
  disabled: boolean;
  disabledHint?: string;
  rpgbotRating?: RpgbotRatingLookupEntry | null;
  onSelect: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={cn(
        "mb-1 rounded-md border px-2 py-1.5 transition-colors",
        disabled
          ? "border-border/30 opacity-40"
          : "border-border/60 hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          title={disabled ? disabledHint : `Añadir ${spell.name}`}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 text-left",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          <Wand2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
            {spell.name}
          </span>
          {rpgbotRating && <RpgbotRatingBadge rating={rpgbotRating} />}
          <SpellMetaBadges spell={spell} />
          <SpellLibrarySourceBadge source={spell.source} />
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {spell.schoolName}
          </span>
        </button>
        <SpellInfoToggleButton
          expanded={showDetails}
          onToggle={() => setShowDetails((p) => !p)}
        />
      </div>
      {showDetails && <SpellExpandedDetails spell={spell} className="pl-5" />}
    </div>
  );
}
