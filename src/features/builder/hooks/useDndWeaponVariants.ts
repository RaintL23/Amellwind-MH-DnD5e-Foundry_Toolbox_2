import { useEffect, useState } from "react";
import type { Weapon } from "@/shared/types";
import { getDndWeaponVariantsByName } from "@/features/dnd-items/services/dnd-equipment.service";

export function useDndWeaponVariants(
  enabled: boolean,
  weaponName: string | undefined,
): Weapon[] {
  const [variants, setVariants] = useState<Weapon[]>([]);

  useEffect(() => {
    if (!enabled || !weaponName) {
      setVariants([]);
      return;
    }

    let cancelled = false;
    void getDndWeaponVariantsByName(weaponName).then((result) => {
      if (!cancelled) setVariants(result);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, weaponName]);

  return variants;
}
