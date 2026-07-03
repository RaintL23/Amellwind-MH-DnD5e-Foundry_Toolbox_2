import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import {
  HuntRoleName,
  HuntRuleText,
} from "@/features/hunt/components/HuntRuleText";
import {
  HUNT_RULE_SECTIONS,
  type HuntRuleBlock,
} from "../data/hunt-rules.data";
import { HuntRuleTableView } from "./HuntRuleTable";

function HuntRuleListView({
  list,
  asRoleCard,
}: {
  list: NonNullable<HuntRuleBlock["lists"]>[number];
  asRoleCard: boolean;
}) {
  const content = (
    <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted-foreground leading-relaxed">
      {list.items.map((item) => (
        <li key={item}>
          <HuntRuleText raw={item} />
        </li>
      ))}
    </ul>
  );

  if (!list.name) {
    return <div className="space-y-1">{content}</div>;
  }

  if (asRoleCard) {
    return (
      <Card className="bg-muted/20 shadow-none">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">
            <HuntRoleName name={list.name} />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">{content}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">
        <HuntRoleName name={list.name} />
      </p>
      {content}
    </div>
  );
}

function HuntRuleBlockView({
  block,
  depth = 0,
}: {
  block: HuntRuleBlock;
  depth?: number;
}) {
  const hasNamedLists =
    block.lists != null &&
    block.lists.length > 0 &&
    block.lists.every((list) => list.name != null);
  const showRoleGrid = hasNamedLists && block.title === "Setting Roles";

  const body = (
    <div className="space-y-3">
      {block.text && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          <HuntRuleText raw={block.text} />
        </p>
      )}

      {block.lists && block.lists.length > 0 && (
        <div
          className={
            showRoleGrid
              ? "grid gap-3 sm:grid-cols-2"
              : "space-y-3"
          }
        >
          {block.lists.map((list) => (
            <HuntRuleListView
              key={list.name ?? list.items[0]}
              list={list}
              asRoleCard={showRoleGrid}
            />
          ))}
        </div>
      )}

      {block.table && <HuntRuleTableView table={block.table} />}

      {block.children?.map((child) => (
        <div
          key={child.title ?? child.text ?? child.lists?.[0]?.name}
          className="rounded-md border border-border/60 bg-muted/10"
        >
          {child.title ? (
            <Collapsible defaultOpen={depth < 1}>
              <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted/30 transition-colors [&[data-state=open]>svg]:rotate-90">
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
                {child.title}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3 pt-0">
                <HuntRuleBlockView block={child} depth={depth + 1} />
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <div className="p-3">
              <HuntRuleBlockView block={child} depth={depth + 1} />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (depth === 0 && block.title && !block.children?.length) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">{block.title}</h4>
        {body}
      </div>
    );
  }

  if (depth === 0 && block.title) {
    return (
      <Card className="shadow-none">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">{block.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">{body}</CardContent>
      </Card>
    );
  }

  return body;
}

const DEFAULT_OPEN_SECTIONS = ["Going on a Hunt"];

export function HuntRulesTab() {
  return (
    <Accordion
      type="multiple"
      defaultValue={DEFAULT_OPEN_SECTIONS}
      className="space-y-3"
    >
      {HUNT_RULE_SECTIONS.map((section) => (
        <AccordionItem
          key={section.title}
          value={section.title}
          className="rounded-lg border border-border bg-card px-4 border-b-0"
        >
          <AccordionTrigger className="py-4 hover:no-underline">
            <div className="flex flex-wrap items-baseline gap-2 text-left">
              <span className="text-base font-semibold text-foreground">
                {section.title}
              </span>
              {section.page != null && (
                <span className="text-xs font-normal text-muted-foreground">
                  p. {section.page}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            {section.intro && (
              <>
                <CardDescription className="text-sm leading-relaxed">
                  <HuntRuleText raw={section.intro} />
                </CardDescription>
                <Separator className="my-4" />
              </>
            )}
            <div className="space-y-4">
              {section.blocks.map((block, index) => (
                <div key={block.title ?? block.text ?? String(index)}>
                  <HuntRuleBlockView block={block} />
                  {index < section.blocks.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
