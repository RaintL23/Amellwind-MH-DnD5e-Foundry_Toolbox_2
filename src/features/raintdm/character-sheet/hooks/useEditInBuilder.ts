import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { BuilderCharacterJson } from "@/features/raintdm/builder/builder-json/builder-character.types";
import {
  BUILDER_AUTOSAVE_VERSION,
  loadBuilderAutosave,
  persistBuilderAutosave,
} from "@/features/raintdm/builder/storage/builder-autosave.storage";
import { BUILDER_SNAPSHOT_VERSION } from "@/features/raintdm/builder/foundry-export/builder-snapshot";
import { hasBuildContent } from "@/features/raintdm/builder/storage/builder-persist";
import type { ConfirmDialogFn } from "./useConfirmDialog";
import { setLinkedSheetId } from "../utils/linked-sheet.storage";
import type { PlayCharacterRecord } from "../utils/play-character.types";

/**
 * Load this sheet's builderJson into the Builder autosave and navigate.
 * Confirms when the Builder already has a different character.
 */
export function useEditInBuilder(confirm: ConfirmDialogFn) {
  const navigate = useNavigate();

  return useCallback(
    async (record: PlayCharacterRecord) => {
      const json = record.builderJson;
      if (!json?.identity || !json?.core || !json?.snapshot) {
        toast.error("This sheet has no Builder data to edit.");
        return;
      }

      const existing = loadBuilderAutosave();
      if (existing && hasBuildContent(existing)) {
        const sameName =
          existing.core.name.trim().toLowerCase() ===
          json.core.name.trim().toLowerCase();
        const sameClass =
          (existing.identity.class?.id ?? existing.identity.class?.name) ===
          (json.identity.class?.id ?? json.identity.class?.name);
        if (!sameName || !sameClass) {
          const ok = await confirm({
            title: "Replace Builder character?",
            description: `The Builder has "${existing.core.name}". Load "${json.core.name}" from this sheet instead? Unsaved Builder changes will be overwritten.`,
            confirmLabel: "Load sheet character",
          });
          if (!ok) return;
        }
      }

      persistBuilderAutosave({
        identity: json.identity,
        core: json.core,
        multiclass: json.multiclass ?? {
          enabled: false,
          entries: [],
          primaryClassLevel: json.core.level || 1,
        },
        snapshot: json.snapshot,
      });
      // Keep version fields aligned if persistBuilderAutosave only stores payload
      void BUILDER_AUTOSAVE_VERSION;
      void BUILDER_SNAPSHOT_VERSION;

      setLinkedSheetId(record.id);
      toast.success(`Loaded ${json.core.name} in Builder`);
      navigate("/builder");
    },
    [confirm, navigate],
  );
}

export function sheetIdentityKey(json: BuilderCharacterJson): string {
  const name = json.core.name.trim().toLowerCase();
  const classKey =
    json.identity.class?.id ??
    json.identity.class?.name?.toLowerCase() ??
    "";
  return `${name}|${classKey}`;
}

export function identitiesMatch(
  a: BuilderCharacterJson,
  b: BuilderCharacterJson,
): boolean {
  return sheetIdentityKey(a) === sheetIdentityKey(b);
}
