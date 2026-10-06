import { useEffect, useState } from "react";
import { getBackgroundById } from "@/features/amellwind/backgrounds/services/background.service";
import { getDndBackgroundById } from "@/features/dnd/backgrounds/services/dnd-background.service";
import { resolveSpeciesParts } from "@/features/raintdm/builder/utils/species-resolution.utils";
import type { IdentityDataSource } from "@/features/raintdm/builder/utils/builder-library-filters";
import type { BookSourceNameMap } from "@/features/dnd/spells/services/book-source.service";
import type { DndRace, Species } from "@/shared/types";
import type { BackgroundDetailData } from "@/shared/utils/background-display.utils";
import { IdentityLibraryDetail } from "./IdentityLibraryDetail";
import { EmptyState } from "./shared/LibraryUi";

type IdentityPreviewData =
  | { kind: "species"; species: Species | DndRace }
  | { kind: "background"; background: BackgroundDetailData }
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
        const species = mhSpecies ?? dndRace;
        return species ? { kind: "species", species } : null;
      }
      const background =
        identitySource === "dnd"
          ? await getDndBackgroundById(id)
          : await getBackgroundById(id);
      return background ? { kind: "background", background } : null;
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
      bookNames={bookNames}
      inline
    />
  );
}
