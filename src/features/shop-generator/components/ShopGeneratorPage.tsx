import { Store } from "lucide-react";
import {
  ShopGeneratorProvider,
  useShopGenerator,
} from "../context/ShopGeneratorContext";
import { MagicItemPricingCredit } from "./MagicItemPricingCredit";
import { ShopSetupPanel } from "./ShopSetupPanel";
import { ShopResultPanel } from "./ShopResultPanel";

export function ShopGeneratorPage() {
  return (
    <ShopGeneratorProvider>
      <ShopGeneratorPageContent />
    </ShopGeneratorProvider>
  );
}

function ShopGeneratorPageContent() {
  const { error } = useShopGenerator();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-start gap-3">
          <Store className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Shop Generator
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Build a D&amp;D 5e shop from the item catalog: pick theme, tier,
              sources, and filters; generate stock with Magic Item Pricing
              costs; then adjust markup or edit individual prices.
            </p>
            <MagicItemPricingCredit className="mt-2 max-w-2xl text-xs text-muted-foreground" />
          </div>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <ShopSetupPanel />
        <ShopResultPanel />
      </div>
    </div>
  );
}
