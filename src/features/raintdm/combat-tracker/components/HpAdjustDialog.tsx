import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Combatant } from "../utils/combat-tracker.types";
import { applyHpChange } from "../utils/hp.utils";

interface HpAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: Combatant[];
  onApply: (
    ids: string[],
    delta: number,
    opts: { critical?: boolean; setTempHp?: number },
  ) => void;
}

const QUICK = [-10, -5, -1, 1, 5, 10] as const;

export function HpAdjustDialog({
  open,
  onOpenChange,
  targets,
  onApply,
}: HpAdjustDialogProps) {
  const [delta, setDelta] = useState(0);
  const [custom, setCustom] = useState("");
  const [tempHp, setTempHp] = useState("");
  const [critical, setCritical] = useState(false);
  const targetKey = targets.map((t) => t.id).join(",");

  useEffect(() => {
    if (open) {
      setDelta(0);
      setCustom("");
      setTempHp("");
      setCritical(false);
    }
  }, [open, targetKey]);

  const previews = useMemo(() => {
    const parsedTemp =
      tempHp.trim() === "" ? undefined : Number.parseInt(tempHp, 10);
    return targets.map((t) => {
      const next = applyHpChange(t, delta, {
        critical,
        setTempHp:
          parsedTemp != null && Number.isFinite(parsedTemp)
            ? parsedTemp
            : undefined,
      });
      return {
        id: t.id,
        name: t.name,
        from: t.hp.current,
        to: next.hp.current,
        tempFrom: t.hp.temp,
        tempTo: next.hp.temp,
      };
    });
  }, [targets, delta, critical, tempHp]);

  const hasPcAtZero = targets.some(
    (t) => t.kind === "pc" && t.hp.current <= 0,
  );

  function applyCustom() {
    const n = Number.parseInt(custom, 10);
    if (!Number.isFinite(n) || n === 0) return;
    setDelta((d) => d + n);
    setCustom("");
  }

  function handleApply() {
    const setTemp =
      tempHp.trim() === "" ? undefined : Number.parseInt(tempHp, 10);
    onApply(
      targets.map((t) => t.id),
      delta,
      {
        critical: hasPcAtZero ? critical : undefined,
        setTempHp:
          setTemp != null && Number.isFinite(setTemp) ? setTemp : undefined,
      },
    );
    onOpenChange(false);
  }

  const title =
    targets.length === 1
      ? `Adjust HP — ${targets[0]?.name ?? ""}`
      : `Adjust HP — ${targets.length} targets`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 pb-6">
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant={n < 0 ? "outline" : "secondary"}
                className={
                  n < 0
                    ? "min-w-12 tabular-nums border-destructive/40 text-destructive"
                    : "min-w-12 tabular-nums"
                }
                onClick={() => setDelta((d) => d + n)}
              >
                {n > 0 ? `+${n}` : n}
              </Button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="hp-custom" className="text-xs">
                Custom amount (signed)
              </Label>
              <Input
                id="hp-custom"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="-12 or 8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCustom();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={applyCustom}
            >
              Add
            </Button>
          </div>

          <p className="text-sm tabular-nums">
            Pending change:{" "}
            <span className="font-semibold">
              {delta > 0 ? `+${delta}` : delta}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-2 h-7"
              onClick={() => setDelta(0)}
            >
              Reset
            </Button>
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="temp-hp" className="text-xs">
              Set Temp HP (optional, keeps higher)
            </Label>
            <Input
              id="temp-hp"
              type="number"
              min={0}
              value={tempHp}
              onChange={(e) => setTempHp(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>

          {hasPcAtZero ? (
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={critical}
                onCheckedChange={(v) => setCritical(v === true)}
              />
              Critical hit (2 death save failures)
            </label>
          ) : null}

          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/10 p-2 text-xs">
            {previews.map((p) => (
              <li
                key={p.id}
                className="flex justify-between gap-2 tabular-nums"
              >
                <span className="truncate font-medium">{p.name}</span>
                <span className="text-muted-foreground">
                  {p.from}
                  {p.tempFrom > 0 ? `(+${p.tempFrom})` : ""} → {p.to}
                  {p.tempTo > 0 ? `(+${p.tempTo})` : ""}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={delta === 0 && tempHp.trim() === ""}
            >
              Apply
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
