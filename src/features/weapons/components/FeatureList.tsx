import React from "react";
import type { ParsedFeature } from "../types/weapon.types";
import { Badge } from "@/components/ui/badge";

/**
 * FeatureList Component
 * Displays parsed features with their descriptions
 */
interface FeatureListProps {
  featureString: string;
  rarityName: string;
  featuresCache: Record<string, ParsedFeature[]>;
  loadFeatures: (featureString: string, rarityName: string) => Promise<void>;
}

export function FeatureList({
  featureString,
  rarityName,
  featuresCache,
  loadFeatures,
}: FeatureListProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      if (!featuresCache[rarityName]) {
        setIsLoading(true);
        await loadFeatures(featureString, rarityName);
        setIsLoading(false);
      }
    };
    load();
  }, [featureString, rarityName, featuresCache, loadFeatures]);

  const features = featuresCache[rarityName];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!features || features.length === 0) {
    return (
      <div>
        <div className="text-sm font-semibold mb-2">Features</div>
        <div className="text-sm text-muted-foreground leading-relaxed break-words">
          {featureString}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm font-semibold mb-3">Features</div>
      <div className="space-y-3">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="p-3 rounded-md bg-background border border-border"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">{feature.name}</span>
              {feature.source && (
                <Badge variant="outline" className="text-xs">
                  {feature.source}
                </Badge>
              )}
            </div>
            {feature.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
