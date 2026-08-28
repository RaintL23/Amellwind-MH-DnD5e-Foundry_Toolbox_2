import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NumberStepper } from "@/shared/components/NumberStepper";
import { getBaseCr } from "@/shared/utils/cr.utils";
import { getAllBestiaryCreatures } from "@/features/dnd/bestiary/services/bestiary.service";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { getXpForCr, type EncounterCreatureInput } from "../utils/encounter-difficulty.utils";

interface EncounterBuilderPanelProps {
  creatures: EncounterCreatureInput[];
  onAddCreature: (creature: Omit<EncounterCreatureInput, "id">) => void;
  onUpdateCreature: (id: string, patch: Partial<EncounterCreatureInput>) => void;
  onRemoveCreature: (id: string) => void;
}

export function EncounterBuilderPanel({
  creatures,
  onAddCreature,
  onUpdateCreature,
  onRemoveCreature,
}: EncounterBuilderPanelProps) {
  const [manualName, setManualName] = useState("Custom creature");
  const [manualCr, setManualCr] = useState("1");
  const [manualCount, setManualCount] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bestiary, setBestiary] = useState<BestiaryCreature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getAllBestiaryCreatures()
      .then((data) => {
        if (!cancelled) setBestiary(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalBaseXp = useMemo(
    () =>
      creatures.reduce(
        (sum, creature) => sum + getXpForCr(creature.cr) * creature.count,
        0,
      ),
    [creatures],
  );

  function addManualCreature() {
    if (!manualName.trim()) return;
    onAddCreature({
      name: manualName.trim(),
      cr: manualCr.trim() || "0",
      count: manualCount,
    });
  }

  function addFromBestiary(creature: BestiaryCreature) {
    onAddCreature({
      name: creature.name,
      cr: getBaseCr(creature.cr),
      count: 1,
    });
    setPickerOpen(false);
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm">Encounter Creatures</CardTitle>
        <CardDescription>
          Add monsters manually by CR or pick from the bestiary. Base XP total:{" "}
          {totalBaseXp}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="manual-name" className="text-xs">
              Creature name
            </Label>
            <Input
              id="manual-name"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-cr" className="text-xs">
              CR
            </Label>
            <Input
              id="manual-cr"
              value={manualCr}
              onChange={(e) => setManualCr(e.target.value)}
              placeholder="1, 1/2, 1/4"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Count</Label>
            <NumberStepper
              value={manualCount}
              min={1}
              max={50}
              onChange={setManualCount}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addManualCreature}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add creature
          </Button>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Search className="h-4 w-4 mr-1.5" />
                Add from bestiary
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-0">
              <Command>
                <CommandInput placeholder="Search creatures..." />
                <CommandList>
                  <CommandEmpty>
                    {loading ? "Loading bestiary..." : "No creature found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {bestiary.slice(0, 100).map((creature) => (
                      <CommandItem
                        key={creature.id}
                        value={`${creature.name} CR ${getBaseCr(creature.cr)}`}
                        onSelect={() => addFromBestiary(creature)}
                      >
                        <span className="truncate">{creature.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          CR {getBaseCr(creature.cr)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {creatures.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No creatures added yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {creatures.map((creature) => (
              <li
                key={creature.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/10 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {creature.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CR {creature.cr} · {getXpForCr(creature.cr)} XP each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="sr-only">Count</Label>
                  <NumberStepper
                    value={creature.count}
                    min={1}
                    max={50}
                    onChange={(count) =>
                      onUpdateCreature(creature.id, { count })
                    }
                  />
                  <Badge variant="outline" className="text-[10px]">
                    {getXpForCr(creature.cr) * creature.count} XP
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onRemoveCreature(creature.id)}
                    aria-label={`Remove ${creature.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
