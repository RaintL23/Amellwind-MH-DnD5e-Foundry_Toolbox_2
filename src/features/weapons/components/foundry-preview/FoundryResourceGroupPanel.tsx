import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { FoundryItem } from "@/shared/foundry";
import { buildFoundryItemFilename } from "@/shared/foundry";
import { PreviewBody } from "@/features/weapons/components/foundry-preview/FoundryPreviewBody";

function resourceItemFilename(item: FoundryItem): string {
  return buildFoundryItemFilename(item.name || "resource");
}

export function FoundryResourceGroupPanel({
  label,
  items,
}: {
  label: string;
  items: FoundryItem[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No {label.toLowerCase()} Foundry items at this rarity.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        {items.length} {label} feat{items.length === 1 ? "" : "s"} unlocked at
        this rarity. Import beside the weapon; activation rules live on the
        weapon (e.g. Recital).
      </p>
      <Accordion
        type="multiple"
        defaultValue={items[0]?._id ? [items[0]._id] : []}
        className="space-y-2"
      >
        {items.map((resource) => (
          <AccordionItem
            key={resource._id}
            value={resource._id}
            className="rounded-md border border-border/50 border-b-0 px-2.5"
          >
            <AccordionTrigger className="py-2 text-xs hover:no-underline">
              <span className="flex flex-wrap items-center gap-2 text-left">
                <span className="font-medium text-foreground">
                  {resource.name}
                </span>
                <Badge
                  variant="outline"
                  className="rounded px-1.5 py-0 text-[10px]"
                >
                  {resource.type}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <PreviewBody
                item={resource}
                filename={resourceItemFilename(resource)}
                variant="feat"
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
