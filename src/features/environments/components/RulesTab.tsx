import {
  ENVIRONMENT_RULES,
} from "../constants/environment.constants";
import { RuleText } from "./RuleText";

export function RulesTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ENVIRONMENT_RULES.filter((r) => r.term).map((rule) => (
          <div
            key={rule.term}
            className="rounded-lg border border-border bg-card p-4"
          >
            <h3 className="font-semibold text-foreground mb-1.5">
              {rule.term}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <RuleText raw={rule.text} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
