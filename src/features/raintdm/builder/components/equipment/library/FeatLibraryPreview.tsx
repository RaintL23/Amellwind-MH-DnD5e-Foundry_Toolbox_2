import { useEffect, useState } from "react";
import { getFeatById } from "@/features/amellwind/feats/services/feat.service";
import { getDndFeatById } from "@/features/dnd/feats/services/dnd-feat.service";
import type { BookSourceNameMap } from "@/features/dnd/spells/services/book-source.service";
import type { BuilderFeatSelection, DndFeat, Feat } from "@/shared/types";
import { FeatLibraryDetail } from "./FeatLibraryDetail";
import { EmptyState } from "./shared/LibraryUi";

/** Loads and renders a feat inline in a library row (read-only). */
export function FeatLibraryPreview({
  id,
  source,
  bookNames,
}: {
  id: string;
  source: Exclude<BuilderFeatSelection["source"], "asi">;
  bookNames: BookSourceNameMap;
}) {
  const [feat, setFeat] = useState<Feat | DndFeat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFeat(null);

    const load =
      source === "amellwind" ? getFeatById(id) : getDndFeatById(id);

    load
      .then((data) => {
        if (!cancelled) setFeat(data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, source]);

  if (loading) return <EmptyState text="Loading..." />;
  if (!feat) return <EmptyState text="Information not found." />;

  return <FeatLibraryDetail feat={feat} bookNames={bookNames} inline />;
}
