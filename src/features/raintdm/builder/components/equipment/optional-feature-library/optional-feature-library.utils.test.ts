import { describe, expect, it } from "vitest";
import type { BuilderOptionalFeatureSelection } from "@/shared/types";
import { mapDndOptionalFeature } from "@/features/dnd/optionalfeatures/mappers/dnd-optionalfeature.mapper";
import { optionalFeatureToCatalogItem } from "@/features/dnd/classes/utils/optional-feature-catalog.utils";
import { dndOptionalFeatureToSelection } from "@/features/raintdm/builder/utils/class-optional-features.utils";
import {
  canAddOptionalFeature,
  countOptionalFeaturePicks,
  removeOptionalFeaturePick,
} from "./optional-feature-library.utils";

const lessons = mapDndOptionalFeature({
  name: "Lessons of the First Ones",
  source: "XPHB",
  featureType: ["EI"],
  prerequisite: [
    { level: { level: 2, class: { name: "Warlock", source: "XPHB" } } },
  ],
  featProgression: [
    { name: "Origin Feat", category: ["O"], progression: { "*": 1 } },
  ],
  entries: [
    "You have received knowledge from an elder entity of the multiverse, allowing you to gain one {@filter Origin feat|feats|category=o} of your choice.",
    {
      type: "entries",
      entries: [
        {
          type: "entries",
          name: "Repeatable",
          entries: [
            "You can gain this invocation more than once. Each time you do so, choose a different Origin feat.",
          ],
        },
      ],
    },
  ],
});

const devilsSight = mapDndOptionalFeature({
  name: "Devil's Sight",
  source: "XPHB",
  featureType: ["EI"],
  entries: ["You can see normally in Dim Light and Darkness."],
});

const progressionId = "warlock-invocations";
const activeProgression = {
  progression: {
    id: progressionId,
    name: "Eldritch Invocations",
    featureTypes: ["EI"],
    scope: "class" as const,
    ownerId: "warlock",
    progression: [1, 3],
  },
  slotCount: 3,
};

function canAdd(
  feature: typeof lessons,
  picked: BuilderOptionalFeatureSelection[],
): boolean {
  const item = optionalFeatureToCatalogItem(feature);
  return canAddOptionalFeature(item, {
    isGrantAllFeatureChoice: false,
    isPicked: countOptionalFeaturePicks(item, picked) > 0,
    atCapacity: picked.length >= activeProgression.slotCount,
    optionalCatalog: [lessons, devilsSight],
    otherFightingStylePicks: [],
    activeProgression,
    className: "Warlock",
    level: 5,
    picked,
    progressionId,
  });
}

describe("repeatable optional features", () => {
  it("detects Lessons of the First Ones as repeatable", () => {
    expect(lessons.isRepeatable).toBe(true);
    expect(devilsSight.isRepeatable).toBe(false);
  });

  it("allows another copy of a repeatable pick until capacity", () => {
    const one = [dndOptionalFeatureToSelection(lessons, progressionId)];
    expect(canAdd(lessons, one)).toBe(true);

    const full = [...one, ...one, ...one];
    expect(canAdd(lessons, full)).toBe(false);
  });

  it("removes only the last copy of a repeatable pick", () => {
    const lessonsSel = dndOptionalFeatureToSelection(lessons, progressionId);
    const sightSel = dndOptionalFeatureToSelection(devilsSight, progressionId);
    const picked = [lessonsSel, sightSel, { ...lessonsSel }];

    const next = removeOptionalFeaturePick(
      optionalFeatureToCatalogItem(lessons),
      picked,
    );
    expect(next).toEqual([lessonsSel, sightSel]);

    const withoutSight = removeOptionalFeaturePick(
      optionalFeatureToCatalogItem(devilsSight),
      picked,
    );
    expect(withoutSight).toEqual([lessonsSel, { ...lessonsSel }]);
  });
});
