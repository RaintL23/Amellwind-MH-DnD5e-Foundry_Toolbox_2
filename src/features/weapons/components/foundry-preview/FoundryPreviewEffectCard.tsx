import { Badge } from "@/components/ui/badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FoundryActiveEffect } from "@/shared/foundry";
import { effectModeLabel } from "@/shared/foundry/weapons";
import { asRecord, dash } from "@/features/weapons/components/foundry-preview/foundry-preview.formatters";
import { FieldRow } from "@/features/weapons/components/foundry-preview/FoundryPreviewFieldRow";

export function EffectCard({ effect }: { effect: FoundryActiveEffect }) {
  const duration = asRecord(effect.duration) ?? {};
  const flags = asRecord(effect.flags) ?? {};
  const dae = asRecord(flags.dae) ?? {};
  const core = asRecord(flags.core) ?? {};
  const activeAuras = asRecord(flags.ActiveAuras) ?? {};

  const specialDuration = Array.isArray(dae.specialDuration)
    ? dae.specialDuration.filter((v): v is string => typeof v === "string")
    : [];
  const daeStatuses = Array.isArray(dae.statuses)
    ? dae.statuses.filter((v): v is string => typeof v === "string")
    : [];

  const seconds =
    typeof duration.seconds === "number" ? String(duration.seconds) : "—";
  const rounds =
    typeof duration.rounds === "number" ? String(duration.rounds) : "—";
  const turns =
    typeof duration.turns === "number" ? String(duration.turns) : "—";
  const startTime =
    typeof duration.startTime === "number" ? String(duration.startTime) : "—";
  const combat =
    typeof duration.combat === "string" && duration.combat
      ? duration.combat
      : "—";
  const startRound =
    typeof duration.startRound === "number"
      ? String(duration.startRound)
      : "—";
  const startTurn =
    typeof duration.startTurn === "number" ? String(duration.startTurn) : "—";

  const isAura = activeAuras.isAura === true;

  return (
    <AccordionItem
      value={effect._id}
      className="rounded-md border border-border/50 border-b-0 px-2.5"
    >
      <AccordionTrigger className="py-2 text-xs hover:no-underline">
        <span className="flex flex-wrap items-center gap-2 text-left">
          <span className="font-medium text-foreground">{effect.name}</span>
          <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px]">
            {effect.transfer ? "transfer" : "on use"}
          </Badge>
          {effect.disabled && (
            <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px]">
              suspended
            </Badge>
          )}
          {isAura && (
            <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px]">
              aura
            </Badge>
          )}
          <span className="text-muted-foreground font-normal">
            {effect.changes.length} change
            {effect.changes.length === 1 ? "" : "s"}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-3 space-y-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Details
          </p>
          <FieldRow label="Name" value={effect.name} />
          <FieldRow label="Icon" value={dash(effect.img)} />
          <FieldRow label="Tint" value={dash(effect.tint)} />
          <FieldRow
            label="Description"
            value={
              effect.description.trim()
                ? effect.description
                : "—"
            }
          />
          <FieldRow
            label="Suspended"
            value={effect.disabled ? "Yes" : "No"}
            hint="disabled"
          />
          <FieldRow
            label="Apply to Actor"
            value={effect.transfer ? "Yes" : "No"}
            hint="transfer — equipped item vs activity on-use"
          />
          <FieldRow
            label="Statuses"
            value={
              effect.statuses.length > 0 ? effect.statuses.join(", ") : "—"
            }
          />
          <FieldRow
            label="Disable condition (DAE)"
            value={
              typeof dae.disableCondition === "string" && dae.disableCondition
                ? dae.disableCondition
                : "—"
            }
          />
          <FieldRow
            label="Disable if incapacitated"
            value={dae.disableIncapacitated === true ? "Yes" : "No"}
          />
          <FieldRow
            label="Stackable (DAE)"
            value={
              typeof dae.stackable === "string" && dae.stackable
                ? dae.stackable
                : "—"
            }
          />
          <FieldRow
            label="Separate statuses (DAE)"
            value={daeStatuses.length > 0 ? daeStatuses.join(", ") : "—"}
          />
          <FieldRow
            label="Always show icon"
            value={dae.showIcon === true ? "Yes" : "No"}
          />
          <FieldRow
            label="Icon overlay"
            value={core.overlay === true ? "Yes" : "No"}
            hint="flags.core.overlay"
          />
          <FieldRow
            label="selfTargetAlways"
            value={dae.selfTargetAlways === true ? "Yes" : "No"}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Duration
          </p>
          <FieldRow label="Seconds" value={seconds} />
          <FieldRow
            label="Seconds formula (DAE)"
            value={
              typeof dae.durationExpression === "string" &&
              dae.durationExpression
                ? dae.durationExpression
                : "—"
            }
          />
          <FieldRow label="Start time" value={startTime} />
          <FieldRow label="Rounds" value={rounds} />
          <FieldRow label="Turns" value={turns} />
          <FieldRow label="Combat" value={combat} />
          <FieldRow label="Start round" value={startRound} />
          <FieldRow label="Start turn" value={startTurn} />
          <FieldRow
            label="Macro repeat"
            value={
              typeof dae.macroRepeat === "string" && dae.macroRepeat
                ? dae.macroRepeat
                : "—"
            }
          />
          <FieldRow
            label="Special duration"
            value={
              specialDuration.length > 0 ? specialDuration.join(", ") : "—"
            }
            hint="flags.dae.specialDuration (DAE + Times Up)"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Changes
          </p>
          {effect.changes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No changes.</p>
          ) : (
            <ul className="space-y-1.5">
              {effect.changes.map((change, index) => (
                <li
                  key={`${change.key}-${index}`}
                  className="rounded border border-border/40 px-2 py-1.5 space-y-1"
                >
                  <FieldRow label="Key" value={change.key} />
                  <FieldRow
                    label="Mode"
                    value={effectModeLabel(change.mode)}
                  />
                  <FieldRow label="Value" value={change.value || '""'} />
                  <FieldRow label="Priority" value={String(change.priority)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Auras (Active Auras)
          </p>
          <FieldRow
            label="Effect is Aura?"
            value={isAura ? "Yes" : "No"}
            hint="flags.ActiveAuras.isAura"
          />
          {isAura && (
            <>
              <FieldRow
                label="Radius"
                value={
                  typeof activeAuras.radius === "string" ||
                  typeof activeAuras.radius === "number"
                    ? String(activeAuras.radius)
                    : "—"
                }
              />
              <FieldRow
                label="Targets"
                value={
                  typeof activeAuras.aura === "string"
                    ? activeAuras.aura
                    : "—"
                }
              />
              <FieldRow
                label="Ignore self"
                value={activeAuras.ignoreSelf === true ? "Yes" : "No"}
              />
              <FieldRow
                label="Hostile"
                value={activeAuras.hostile === true ? "Yes" : "No"}
              />
              <FieldRow
                label="Only once"
                value={activeAuras.onlyOnce === true ? "Yes" : "No"}
              />
            </>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
