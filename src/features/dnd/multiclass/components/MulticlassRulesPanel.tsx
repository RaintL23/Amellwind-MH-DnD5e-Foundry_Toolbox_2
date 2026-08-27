import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MULTICLASS_RULE_SECTIONS } from "../data/multiclass-rules.data";

export function MulticlassRulesPanel() {
  return (
    <Accordion type="multiple" defaultValue={["prerequisites", "spellcasting"]}>
      {MULTICLASS_RULE_SECTIONS.map((section) => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger className="text-sm font-semibold">
            {section.title}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul className="list-disc space-y-1 pl-5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
