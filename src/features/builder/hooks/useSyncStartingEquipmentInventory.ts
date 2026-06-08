import { useEffect, useRef } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";

/**
 * Removes starting-equipment inventory rows when class or background is
 * cleared or replaced.
 */
export function useSyncStartingEquipmentInventory(): void {
  const { class: classRef, background: backgroundRef } = useCharacterBuilder();
  const { clearStartingEquipmentForSource } = useBuilderInventory();

  const prevClassId = useRef<string | null>(classRef?.id ?? null);
  const prevBackgroundId = useRef<string | null>(backgroundRef?.id ?? null);

  useEffect(() => {
    const prevId = prevClassId.current;
    const nextId = classRef?.id ?? null;

    if (prevId && prevId !== nextId) {
      clearStartingEquipmentForSource("class", prevId);
    }

    prevClassId.current = nextId;
  }, [classRef?.id, clearStartingEquipmentForSource]);

  useEffect(() => {
    const prevId = prevBackgroundId.current;
    const nextId = backgroundRef?.id ?? null;

    if (prevId && prevId !== nextId) {
      clearStartingEquipmentForSource("background", prevId);
    }

    prevBackgroundId.current = nextId;
  }, [backgroundRef?.id, clearStartingEquipmentForSource]);
}
