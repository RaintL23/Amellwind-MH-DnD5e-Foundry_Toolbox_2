import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { builderCharacterJsonFromPersistedBuild } from "@/features/raintdm/builder/builder-json";
import { loadBuilderAutosave } from "@/features/raintdm/builder/storage/builder-autosave.storage";
import {
  isBuilderExportReady,
  loadBuilderExportGate,
} from "@/features/raintdm/builder/storage/builder-export-gate.storage";
import { hasBuildContent } from "@/features/raintdm/builder/storage/builder-persist";
import { createPlayCharacterRecord } from "../compile/compile-play-character";
import { savePlayCharacter } from "../services/play-character.service";
import { setLinkedSheetId } from "../utils/linked-sheet.storage";

/**
 * Loads the active Builder autosave into a new play sheet when creation
 * checks are complete (same gate as Builder → Send to Character Sheet).
 */
export function useLoadFromBuilder() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const loadFromBuilder = useCallback(async () => {
    const saved = loadBuilderAutosave();
    if (!saved || !hasBuildContent(saved)) {
      toast.error("No character in the Builder yet. Open the Builder first.");
      return;
    }

    const gate = loadBuilderExportGate();
    if (!isBuilderExportReady(gate)) {
      const pending = gate?.issueCount ?? 0;
      toast.error(
        pending > 0
          ? `Builder character is incomplete (${pending} pending). Finish creation checks in the Builder first.`
          : "Builder character is incomplete. Finish creation checks in the Builder first.",
      );
      return;
    }

    setBusy(true);
    try {
      const json = builderCharacterJsonFromPersistedBuild(saved);
      const record = await createPlayCharacterRecord(json);
      await savePlayCharacter(record);
      setLinkedSheetId(record.id);
      toast.success(`Loaded ${record.compiled.name} from Builder`);
      navigate(`/sheet/${record.id}`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load from Builder",
      );
    } finally {
      setBusy(false);
    }
  }, [navigate]);

  return { busy, loadFromBuilder };
}
