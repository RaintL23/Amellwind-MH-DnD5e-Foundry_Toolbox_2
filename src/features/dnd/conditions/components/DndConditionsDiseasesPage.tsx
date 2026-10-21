import type { DndCondition } from "@/shared/types";
import {
  ConditionsDiseasesView,
  matchesNameOrSummary,
} from "@/features/amellwind/conditions/components/ConditionsDiseasesView";
import {
  getListDndConditions,
  getListDndDiseases,
} from "../services/dnd-condition.service";

const loadConditionsAndDiseases = () =>
  Promise.all([getListDndConditions(), getListDndDiseases()]);
const getDndConditionBadge = (item: DndCondition) =>
  item.category === "status" ? "Status" : "Condition";
const matchesDndCondition = (item: DndCondition, query: string) =>
  matchesNameOrSummary(item, query) || item.category.includes(query);

export function DndConditionsDiseasesPage() {
  return (
    <ConditionsDiseasesView
      listId="dnd-conditions-diseases"
      load={loadConditionsAndDiseases}
      conditionAccentClassName="text-amber-400"
      getConditionBadge={getDndConditionBadge}
      matchesCondition={matchesDndCondition}
      description={
        <>
          Classic D&amp;D 5e conditions, statuses, and diseases from the
          Player&apos;s Handbook, DMG, and other official sources (2014 / 2024).
        </>
      }
    />
  );
}
