import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MaterialEffect, MaterialEffectSlot } from "@/shared/types";
import { getAllMaterialEffects } from "@/features/amellwind/material-effects/services/material-effect.service";
import { MaterialEffectDetailDialog } from "@/features/amellwind/material-effects/components/MaterialEffectDetailDialog";
import {
  MaterialEffectLinkContext,
  type MaterialEffectLinkValue,
} from "../context/material-effect-link.context";

/**
 * Loads the Material Effects catalog once and owns the single detail dialog
 * that every effect name on the page opens.
 */
export function MaterialEffectLinkProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [effects, setEffects] = useState<MaterialEffect[]>([]);
  const [selected, setSelected] = useState<MaterialEffect | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllMaterialEffects()
      .then((list) => {
        if (!cancelled) setEffects(list);
      })
      // Names fall back to plain text when the catalog can't load.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const byName = useMemo(() => {
    const map = new Map<string, MaterialEffect[]>();
    for (const effect of effects) {
      const key = effect.name.toLowerCase();
      map.set(key, [...(map.get(key) ?? []), effect]);
    }
    return map;
  }, [effects]);

  const find = useCallback(
    (name: string, slot?: MaterialEffectSlot) => {
      const matches = byName.get(name.toLowerCase()) ?? [];
      return (
        (slot ? matches.find((effect) => effect.slot === slot) : matches[0]) ??
        null
      );
    },
    [byName],
  );

  const value = useMemo<MaterialEffectLinkValue>(
    () => ({ find, open: setSelected }),
    [find],
  );

  return (
    <MaterialEffectLinkContext.Provider value={value}>
      {children}
      {selected && (
        <MaterialEffectDetailDialog
          effect={selected}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </MaterialEffectLinkContext.Provider>
  );
}
