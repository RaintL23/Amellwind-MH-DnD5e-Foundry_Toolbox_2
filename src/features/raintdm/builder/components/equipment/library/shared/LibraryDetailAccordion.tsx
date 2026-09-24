import type { LucideIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/shared/utils/cn";

/**
 * Titled, collapsible shell for library details. With `inline`, renders only the
 * body (the library row already shows the name and toggles visibility).
 */
export function LibraryDetailAccordion({
  value,
  icon: Icon,
  title,
  accentClass,
  inline = false,
  children,
}: {
  value: string;
  icon: LucideIcon;
  title: string;
  accentClass: string;
  inline?: boolean;
  children: React.ReactNode;
}) {
  if (inline) return <div>{children}</div>;

  return (
    <Accordion type="single" collapsible defaultValue={value}>
      <AccordionItem value={value} className="border-0">
        <AccordionTrigger className="gap-1.5 py-2 text-xs font-medium hover:no-underline">
          <span className={cn("flex min-w-0 items-center gap-1.5", accentClass)}>
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{title}</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-1 pt-0">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
