import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Background, GeneratedNpc, NpcDraft, Species } from "@/shared/types";
import type { NpcTemplate } from "@/shared/types/npc.types";
import type { NpcWeaponContext } from "../utils/npc-weapon.utils";
import { buildNpcFromDraft } from "../utils/build-npc";
import { rollAttributeArray } from "../utils/npc-abilities";
import {
  createDefaultNpcDraft,
  randomizeNpcDraft,
} from "../utils/npc-randomizer";
import {
  getNpcTemplateById,
  loadNpcGeneratorData,
} from "../services/npc-generator.service";
import { clampHitDiceForTier } from "../utils/npc-power-scaling";

interface NpcCreatorContextValue {
  loading: boolean;
  species: Species[];
  backgrounds: Background[];
  templates: NpcTemplate[];
  weaponContext: NpcWeaponContext | null;
  draft: NpcDraft;
  builtNpc: GeneratedNpc | null;
  setDraft: (patch: Partial<NpcDraft>) => void;
  randomizeField: (field: keyof NpcDraft) => void;
  randomizeAll: () => void;
  resetDraft: () => void;
}

const NpcCreatorContext = createContext<NpcCreatorContextValue | null>(null);

export function NpcCreatorProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [species, setSpecies] = useState<Species[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [templates, setTemplates] = useState<NpcTemplate[]>([]);
  const [weaponContext, setWeaponContext] = useState<NpcWeaponContext | null>(
    null,
  );
  const [draft, setDraftState] = useState<NpcDraft>({
    customName: "",
    gender: "random",
    templateId: "",
    speciesId: "",
    backgroundId: "",
    attributeArray: "standard",
    hitDiceCount: 8,
    hitDie: 8,
    hideFeatures: [],
  });
  const [abilityScores, setAbilityScores] = useState<number[]>(() =>
    rollAttributeArray("standard"),
  );
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    loadNpcGeneratorData()
      .then(({ species: s, backgrounds: b, templates: t, weaponContext: wc }) => {
        setSpecies(s);
        setBackgrounds(b);
        setTemplates(t);
        setWeaponContext(wc);
        const defaultDraft = createDefaultNpcDraft(s, b);
        setDraftState(defaultDraft);
        setAbilityScores(rollAttributeArray(defaultDraft.attributeArray));
      })
      .finally(() => setLoading(false));
  }, []);

  const setDraft = useCallback((patch: Partial<NpcDraft>) => {
    setDraftState((prev) => {
      const next = { ...prev, ...patch };

      if (patch.templateId !== undefined) {
        const template = getNpcTemplateById(patch.templateId);
        if (template) {
          next.hitDiceCount = clampHitDiceForTier(
            template.tier,
            patch.hitDiceCount ?? prev.hitDiceCount,
          );
        }
      }

      if (
        patch.attributeArray !== undefined &&
        patch.attributeArray !== prev.attributeArray
      ) {
        setAbilityScores(rollAttributeArray(patch.attributeArray));
      }
      return next;
    });
  }, []);

  const randomizeField = useCallback(
    (field: keyof NpcDraft) => {
      void (async () => {
        const patch = await randomizeNpcDraft(
          draftRef.current,
          species,
          backgrounds,
          field,
        );
        setDraftState((prev) => {
          const next = { ...prev, ...patch };
          if (field === "attributeArray" && patch.attributeArray) {
            setAbilityScores(rollAttributeArray(patch.attributeArray));
          }
          return next;
        });
      })();
    },
    [species, backgrounds],
  );

  const randomizeAll = useCallback(() => {
    void (async () => {
      const patch = await randomizeNpcDraft(
        draftRef.current,
        species,
        backgrounds,
      );
      setDraftState((prev) => {
        const next = { ...prev, ...patch };
        if (patch.attributeArray) {
          setAbilityScores(rollAttributeArray(patch.attributeArray));
        }
        return next;
      });
    })();
  }, [species, backgrounds]);

  const resetDraft = useCallback(() => {
    const defaultDraft = createDefaultNpcDraft(species, backgrounds);
    setDraftState(defaultDraft);
    setAbilityScores(rollAttributeArray(defaultDraft.attributeArray));
  }, [species, backgrounds]);

  const builtNpc = useMemo(() => {
    const template = getNpcTemplateById(draft.templateId);
    const sp = species.find((s) => s.id === draft.speciesId);
    if (!template || !sp) return null;
    const bg =
      backgrounds.find((b) => b.id === draft.backgroundId) ?? null;
    return buildNpcFromDraft(draft, template, sp, bg, abilityScores, weaponContext);
  }, [draft, species, backgrounds, abilityScores, weaponContext]);

  const value = useMemo(
    () => ({
      loading,
      species,
      backgrounds,
      templates,
      weaponContext,
      draft,
      builtNpc,
      setDraft,
      randomizeField,
      randomizeAll,
      resetDraft,
    }),
    [
      loading,
      species,
      backgrounds,
      templates,
      weaponContext,
      draft,
      builtNpc,
      setDraft,
      randomizeField,
      randomizeAll,
      resetDraft,
    ],
  );

  return (
    <NpcCreatorContext.Provider value={value}>
      {children}
    </NpcCreatorContext.Provider>
  );
}

export function useNpcCreator() {
  const ctx = useContext(NpcCreatorContext);
  if (!ctx) {
    throw new Error("useNpcCreator must be used within NpcCreatorProvider");
  }
  return ctx;
}
