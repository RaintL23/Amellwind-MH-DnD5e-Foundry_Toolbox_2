import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCharacterBuilder } from "@/features/raintdm/builder/context/CharacterBuilderContext";
import { useBuilderInventory } from "@/features/raintdm/builder/context/BuilderInventoryContext";
import { useSpellcastingContext } from "@/features/raintdm/builder/context/SpellcastingContext";
import { useEffectiveAbilityScores } from "@/features/raintdm/builder/hooks/useEffectiveAbilityScores";
import {
  buildBuilderCharacterJson,
  buildCharacterProvenance,
} from "@/features/raintdm/builder/builder-json";
import {
  createPlayCharacterRecord,
  recompilePlayCharacterRecord,
} from "../compile/compile-play-character";
import {
  getPlayCharacter,
  savePlayCharacter,
} from "../services/play-character.service";
import { getLinkedSheetId, setLinkedSheetId } from "../utils/linked-sheet.storage";
import { playSessionReducer } from "../utils/play-session-reducer";

export function useSendToPlaySheet() {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const effectiveAbilities = useEffectiveAbilityScores();
  const { bonusCantripPools, optionalFeatureSpellGrants } = useSpellcastingContext();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const buildJson = useCallback(() => {
    const provenance = buildCharacterProvenance({
      builder,
      effectiveAbilities,
      bonusSpellPools: bonusCantripPools,
      optionalFeatureSpellGrants,
    });
    return buildBuilderCharacterJson(
      builder,
      { items: inventory.items },
      provenance,
    );
  }, [
    builder,
    inventory.items,
    effectiveAbilities,
    bonusCantripPools,
    optionalFeatureSpellGrants,
  ]);

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
      let next = await recompilePlayCharacterRecord(existing, json);
      const clamped = playSessionReducer(next.compiled, next.session, {
        type: "SYNC_CLAMP",
        compiled: next.compiled,
      });
      next = { ...next, session: clamped.session };
      await savePlayCharacter(next);
      setLinkedSheetId(next.id);
      toast.success(`Updated ${next.compiled.name} on Character Sheet`);
      navigate(`/sheet/${next.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update sheet");
    } finally {
      setBusy(false);
    }
  }, [buildJson, navigate, sendNew]);

  return {
    busy,
    sendNew,
    updateExisting,
    linkedId: getLinkedSheetId(),
  };
}
