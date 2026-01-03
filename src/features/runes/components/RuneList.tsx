/**
 * RuneList Page Component
 *
 * Main page for displaying and interacting with runes from all monsters
 * Handles data fetching, loading states, and error handling
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRunes } from "../hooks/useRunes";
import { RuneDataTable } from "./RuneDataTable";

export function RuneList() {
  const { data: runes, isLoading, error } = useRunes();

  return (
    <div className="container mx-auto py-6 px-4 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Material Runes</CardTitle>
          <CardDescription>
            Explore all material runes and their effects from Monster Hunter monsters.
            These runes can be applied to armor and weapons for special bonuses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading runes...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2 max-w-md">
                <div className="text-destructive text-lg font-semibold">
                  Failed to load runes
                </div>
                <p className="text-muted-foreground">
                  {error.message ||
                    "An error occurred while fetching rune data"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your internet connection and try again.
                </p>
              </div>
            </div>
          )}

          {runes && runes.length > 0 && <RuneDataTable data={runes} />}

          {runes && runes.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              No runes available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

