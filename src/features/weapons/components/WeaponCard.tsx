/**
 * WeaponCard Component
 *
 * Displays a hunter weapon card in the grid with basic information
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HunterWeapon } from "../types/weapon.types";
import {
  formatDamage,
  formatCost,
  formatWeaponProperties,
  getWeaponDescription,
} from "../services/weapon.service";

interface WeaponCardProps {
  weapon: HunterWeapon;
  onClick: () => void;
}

export function WeaponCard({ weapon, onClick }: WeaponCardProps) {
  const damage = formatDamage(weapon);
  const cost = formatCost(weapon.value);
  const properties = formatWeaponProperties(weapon);
  const description = getWeaponDescription(weapon);

  return (
    <Card
      className="transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-primary"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-xl">{weapon.name}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {weapon.source}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Damage */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Damage:</span>
            <span className="font-semibold">{damage}</span>
          </div>

          {/* Weight */}
          {weapon.weight && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Weight:</span>
              <span className="font-medium">{weapon.weight} lb.</span>
            </div>
          )}

          {/* AC Bonus */}
          {weapon.ac && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">AC Bonus:</span>
              <span className="font-medium">+{weapon.ac}</span>
            </div>
          )}

          {/* Cost */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cost:</span>
            <span className="font-medium">{cost}</span>
          </div>

          {/* Properties */}
          {properties.length > 0 && (
            <div className="pt-2">
              <div className="flex flex-wrap gap-1">
                {properties.map((prop, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {prop}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

