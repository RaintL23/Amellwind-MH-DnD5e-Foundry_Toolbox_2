import { Shield, Shirt } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { EquippedArmor } from "@/shared/types";
import {
  formatArmorSlotDetail,
  isClothingArmor,
} from "../../../data/armor.data";
import { RuneFeaturesSection } from "../RuneFeaturesSection";

interface ArmorLibraryDetailProps {
  equipped: EquippedArmor;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5">
      <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  light: "Light Armor",
  medium: "Medium Armor",
  heavy: "Heavy Armor",
  clothing: "Clothing",
  shield: "Shield",
};

export function ArmorLibraryDetail({ equipped }: ArmorLibraryDetailProps) {
  const { armor, rarity, runes } = equipped;
  const isCloth = isClothingArmor(armor);
  const Icon = isCloth ? Shirt : Shield;
  const accentClass = isCloth ? "text-violet-400" : "text-sky-400";

  const dexLabel =
    armor.maxDexBonus === null
      ? "Unlimited DEX"
      : armor.maxDexBonus === 0
        ? "No DEX bonus"
        : `Max +${armor.maxDexBonus} DEX`;

  return (
    <Accordion type="single" collapsible defaultValue="armor-details">
      <AccordionItem value="armor-details" className="border-0">
        <AccordionTrigger className="gap-1.5 py-2 text-xs font-medium hover:no-underline">
          <span className={`flex min-w-0 items-center gap-1.5 ${accentClass}`}>
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{armor.name}</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-1 pt-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {rarity}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {CATEGORY_LABELS[armor.category] ?? armor.category}
            </Badge>
            {armor.stealthDisadvantage && (
              <Badge variant="outline" className="text-[10px]">
                Stealth Disadvantage
              </Badge>
            )}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <StatBox label="AC" value={formatArmorSlotDetail(armor)} />
            <StatBox label="DEX Modifier" value={dexLabel} />
            <StatBox
              label="Rune Slots"
              value={`${equipped.runeSlots} slot${equipped.runeSlots !== 1 ? "s" : ""}`}
            />
            <StatBox label="Weight" value={`${armor.weight} lb`} />
          </div>

          <RuneFeaturesSection runes={runes} effectKind="armor" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
