import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useBuilderCharacterJson } from "@/features/raintdm/builder/hooks/useBuilderCharacterJson";
import {
  createPlayCharacterRecord,
  recompilePlayCharacterRecord,
} from "../compile/compile-play-character";
import {
  getPlayCharacter,
  savePlayCharacter,
} from "../services/play-character.service";
import {
  getLinkedSheetId,
  setLinkedSheetId,
} from "../utils/linked-sheet.storage";
import { playSessionReducer } from "../utils/play-session-reducer";
import type { ConfirmDialogFn } from "./useConfirmDialog";
import { identitiesMatch } from "./useEditInBuilder";
import { PLAY_COMPILE_VERSION } from "../utils/play-character.types";

export function useSendToPlaySheet(confirm?: ConfirmDialogFn) {
  const buildJson = useBuilderCharacterJson();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const sendNew = useCallback(async () => {
    setBusy(true);
    try {
      const json = buildJson();
      const record = await createPlayCharacterRecord(json);
      await savePlayCharacter(record);
      setLinkedSheetId(record.id);
      toast.success(`Sent ${record.compiled.name} to Character Sheet`);
      navigate(`/sheet/${record.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send to sheet");
    } finally {
      setBusy(false);
    }
  }, [buildJson, navigate]);

  const updateExisting = useCallback(async () => {
    const linkedId = getLinkedSheetId();
    if (!linkedId) {
      await sendNew();
      return;
    }
    setBusy(true);
    try {
      const existing = await getPlayCharacter(linkedId);
      if (!existing) {
        await sendNew();
        return;
      }
      const json = buildJson();

      if (confirm && !identitiesMatch(json, existing.builderJson)) {
        setBusy(false);
        const ok = await confirm({
          title: "Update a different character?",
          description: `The linked sheet is "${existing.compiled.name}", but the Builder has "${json.core.name}". Update the linked sheet anyway? Choose Cancel and use Send as new if this is a different character.`,
          confirmLabel: "Update linked sheet",
          cancelLabel: "Cancel",
        });
        if (!ok) return;
        setBusy(true);
      }

      let next = await recompilePlayCharacterRecord(existing, json);
      const clamped = playSessionReducer(next.compiled, next.session, {
        type: "SYNC_CLAMP",
        compiled: next.compiled,
      });
      next = {
        ...next,
        session: clamped.session,
        compileVersion: PLAY_COMPILE_VERSION,
      };
      await savePlayCharacter(next);
      setLinkedSheetId(next.id);
      toast.success(`Updated ${next.compiled.name} on Character Sheet`);
      navigate(`/sheet/${next.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update sheet");
    } finally {
      setBusy(false);
    }
  }, [buildJson, navigate, sendNew, confirm]);

  return {
    busy,
    sendNew,
    updateExisting,
    linkedId: getLinkedSheetId(),
  };
}
