/**
 * WeaponList Page Component
 *
 * Main page for displaying Hunter Weapons in a grid
 * Shows weapon cards with basic info and opens detail dialog on click
 */

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWeapons } from "../hooks/useWeapons";
import { WeaponCard } from "./WeaponCard";
import { WeaponDetailDialog } from "./WeaponDetailDialog";
import type { HunterWeapon } from "../types/weapon.types";

export function WeaponList() {
  const { data: weapons, isLoading, error } = useWeapons();
  const [selectedWeapon, setSelectedWeapon] = React.useState<HunterWeapon | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleWeaponClick = (weapon: HunterWeapon) => {
    setSelectedWeapon(weapon);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => setSelectedWeapon(null), 150);
  };

  // Filter weapons by search query
  const filteredWeapons = React.useMemo(() => {
    if (!weapons) return [];
    if (!searchQuery) return weapons;

    const query = searchQuery.toLowerCase();
    return weapons.filter((weapon) =>
      weapon.name.toLowerCase().includes(query)
    );
  }, [weapons, searchQuery]);

  return (
    <div className="container mx-auto py-6 px-4 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Hunter Weapons</CardTitle>
          <CardDescription>
            Browse all Monster Hunter weapons adapted for D&D 5e. Each weapon has
            multiple rarity tiers with unique features and bonuses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <Input
              placeholder="Search weapons by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading weapons...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2 max-w-md">
                <div className="text-destructive text-lg font-semibold">
                  Failed to load weapons
                </div>
                <p className="text-muted-foreground">
                  {error.message ||
                    "An error occurred while fetching weapon data"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your internet connection and try again.
                </p>
              </div>
            </div>
          )}

          {/* Weapons Grid */}
          {filteredWeapons && filteredWeapons.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWeapons.map((weapon) => (
                <WeaponCard
                  key={`${weapon.name}-${weapon.source}`}
                  weapon={weapon}
                  onClick={() => handleWeaponClick(weapon)}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {filteredWeapons &&
            filteredWeapons.length === 0 &&
            !isLoading &&
            searchQuery && (
              <div className="text-center py-12 text-muted-foreground">
                No weapons found matching "{searchQuery}"
              </div>
            )}

          {/* Empty State */}
          {weapons && weapons.length === 0 && !isLoading && !searchQuery && (
            <div className="text-center py-12 text-muted-foreground">
              No weapons available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weapon Detail Dialog */}
      <WeaponDetailDialog
        weapon={selectedWeapon}
        open={dialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
}

