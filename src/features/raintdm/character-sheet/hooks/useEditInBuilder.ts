import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { BuilderCharacterJson } from "@/features/raintdm/builder/builder-json/builder-character.types";
import { parseBuilderCharacter } from "@/features/raintdm/builder/builder-json/parse-builder-character";
import {
  loadBuilderAutosave,
  persistBuilderAutosave,
} from "@/features/raintdm/builder/storage/builder-autosave.storage";
import { handOffBuilderArt } from "@/features/raintdm/builder/storage/builder-art-handoff";
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
      if (!record.builderJson) {
        toast.error("This sheet has no Builder data to edit.");
        return;
      }
      // Same migrate + normalize pipeline as a file import, so older records
      // restore instead of being silently rejected by the autosave loader.
      const parsed = parseBuilderCharacter(record.builderJson);
      if (!parsed.ok) {
        toast.error(`This sheet's Builder data cannot be edited: ${parsed.error}`);
        return;
      }
      const json = parsed.data;

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
        multiclass: json.multiclass,
        snapshot: json.snapshot,
      });
      handOffBuilderArt(json.art);

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
