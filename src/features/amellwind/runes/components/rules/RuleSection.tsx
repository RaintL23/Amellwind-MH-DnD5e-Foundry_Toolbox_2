import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";

interface RuleSectionProps {
  title: string;
  icon: React.ReactNode;
  rules: readonly string[];
  accentColor: string;
}

export function RuleSection({ title, icon, rules, accentColor }: RuleSectionProps) {
  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2 text-sm font-semibold", accentColor)}>
        {icon}
        {title}
      </div>
      <ol className="space-y-1 pl-1">
        {rules.map((rule, i) => (
          <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
            <span className={cn("shrink-0 font-semibold mt-0.5", accentColor)}>
              {i + 1}.
            </span>
            <span>
              <DndRichText text={rule} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
