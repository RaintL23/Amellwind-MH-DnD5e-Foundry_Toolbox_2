import { useState } from "react";
import { Lock } from "lucide-react";
import type { Spell } from "@/shared/types";
import { SpellExpandedDetails } from "@/features/spells/components/SpellExpandedDetails";
import { SpellMetaBadges } from "../SpellMetaBadges";
import { parseSpellDamageRoll } from "@/features/builder/utils/spell-selection.utils";
import type { SubclassSpellGrant } from "@/features/builder/utils/subclass-spells.utils";
import {
  SpellDamageResult,
  SpellDamageToggleButton,
  SpellInfoToggleButton,
  SpellLibrarySourceBadge,
} from "./SpellLibraryShared";

export function SubclassGrantRow({
  grant,
  spell,
  badge,
}: {
  grant: SubclassSpellGrant;
  spell: Spell | undefined;
  badge: string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDamage, setShowDamage] = useState(false);
  const damageRoll = spell ? parseSpellDamageRoll(spell.description) : null;

  return (
    <div className="mb-1 rounded-md border border-emerald-400/30 bg-emerald-400/5 px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {grant.name}
        </span>
        <span className="shrink-0 rounded border border-emerald-700/40 bg-emerald-950/40 px-1 py-0 text-[9px] font-medium text-emerald-300">
          {badge}
        </span>
        {spell && <SpellMetaBadges spell={spell} />}
        {spell && <SpellLibrarySourceBadge source={spell.source} />}
        {spell && (
          <SpellInfoToggleButton
            expanded={showDetails}
            onToggle={() => setShowDetails((p) => !p)}
          />
        )}
        {damageRoll && (
          <SpellDamageToggleButton
            showDamage={showDamage}
            onToggle={() => setShowDamage((p) => !p)}
          />
        )}
      </div>
      {spell?.schoolName && !showDetails && (
        <p className="pl-5 text-[10px] text-muted-foreground">
          {spell.schoolName}
        </p>
      )}
      {showDetails && spell && (
        <SpellExpandedDetails spell={spell} className="pl-5" />
      )}
      {showDamage && damageRoll && (
        <div className="pl-1">
          <SpellDamageResult damageRoll={damageRoll} />
        </div>
      )}
    </div>
  );
}
