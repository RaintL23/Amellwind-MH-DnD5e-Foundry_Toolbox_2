import { useState } from "react";
import { Sparkles, X, Lock } from "lucide-react";
import type { Spell } from "@/shared/types";
import type { BuilderSpellSelection } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { SpellExpandedDetails } from "@/features/spells/components/SpellExpandedDetails";
import { SpellMetaBadges } from "../SpellMetaBadges";
import {
  SpellDamageResult,
  SpellDamageToggleButton,
  SpellInfoToggleButton,
  SpellLibrarySourceBadge,
} from "./SpellLibraryShared";

export function SelectedSpellRow({
  spell,
  fullSpell,
  onRemove,
  removable = true,
}: {
  spell: BuilderSpellSelection;
  fullSpell: Spell | undefined;
  onRemove?: () => void;
  removable?: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDamage, setShowDamage] = useState(false);
  const hasDamage = !!spell.damageRoll;

  return (
    <div
      className={cn(
        "mb-1 rounded-md border px-2 py-1.5",
        removable
          ? "border-violet-400/30 bg-violet-400/5"
          : "border-emerald-400/30 bg-emerald-400/5",
      )}
    >
      <div className="flex items-center gap-1.5">
        {removable ? (
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400" />
        ) : (
          <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {spell.name}
        </span>
        {fullSpell && <SpellMetaBadges spell={fullSpell} />}
        {spell.source && <SpellLibrarySourceBadge source={spell.source} />}
        {fullSpell && (
          <SpellInfoToggleButton
            expanded={showDetails}
            onToggle={() => setShowDetails((p) => !p)}
          />
        )}
        {hasDamage && (
          <SpellDamageToggleButton
            showDamage={showDamage}
            onToggle={() => setShowDamage((p) => !p)}
          />
        )}
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Quitar hechizo"
            className="flex h-5 w-5 items-center justify-center rounded bg-destructive/20 text-destructive-foreground transition-colors hover:bg-destructive/40"
          >
            <X className="h-2.5 w-2.5" strokeWidth={3} />
          </button>
        )}
      </div>
      {spell.school && !showDetails && (
        <p className="pl-5 text-[10px] text-muted-foreground">{spell.school}</p>
      )}
      {showDetails && fullSpell && (
        <SpellExpandedDetails spell={fullSpell} className="pl-5" />
      )}
      {showDamage && spell.damageRoll && (
        <div className="pl-1">
          <SpellDamageResult damageRoll={spell.damageRoll} />
        </div>
      )}
    </div>
  );
}
