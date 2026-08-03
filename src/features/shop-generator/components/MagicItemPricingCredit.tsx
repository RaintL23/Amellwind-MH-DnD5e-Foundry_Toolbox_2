import { MAGIC_ITEM_PRICING_ATTRIBUTION } from "../data/magic-item-pricing-attribution";

/** Inline credit + link for Magic Item Pricing (Dump Stat Adventures). */
export function MagicItemPricingCredit({
  className,
}: {
  className?: string;
}) {
  return (
    <p className={className}>
      {MAGIC_ITEM_PRICING_ATTRIBUTION.shortCredit}{" "}
      <a
        href={MAGIC_ITEM_PRICING_ATTRIBUTION.url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-foreground transition-colors"
      >
        Open the spreadsheet article
      </a>
      .
    </p>
  );
}
