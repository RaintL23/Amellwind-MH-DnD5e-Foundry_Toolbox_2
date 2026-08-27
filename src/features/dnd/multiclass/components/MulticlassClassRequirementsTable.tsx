import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { Class } from "@/shared/types";
import type { AbilityKey } from "@/shared/types";
import { ABILITY_NAMES } from "@/shared/constants/dnd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatRequirements(cls: Class): string {
  if (!cls.multiclassRequirements) return "—";
  return Object.entries(cls.multiclassRequirements)
    .map(([ability, value]) => `${ABILITY_NAMES[ability as AbilityKey]} ${value}`)
    .join(", ");
}

function formatProficiencies(cls: Class): string {
  if (cls.multiclassing.length) {
    const gained = cls.multiclassing.find((line) =>
      line.startsWith("Proficiencies gained:"),
    );
    if (gained) return gained.replace("Proficiencies gained: ", "");
  }
  return "—";
}

export function MulticlassClassRequirementsTable({
  classes,
  loading,
}: {
  classes: Class[];
  loading: boolean;
}) {
  const rows = useMemo(
    () =>
      [...classes]
        .filter((cls) => !cls.isSidekick)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Prerequisites</TableHead>
            <TableHead>Proficiencies When Multiclassing</TableHead>
            <TableHead>Caster Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((cls) => (
            <TableRow key={cls.id}>
              <TableCell>
                <Link
                  to={`/classes/${cls.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {cls.name}
                </Link>
                {cls.edition === "one" ? (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    2024
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatRequirements(cls)}
              </TableCell>
              <TableCell className="max-w-md text-sm text-muted-foreground">
                {formatProficiencies(cls)}
              </TableCell>
              <TableCell className="text-sm capitalize text-muted-foreground">
                {cls.casterProgression ?? "none"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
