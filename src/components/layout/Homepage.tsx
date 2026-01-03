/**
 * Homepage Component
 *
 * Landing page with cards for all available tools and features
 * Shows enabled features prominently and upcoming features with "Coming Soon" badges
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS } from "./Sidebar";
import { cn } from "@/lib/utils";

interface HomepageProps {
  onNavigate: (href: string) => void;
}

export function Homepage({ onNavigate }: HomepageProps) {
  return (
    <div className="container mx-auto py-6 px-4 lg:px-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Monster Hunter D&D 5e Toolbox
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Complete tools to play with Amellwind's Monster Hunter content in your
          Dungeons & Dragons 5e campaigns
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {NAV_ITEMS.map((item) => {
          const isEnabled = item.enabled;
          const isComingSoon = item.comingSoon;

          return (
            <Card
              key={item.id}
              className={cn(
                "transition-all duration-200 cursor-pointer",
                isEnabled
                  ? "hover:shadow-lg hover:scale-[1.02] hover:border-primary"
                  : "opacity-60 cursor-not-allowed"
              )}
              onClick={() => {
                if (isEnabled) {
                  onNavigate(item.href);
                }
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary mb-4">
                    {item.icon}
                  </div>
                  {isComingSoon && (
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription className="text-sm mt-2">
                  {getDescription(item.id)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {getFeatures(item.id).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                      <span className="text-primary">•</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="text-center mt-16 text-sm text-muted-foreground">
        <p>
          Based on <span className="font-semibold">Amellwind's</span> homebrew
          content for Monster Hunter in D&D 5e
        </p>
      </div>
    </div>
  );
}

/**
 * Get detailed description for each tool
 */
function getDescription(toolId: string): string {
  const descriptions: Record<string, string> = {
    monsters:
      "Explore the complete bestiary of Monster Hunter monsters adapted for D&D 5e. Includes statistics, abilities, and detailed descriptions.",
    runes:
      "Discover all available material runes that you can apply to weapons and armor to gain special effects.",
    items:
      "Browse the complete catalog of Monster Hunter weapons, armor, and equipment for D&D 5e.",
    crafting:
      "Crafting system to create powerful equipment using materials from defeated monsters.",
    armor:
      "Armor set builder with customizable statistics and unique set bonuses.",
    carving:
      "Carving tables showing what materials you can obtain from defeating each monster.",
  };

  return descriptions[toolId] || "Tool coming soon.";
}

/**
 * Get key features for each tool
 */
function getFeatures(toolId: string): string[] {
  const features: Record<string, string[]> = {
    monsters: [
      "Advanced search and filters",
      "Detailed monster cards",
      "Rune and material information",
      "Images and lore descriptions",
    ],
    runes: [
      "Filters by type and tier",
      "Search by intent",
      "Filter by weapons and classes",
      "Detailed effects",
    ],
    items: [
      "Complete equipment catalog",
      "Statistics and bonuses",
      "Crafting requirements",
    ],
    crafting: ["Crafting recipes", "Required materials", "Probability tables"],
    armor: [
      "Interactive builder",
      "Full set bonuses",
      "Automatic stat calculation",
    ],
    carving: [
      "Loot tables per monster",
      "Drop probabilities",
      "Rare materials",
    ],
  };

  return features[toolId] || ["Coming soon"];
}
