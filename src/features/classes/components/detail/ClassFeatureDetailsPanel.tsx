import { memo } from "react";
import { ClassFeatureEntry } from "@/shared/types";
import { Badge } from "@/components/ui/badge";

interface ClassFeatureDetailPanelProps {
  feature: ClassFeatureEntry;
}

const ClassFeatureDetailPanel = memo(function ClassFeatureDetailPanel({
  feature,
}: ClassFeatureDetailPanelProps) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="text-sm font-semibold text-sky-300">
          {feature.displayName}
        </h4>
        {feature.isSubclassFeature && (
          <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/50 text-[10px]">
            Subclass
          </Badge>
        )}
        <Badge variant="secondary" className="text-[10px]">
          {feature.source}
        </Badge>
      </div>
      {feature.description.length > 0 ? (
        <div className="space-y-1.5">
          {feature.description.map((line, i) => (
            <p
              key={i}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No description available.
        </p>
      )}
    </div>
  );
});

interface ClassFeatureDetailsPanelProps {
  features: ClassFeatureEntry[];
}

export const ClassFeatureDetailsPanel = memo(function ClassFeatureDetailsPanel({
  features,
}: ClassFeatureDetailsPanelProps) {
  if (features.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground italic">
        No features selected.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {features.map((feature) => (
        <ClassFeatureDetailPanel key={feature.uid} feature={feature} />
      ))}
    </div>
  );
});
