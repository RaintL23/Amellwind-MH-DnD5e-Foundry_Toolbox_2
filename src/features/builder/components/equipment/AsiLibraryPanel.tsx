import { ArrowLeft, TrendingUp } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ABILITY_LABELS, type AbilityKey, type BuilderAsiChoices } from "@/shared/types";
import { Select } from "@/components/ui/select";
import { ABILITY_ORDER } from "../../utils/check-modifiers.utils";

const ABILITY_OPTIONS = ABILITY_ORDER.map((key) => ({
  key,
  label: ABILITY_LABELS[key],
}));

interface AsiLibraryPanelProps {
  choices: BuilderAsiChoices;
  onChange: (choices: BuilderAsiChoices) => void;
  onBack: () => void;
}

export function AsiLibraryPanel({
  choices,
  onChange,
  onBack,
}: AsiLibraryPanelProps) {
  const abilityOptions = (exclude: AbilityKey[]) =>
    ABILITY_OPTIONS.filter(({ key }) => !exclude.includes(key));

  const setMode = (mode: BuilderAsiChoices["mode"]) => {
    onChange({
      mode,
      plus2: mode === "plus2" ? choices.plus2 : null,
      plus1a: mode === "plus1plus1" ? choices.plus1a : null,
      plus1b: mode === "plus1plus1" ? choices.plus1b : null,
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Elegir otro feat
      </button>

      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-foreground">
          Ability Score Improvement
        </h3>
      </div>

      <p className="text-[10px] leading-snug text-muted-foreground">
        Aumenta una habilidad en +2 o dos habilidades distintas en +1 cada una.
      </p>

      <div className="flex gap-1 rounded-md border border-border/60 bg-muted/20 p-0.5">
        <ModeButton
          active={choices.mode === "plus2"}
          onClick={() => setMode("plus2")}
        >
          +2 a una
        </ModeButton>
        <ModeButton
          active={choices.mode === "plus1plus1"}
          onClick={() => setMode("plus1plus1")}
        >
          +1 a dos
        </ModeButton>
      </div>

      {choices.mode === "plus2" ? (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-16 shrink-0 font-medium text-foreground">+2</span>
          <Select
            value={choices.plus2 ?? ""}
            onChange={(e) =>
              onChange({
                ...choices,
                plus2: (e.target.value as AbilityKey) || null,
              })
            }
            className="h-7 flex-1 text-xs"
          >
            <option value="">Seleccionar…</option>
            {ABILITY_OPTIONS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </label>
      ) : (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-16 shrink-0 font-medium text-foreground">+1</span>
            <Select
              value={choices.plus1a ?? ""}
              onChange={(e) =>
                onChange({
                  ...choices,
                  plus1a: (e.target.value as AbilityKey) || null,
                })
              }
              className="h-7 flex-1 text-xs"
            >
              <option value="">Seleccionar…</option>
              {abilityOptions(choices.plus1b ? [choices.plus1b] : []).map(
                ({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ),
              )}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-16 shrink-0 font-medium text-foreground">+1</span>
            <Select
              value={choices.plus1b ?? ""}
              onChange={(e) =>
                onChange({
                  ...choices,
                  plus1b: (e.target.value as AbilityKey) || null,
                })
              }
              className="h-7 flex-1 text-xs"
            >
              <option value="">Seleccionar…</option>
              {abilityOptions(choices.plus1a ? [choices.plus1a] : []).map(
                ({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ),
              )}
            </Select>
          </label>
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
