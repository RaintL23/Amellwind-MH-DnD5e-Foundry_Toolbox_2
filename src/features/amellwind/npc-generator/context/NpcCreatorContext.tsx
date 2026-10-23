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
import { resolveGender } from "../utils/npc-descriptor";

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
  // "Random" gender is rolled once (and on randomize/reset), not on every rebuild.
  const [rolledGender, setRolledGender] = useState(() => resolveGender("random"));
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const rolledGenderRef = useRef(rolledGender);
  rolledGenderRef.current = rolledGender;

  /** Draft with "random" gender pinned to the rolled value (names / descriptor agree). */
  const withResolvedGender = useCallback(
    (d: NpcDraft): NpcDraft => ({
      ...d,
      gender: d.gender === "random" ? rolledGenderRef.current : d.gender,
    }),
    [],
  );

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
    const prev = draftRef.current;
    if (
      patch.attributeArray !== undefined &&
      patch.attributeArray !== prev.attributeArray
    ) {
      setAbilityScores(rollAttributeArray(patch.attributeArray));
    }
    if (patch.gender === "random" && prev.gender !== "random") {
      setRolledGender(resolveGender("random"));
    }

    setDraftState((current) => {
      const next = { ...current, ...patch };
      if (patch.templateId !== undefined) {
        const template = getNpcTemplateById(patch.templateId);
        if (template) {
          next.hitDiceCount = clampHitDiceForTier(
            template.tier,
            patch.hitDiceCount ?? current.hitDiceCount,
          );
        }
      }
      return next;
    });
  }, []);

  const applyRandomPatch = useCallback(
    (patch: Partial<NpcDraft>, rerollScores: boolean) => {
      if (rerollScores && patch.attributeArray) {
        setAbilityScores(rollAttributeArray(patch.attributeArray));
      }
      setDraftState((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const randomizeField = useCallback(
    (field: keyof NpcDraft) => {
      void (async () => {
        const patch = await randomizeNpcDraft(
          withResolvedGender(draftRef.current),
          species,
          backgrounds,
          field,
        );
        applyRandomPatch(patch, field === "attributeArray");
      })();
    },
    [species, backgrounds, withResolvedGender, applyRandomPatch],
  );

  const randomizeAll = useCallback(() => {
    void (async () => {
      const patch = await randomizeNpcDraft(
        withResolvedGender(draftRef.current),
        species,
        backgrounds,
      );
      applyRandomPatch(patch, true);
    })();
  }, [species, backgrounds, withResolvedGender, applyRandomPatch]);

  const resetDraft = useCallback(() => {
    const defaultDraft = createDefaultNpcDraft(species, backgrounds);
    setDraftState(defaultDraft);
    setAbilityScores(rollAttributeArray(defaultDraft.attributeArray));
    setRolledGender(resolveGender("random"));
  }, [species, backgrounds]);

  const builtNpc = useMemo(() => {
    const template = getNpcTemplateById(draft.templateId);
    const sp = species.find((s) => s.id === draft.speciesId);
    if (!template || !sp) return null;
    const bg =
      backgrounds.find((b) => b.id === draft.backgroundId) ?? null;
    return buildNpcFromDraft(
      { ...draft, gender: draft.gender === "random" ? rolledGender : draft.gender },
      template,
      sp,
      bg,
      abilityScores,
      weaponContext,
    );
  }, [draft, species, backgrounds, abilityScores, weaponContext, rolledGender]);

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
