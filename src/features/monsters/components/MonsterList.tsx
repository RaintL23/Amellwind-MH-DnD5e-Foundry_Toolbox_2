/**
 * MonsterList Page Component
 *
 * Main page for displaying and interacting with Monster Hunter monsters
 * Handles data fetching, loading states, and error handling
 */

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMonsters } from "../hooks/useMonsters";
import { MonsterDataTable } from "./MonsterDataTable";
import { MonsterDetailCard } from "./MonsterDetailCard";
import type { Monster } from "../types/monster.types";

export function MonsterList() {
  const { data: monsters, isLoading, error } = useMonsters();
  const [selectedMonster, setSelectedMonster] = React.useState<Monster | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleRowClick = (monster: Monster) => {
    setSelectedMonster(monster);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Wait for animation to complete before clearing selected monster
    setTimeout(() => setSelectedMonster(null), 150);
  };

  return (
    <div className="container mx-auto py-6 px-4 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Monster Hunter Bestiary</CardTitle>
          <CardDescription>
            Browse and search through Amellwind's Monster Hunter monsters for
            D&D 5e
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading monsters...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2 max-w-md">
                <div className="text-destructive text-lg font-semibold">
                  Failed to load monsters
                </div>
                <p className="text-muted-foreground">
                  {error.message ||
                    "An error occurred while fetching monster data"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your internet connection and try again.
                </p>
              </div>
            </div>
          )}

          {monsters && monsters.length > 0 && (
            <MonsterDataTable data={monsters} onRowClick={handleRowClick} />
          )}

          {monsters && monsters.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              No monsters available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monster Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={handleCloseDialog}>
          <DialogHeader>
            <DialogTitle className="sr-only">
              {selectedMonster?.name || "Monster Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedMonster && <MonsterDetailCard monster={selectedMonster} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
