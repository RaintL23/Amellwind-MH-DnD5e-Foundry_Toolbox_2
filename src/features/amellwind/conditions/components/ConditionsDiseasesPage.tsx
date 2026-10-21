import { MhmmSourceNotice } from "@/shared/components/MhmmSourceNotice";
import { getAllDiseases } from "@/features/amellwind/diseases/services/disease.service";
import { getAllConditions } from "../services/condition.service";
import { ConditionsDiseasesView } from "./ConditionsDiseasesView";

const loadConditionsAndDiseases = () =>
  Promise.all([getAllConditions(), getAllDiseases()]);
const getMhConditionBadge = () => "Blight / Condition";

export function ConditionsDiseasesPage() {
  return (
    <ConditionsDiseasesView
      listId="mh-conditions-diseases"
      load={loadConditionsAndDiseases}
      conditionAccentClassName="text-rose-400"
      getConditionBadge={getMhConditionBadge}
      description={
        <>
          Blight conditions, afflictions and infectious diseases from the{" "}
          <span className="text-foreground/80">Monster Hunter Monster Manual</span>{" "}
          (Conditions, Poisons, and Diseases chapter).
        </>
      }
      notice={<MhmmSourceNotice className="mt-4" />}
    />
  );
}
