/**
 * WeaponDetailDialog Component
 *
 * Shows detailed weapon information in a dialog with carousel for each rarity
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HunterWeapon, ParsedFeature } from "../types/weapon.types";
import {
  formatDamage,
  formatCost,
  formatWeaponProperties,
  getWeaponDescription,
  parseAndFetchFeatures,
  extractRarityInfo,
  // getHunterWeaponRarities,
} from "../services/weapon.service";
import { FeatureList } from "./FeatureList";

interface WeaponDetailDialogProps {
  weapon: HunterWeapon | null;
  open: boolean;
  onClose: () => void;
}

// Columns that should be rendered as feature lists (like Features)
const featureLikeColumns: string[] = [
  "Features",
  "Notes",
  "Phials",
  "Coatings",
  "Ammo",
  "Column 5",
  "Single Features",
  "Splint Features",
];

// All special columns to exclude from the main grid
const rarityColumnsToExclude: string[] = [
  ...featureLikeColumns,
  "Rarity", // Rarity is shown in the header
  "Available",
];

export function WeaponDetailDialog({
  weapon,
  open,
  onClose,
}: WeaponDetailDialogProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [featuresCache, setFeaturesCache] = React.useState<
    Record<string, ParsedFeature[]>
  >({});

  // Load features for a specific rarity
  const loadFeatures = React.useCallback(
    async (featureString: string, rarityName: string) => {
      if (featuresCache[rarityName]) return;

      const features = await parseAndFetchFeatures(featureString);
      setFeaturesCache((prev) => ({
        ...prev,
        [rarityName]: features,
      }));
    },
    [featuresCache],
  );

  React.useEffect(() => {
    setCurrentIndex(0);
    setFeaturesCache({}); // Clear cache when weapon changes
  }, [weapon]);

  if (!weapon) return null;
  const rarities = extractRarityInfo(weapon);
  // console.log("rarities", rarities);
  const damage = formatDamage(weapon);
  const cost = formatCost(weapon.value);
  const properties = formatWeaponProperties(weapon);
  const description = getWeaponDescription(weapon);
  // const rarities1 = getHunterWeaponRarities(weapon);
  const getRarityColor = (rarity: string): string => {
    const lower = rarity.toLowerCase();
    if (lower === "common") return "bg-gray-600";
    if (lower === "uncommon") return "bg-green-600";
    if (lower === "rare") return "bg-blue-600";
    if (lower === "very rare") return "bg-purple-600";
    if (lower === "legendary") return "bg-orange-600";
    return "bg-gray-600";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl flex items-center gap-3">
            {weapon.name}
            <Badge variant="outline">{weapon.source}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Damage
                  </div>
                  <div className="font-semibold">{damage}</div>
                </div>
                {weapon.weight && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Weight
                    </div>
                    <div className="font-semibold">{weapon.weight} lb.</div>
                  </div>
                )}
                {weapon.ac && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      AC Bonus
                    </div>
                    <div className="font-semibold">+{weapon.ac}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Cost</div>
                  <div className="font-semibold">{cost}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Properties */}
              {properties.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Properties</h4>
                  <div className="flex flex-wrap gap-2">
                    {properties.map((prop, index) => (
                      <Badge key={index} variant="secondary">
                        {prop}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rarity Carousel */}
          {rarities.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Rarity Information</h4>
                  <div className="text-sm text-muted-foreground">
                    {currentIndex + 1} / {rarities.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative px-12">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: false,
                    }}
                    className="w-full"
                    setApi={(api) => {
                      api?.on("select", () => {
                        setCurrentIndex(api.selectedScrollSnap());
                      });
                    }}
                  >
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {rarities.map((rarity, index) => (
                        <CarouselItem key={index} className="pl-2 md:pl-4">
                          <div className="space-y-4 p-4 md:p-6 border rounded-lg bg-accent/50">
                            <div className="flex items-center justify-between">
                              <Badge
                                className={getRarityColor(rarity["Rarity"])}
                              >
                                {rarity["Rarity"]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Tier {index + 1}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {/* Dynamic rendering of all rarity properties except Features */}
                              {Object.entries(rarity)
                                .filter(
                                  ([key]) =>
                                    !rarityColumnsToExclude.includes(key),
                                )
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <div className="text-xs font-semibold text-muted-foreground mb-1">
                                      {key}
                                    </div>
                                    <div className="text-lg font-bold">
                                      {value || "—"}
                                    </div>
                                  </div>
                                ))}
                            </div>

                            {/* Feature-like columns grid */}
                            {(() => {
                              // Get all feature-like columns that exist in this rarity
                              const existingFeatureColumns =
                                featureLikeColumns.filter((col) => rarity[col]);

                              if (existingFeatureColumns.length === 0)
                                return null;

                              return (
                                <div
                                  className={`grid gap-4 ${
                                    existingFeatureColumns.length === 1
                                      ? "grid-cols-1"
                                      : existingFeatureColumns.length === 2
                                        ? "grid-cols-1 lg:grid-cols-2"
                                        : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                                  }`}
                                >
                                  {existingFeatureColumns.map((columnName) => (
                                    <div key={columnName}>
                                      <FeatureList
                                        featureString={rarity[columnName]}
                                        rarityName={`${rarity["Rarity"]}-${columnName}`}
                                        featuresCache={featuresCache}
                                        loadFeatures={loadFeatures}
                                        title={columnName}
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-12" />
                    <CarouselNext className="-right-12" />
                  </Carousel>
                </div>

                {/* Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                  {rarities.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? "w-8 bg-primary"
                          : "w-2 bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
