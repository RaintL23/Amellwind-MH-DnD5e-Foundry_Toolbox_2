import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DndRichText } from "@/shared/components/DndRichText";
import { COOKING_RULES } from "../data/cooking.data";

export function CookingRulesTab() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {COOKING_RULES.map((rule) => (
          <Card key={rule.name}>
            <CardHeader className="p-4 pb-2">
              <CardTitle>{rule.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-4 pt-0">
              {rule.content.map((line, i) => (
                <p
                  key={i}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  <DndRichText text={line} />
                </p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
