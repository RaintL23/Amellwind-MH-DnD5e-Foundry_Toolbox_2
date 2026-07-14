import { useMemo, useState } from "react";
import type { Weapon } from "@/shared/types";
import { RARITY_ORDER } from "@/shared/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface WeaponBaseSelectorProps {
  weapons: Weapon[];
  onApply: (weapon: Weapon, rarities: string[] | "all") => void;
}

export function WeaponBaseSelector({
  weapons,
  onApply,
}: WeaponBaseSelectorProps) {
  const [selectedName, setSelectedName] = useState<string>("");
  const [search, setSearch] = useState("");
  const [useAllRarities, setUseAllRarities] = useState(true);
  const [pickedRarities, setPickedRarities] = useState<string[]>([
    ...RARITY_ORDER,
  ]);

  const sorted = useMemo(
    () =>
      [...weapons].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [weapons],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((w) => w.name.toLowerCase().includes(q));
  }, [sorted, search]);

  const selected = sorted.find((w) => w.name === selectedName) ?? null;
  const availableRarities = selected?.rarityRows.map((r) => r.rarity) ?? [
    ...RARITY_ORDER,
  ];

  function toggleRarity(rarity: string) {
    setPickedRarities((prev) =>
      prev.includes(rarity)
        ? prev.filter((r) => r !== rarity)
        : [...prev, rarity],
    );
  }

  function handleApply() {
    if (!selected) return;
    onApply(selected, useAllRarities ? "all" : pickedRarities);
  }

  return (
    <Accordion type="single" collapsible className="rounded-md border border-border bg-muted/20 px-4">
      <AccordionItem value="amellwind-base" className="border-b-0">
        <AccordionTrigger className="py-3 text-sm hover:no-underline">
          <span className="text-left">
            <span className="font-medium text-foreground">
              Load Amellwind base weapon
            </span>
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">
              Optional — copy stats and rarity features as a starting point
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pb-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter weapons…"
              className="h-9"
            />

            <Select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
            >
              <option value="">Select a weapon…</option>
              {filtered.map((w) => (
                <option key={w.name} value={w.name}>
                  {w.name}
                </option>
              ))}
            </Select>

            {selected && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="all-rarities"
                    checked={useAllRarities}
                    onCheckedChange={(checked) =>
                      setUseAllRarities(checked === true)
                    }
                  />
                  <Label htmlFor="all-rarities" className="text-sm font-normal">
                    Copy all rarities
                  </Label>
                </div>

                {!useAllRarities && (
                  <div className="flex flex-wrap gap-3 pl-1">
                    {availableRarities.map((rarity) => (
                      <label
                        key={rarity}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={pickedRarities.includes(rarity)}
                          onCheckedChange={() => toggleRarity(rarity)}
                        />
                        {rarity}
                      </label>
                    ))}
                  </div>
                )}

                <Button type="button" size="sm" onClick={handleApply}>
                  Apply base template
                </Button>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
