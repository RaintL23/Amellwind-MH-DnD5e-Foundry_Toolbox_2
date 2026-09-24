import { useEffect, useState } from "react";
import { getBackgroundById } from "@/features/amellwind/backgrounds/services/background.service";
import { getDndBackgroundById } from "@/features/dnd/backgrounds/services/dnd-background.service";
import { resolveSpeciesParts } from "@/features/raintdm/builder/utils/species-resolution.utils";
import type { IdentityDataSource } from "@/features/raintdm/builder/utils/builder-library-filters";
import type { BookSourceNameMap } from "@/features/dnd/spells/services/book-source.service";
import type { Background, DndBackground, Species } from "@/shared/types";
import { IdentityLibraryDetail } from "./IdentityLibraryDetail";
import { EmptyState } from "./shared/LibraryUi";

/** Background detail props that depend on the catalog (D&D 2024 vs Amellwind). */
export function getBackgroundDetailExtras(
  background: Background,
  identitySource: IdentityDataSource,
) {
  const isDnd = identitySource === "dnd";
  return {
    startingEquipmentOffers:
      isDnd && "startingEquipmentOffers" in background
        ? (background as unknown as DndBackground).startingEquipmentOffers
        : undefined,
    backgroundAbilitySummary:
      isDnd &&
      "abilitySummary" in background &&
      typeof background.abilitySummary === "string"
        ? background.abilitySummary
        : null,
    backgroundFeatSummary:
      isDnd &&
      "featSummary" in background &&
      typeof background.featSummary === "string"
        ? background.featSummary
        : !isDnd && background.originFeatGrant?.summary
          ? background.originFeatGrant.summary
          : null,
  };
}

type IdentityPreviewData =
  | { kind: "species"; species: Species }
  | { kind: "background"; background: Background }
  | null;

/** Loads and renders a species/background inline in a library row (read-only). */
export function IdentityLibraryPreview({
  id,
  kind,
  identitySource,
  bookNames,
}: {
  id: string;
  kind: "species" | "background";
  identitySource: IdentityDataSource;
  bookNames: BookSourceNameMap;
}) {
  const [data, setData] = useState<IdentityPreviewData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);

    async function load(): Promise<IdentityPreviewData> {
      if (kind === "species") {
        const { mhSpecies, dndRace } = await resolveSpeciesParts({
          id,
          subraceId: null,
        });
        const species = mhSpecies ?? (dndRace as unknown as Species | null);
        return species ? { kind: "species", species } : null;
      }
      const background =
        identitySource === "dnd"
          ? await getDndBackgroundById(id)
          : await getBackgroundById(id);
      return background
        ? { kind: "background", background: background as Background }
        : null;
    }

    void load()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, kind, identitySource]);

  if (loading) return <EmptyState text="Loading..." />;
  if (!data) return <EmptyState text="Information not found." />;

  if (data.kind === "species") {
    return (
      <IdentityLibraryDetail
        species={data.species}
        bookNames={bookNames}
        inline
      />
    );
  }

  return (
    <IdentityLibraryDetail
      background={data.background}
      {...getBackgroundDetailExtras(data.background, identitySource)}
      bookNames={bookNames}
      inline
    />
  );
}
