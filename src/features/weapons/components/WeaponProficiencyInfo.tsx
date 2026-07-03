import { GraduationCap, Shield } from "lucide-react";
import {
  getWeaponProficiencyRule,
  type WeaponProficiencyRule,
} from "../data/weapon-proficiencies.data";
import { WeaponCategoryBadges } from "./WeaponCategoryBadges";
import { cn } from "@/shared/utils/cn";

interface WeaponProficiencyInfoProps {
  weaponName: string;
  className?: string;
  compact?: boolean;
}

function ProficiencyChip({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "shield";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium",
        variant === "shield"
          ? "border-teal-700/40 bg-teal-950/30 text-teal-200"
          : "border-border/50 bg-muted/40 text-foreground/85",
      )}
    >
      {children}
    </span>
  );
}

function CompatibleProficiencyChips({ rule }: { rule: WeaponProficiencyRule }) {
  return (
    <div className="flex flex-wrap gap-1">
      {rule.requiresShield && (
        <ProficiencyChip variant="shield">
          <Shield className="h-2.5 w-2.5" aria-hidden />
          Shield
        </ProficiencyChip>
      )}
      {rule.compatible.map((weapon) => (
        <ProficiencyChip key={weapon}>{weapon}</ProficiencyChip>
      ))}
    </div>
  );
}

function ProficiencySection({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          "font-semibold uppercase tracking-wider text-amber-300/90",
          compact ? "mb-1 text-[10px]" : "mb-1.5 text-[11px]",
        )}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

export function WeaponProficiencyInfo({
  weaponName,
  className,
  compact = false,
}: WeaponProficiencyInfoProps) {
  const rule = getWeaponProficiencyRule(weaponName);
  if (!rule) return null;

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-md border border-amber-800/30 bg-amber-950/15 px-2.5 py-2",
          className,
        )}
      >
        <div className="flex items-start gap-2">
          <GraduationCap
            className="mt-px h-3.5 w-3.5 shrink-0 text-amber-400"
            aria-hidden
          />
          <div className="min-w-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
            <ProficiencySection title="D&D Weapon Category" compact>
              <WeaponCategoryBadges weaponName={weaponName} size="xs" />
            </ProficiencySection>

            <ProficiencySection title="Compatible Proficiency" compact>
              <CompatibleProficiencyChips rule={rule} />
              <p className="mt-1 text-[10px] italic leading-snug text-muted-foreground/80">
                {rule.requiresShield
                  ? "Requires Shield and any one weapon above."
                  : "Requires proficiency in any one weapon above."}
              </p>
            </ProficiencySection>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border border-amber-800/40 bg-amber-950/20 px-3 py-2.5",
        className,
      )}
    >
      <GraduationCap
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
        aria-hidden
      />
      <div className="min-w-0 flex items-start gap-6 text-xs leading-relaxed">
        <ProficiencySection title="D&D Weapon Category">
          <WeaponCategoryBadges weaponName={weaponName} size="sm" />
        </ProficiencySection>

        <ProficiencySection title="Compatible Proficiency">
          <CompatibleProficiencyChips rule={rule} />
          <p className="mt-1.5 text-amber-100/80">
            {rule.requiresShield
              ? "Requires Shield proficiency and proficiency in one of the weapons above."
              : "Requires proficiency in one of the weapons above."}
          </p>
        </ProficiencySection>
      </div>
    </div>
  );
}
