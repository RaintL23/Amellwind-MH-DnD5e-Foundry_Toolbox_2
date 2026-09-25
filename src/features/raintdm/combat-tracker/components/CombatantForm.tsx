import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Combatant, CombatantKind } from "../utils/combat-tracker.types";
import { createManualCombatant } from "../mappers/combatant-from-creature.mapper";

interface CombatantFormProps {
  kind: CombatantKind;
  onSubmit: (combatant: Combatant) => void;
}

function formatLevelOrCr(kind: CombatantKind, value: number): string {
  if (kind === "pc") return `Lv ${value}`;
  return String(value);
}

export function CombatantForm({ kind, onSubmit }: CombatantFormProps) {
  const [name, setName] = useState(kind === "pc" ? "Player Character" : "NPC");
  const [playerName, setPlayerName] = useState("");
  const [hpMax, setHpMax] = useState(20);
  const [hpCurrent, setHpCurrent] = useState(20);
  const [tempHp, setTempHp] = useState(0);
  const [ac, setAc] = useState(15);
  const [levelOrCrNum, setLevelOrCrNum] = useState(kind === "pc" ? 1 : 1);
  const [initiative, setInitiative] = useState("");
  const [initiativeMod, setInitiativeMod] = useState(0);
  const [dexScore, setDexScore] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const initRaw = initiative.trim();
    const parsedInit = initRaw === "" ? null : Number.parseFloat(initRaw);
    const dexRaw = dexScore.trim();
    const parsedDex = dexRaw === "" ? null : Number.parseInt(dexRaw, 10);
    const clampedLevel =
      kind === "pc"
        ? Math.min(20, Math.max(1, Math.floor(levelOrCrNum) || 1))
        : Math.max(0, levelOrCrNum);

    onSubmit(
      createManualCombatant({
        kind,
        name,
        playerName: kind === "pc" ? playerName : undefined,
        hpMax,
        hpCurrent,
        tempHp,
        ac,
        levelOrCr: formatLevelOrCr(kind, clampedLevel),
        initiative:
          parsedInit != null && Number.isFinite(parsedInit)
            ? Math.round(parsedInit * 100) / 100
            : null,
        initiativeMod,
        dexScore:
          parsedDex != null && Number.isFinite(parsedDex) ? parsedDex : null,
      }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cbt-name" className="text-xs">
            Character name
          </Label>
          <Input
            id="cbt-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        {kind === "pc" ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cbt-player" className="text-xs">
              Player name{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="cbt-player"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Alex"
            />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="cbt-hp-max" className="text-xs">
            HP Max
          </Label>
          <Input
            id="cbt-hp-max"
            type="number"
            min={1}
            value={hpMax}
            onChange={(e) => {
              const v = Number(e.target.value);
              setHpMax(v);
              setHpCurrent((cur) => Math.min(cur, v));
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cbt-hp-cur" className="text-xs">
            HP Current
          </Label>
          <Input
            id="cbt-hp-cur"
            type="number"
            min={0}
            value={hpCurrent}
            onChange={(e) => setHpCurrent(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cbt-temp" className="text-xs">
            Temp HP
          </Label>
          <Input
            id="cbt-temp"
            type="number"
            min={0}
            value={tempHp}
            onChange={(e) => setTempHp(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cbt-ac" className="text-xs">
            AC
          </Label>
          <Input
            id="cbt-ac"
            type="number"
            min={0}
            value={ac}
            onChange={(e) => setAc(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cbt-level" className="text-xs">
            {kind === "pc" ? "Level" : "CR"}
          </Label>
          <Input
            id="cbt-level"
            type="number"
            min={kind === "pc" ? 1 : 0}
            max={kind === "pc" ? 20 : undefined}
            step={kind === "pc" ? 1 : "any"}
            value={levelOrCrNum}
            onChange={(e) => setLevelOrCrNum(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cbt-init" className="text-xs">
            Initiative (optional)
          </Label>
          <Input
            id="cbt-init"
            type="number"
            step="0.01"
            value={initiative}
            onChange={(e) => setInitiative(e.target.value)}
            placeholder="15.14"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cbt-init-mod" className="text-xs">
            Initiative mod
          </Label>
          <Input
            id="cbt-init-mod"
            type="number"
            value={initiativeMod}
            onChange={(e) => setInitiativeMod(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cbt-dex" className="text-xs">
            Dexterity score (tiebreaker)
          </Label>
          <Input
            id="cbt-dex"
            type="number"
            min={1}
            max={30}
            value={dexScore}
            onChange={(e) => setDexScore(e.target.value)}
            placeholder="14"
          />
        </div>
      </div>
      <Button type="submit" size="sm">
        Add {kind === "pc" ? "PC" : "NPC"}
      </Button>
    </form>
  );
}
