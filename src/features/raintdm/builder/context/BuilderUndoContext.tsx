import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useCharacterBuilder } from "./CharacterBuilderContext";
import { useBuilderInventory } from "./BuilderInventoryContext";
import {
  buildBuilderPersistPayload,
  replaceBuilderBuild,
  type BuilderPersistPayload,
} from "../storage/builder-persist";
import {
  describeCascadeLoss,
  type CascadeChange,
} from "../utils/cascade-loss.utils";

interface UndoPoint {
  payload: BuilderPersistPayload;
  portrait: string | null;
  token: string | null;
}

interface BuilderUndoContextValue {
  /**
   * Applies a class/species/background change. When it clears choices the
   * player already made, shows what was cleared with a one-click Undo.
   */
  changeIdentity: (
    change: CascadeChange,
    next: { id: string; name: string } | null,
    apply: () => void,
  ) => void;
}

const CHANGE_LABEL: Record<CascadeChange, string> = {
  class: "Class",
  species: "Species",
  background: "Background",
};

const UNDO_TOAST_DURATION_MS = 10_000;

const BuilderUndoContext = createContext<BuilderUndoContextValue | null>(null);

/**
 * Lives for the whole Builder page (not inside a library panel) so Undo still
 * restores after the panel that triggered the change has unmounted. Restores
 * through replaceBuilderBuild, the same path as Builder JSON import.
 */
export function BuilderUndoProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const builderRef = useRef(builder);
  builderRef.current = builder;
  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;

  const restore = useCallback((point: UndoPoint) => {
    replaceBuilderBuild(
      () => builderRef.current,
      () => inventoryRef.current,
      point.payload,
    );
    // resetBuild clears the art, which is not part of the persisted snapshot.
    builderRef.current.setPortraitImage(point.portrait);
    builderRef.current.setTokenImage(point.token);
    toast.message("Change undone");
  }, []);

  const changeIdentity = useCallback<BuilderUndoContextValue["changeIdentity"]>(
    (change, next, apply) => {
      const current = builderRef.current;
      const currentId = current[change]?.id ?? null;
      const sameId = next !== null && currentId === next.id;

      // Re-picking the same background is a no-op in the identity slice.
      const lost =
        change === "background" && sameId
          ? []
          : describeCascadeLoss(current, change, {
              sameSpecies: change === "species" && sameId,
            });

      if (lost.length === 0) {
        apply();
        return;
      }

      const point: UndoPoint = {
        payload: buildBuilderPersistPayload(current, {
          items: inventoryRef.current.items,
        }),
        portrait: current.portraitImage,
        token: current.tokenImage,
      };

      apply();

      toast(
        next
          ? `${CHANGE_LABEL[change]} changed to ${next.name}`
          : `${CHANGE_LABEL[change]} removed`,
        {
          description: `Cleared: ${lost.join(", ")}`,
          duration: UNDO_TOAST_DURATION_MS,
          action: { label: "Undo", onClick: () => restore(point) },
        },
      );
    },
    [restore],
  );

  const value = useMemo(() => ({ changeIdentity }), [changeIdentity]);

  return (
    <BuilderUndoContext.Provider value={value}>
      {children}
    </BuilderUndoContext.Provider>
  );
}

/** Outside the Builder page, changes apply directly with no Undo. */
export function useBuilderUndo(): BuilderUndoContextValue {
  return (
    useContext(BuilderUndoContext) ?? {
      changeIdentity: (_change, _next, apply) => apply(),
    }
  );
}
