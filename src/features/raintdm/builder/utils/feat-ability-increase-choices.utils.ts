import type {
  AbilityKey,
  BuilderFeatAbilityIncreaseChoice,
  FeatAbilityIncrease,
} from "@/shared/types";

/** True when the increase offers more than one ability to pick from. */
export function isChoosableAbilityIncrease(
  increase: Pick<FeatAbilityIncrease, "abilities">,
): boolean {
  return increase.abilities.length > 1;
}

/**
 * Build persisted picks for a feat's abilityIncreases.
 * Fixed (+one ability) entries are auto-filled; choose entries start null
 * unless `randomize` or a compatible `previous` value is provided.
 */
export function buildFeatAbilityIncreaseChoices(
  increases: FeatAbilityIncrease[],
  options?: {
    previous?: BuilderFeatAbilityIncreaseChoice[];
    randomize?: boolean;
  },
): BuilderFeatAbilityIncreaseChoice[] {
  const previous = options?.previous;
  const randomize = options?.randomize === true;

  return increases.map((increase, index) => {
    const amount = increase.amount > 0 ? increase.amount : 1;

    if (increase.abilities.length === 1) {
      return { ability: increase.abilities[0], amount };
    }

    if (increase.abilities.length === 0) {
      return { ability: null, amount };
    }

    const prevAbility = previous?.[index]?.ability ?? null;
    if (prevAbility && increase.abilities.includes(prevAbility)) {
      return { ability: prevAbility, amount };
    }

    if (randomize) {
      const pick =
        increase.abilities[
          Math.floor(Math.random() * increase.abilities.length)
        ];
      return { ability: pick ?? null, amount };
    }

    return { ability: null, amount };
  });
}

export function areFeatAbilityIncreaseChoicesComplete(
  choices: BuilderFeatAbilityIncreaseChoice[] | undefined,
): boolean {
  if (!choices || choices.length === 0) return true;
  return choices.every((choice) => choice.ability !== null);
}

export function formatFeatAbilityIncreaseChoicesSummary(
  choices: BuilderFeatAbilityIncreaseChoice[] | undefined,
): string | null {
  if (!choices || choices.length === 0) return null;
  if (!areFeatAbilityIncreaseChoicesComplete(choices)) return "Ability unassigned";
  return choices
    .map((choice) => {
      const key = choice.ability!;
      return `+${choice.amount} ${key.toUpperCase()}`;
    })
    .join(", ");
}

export function setFeatAbilityIncreaseChoiceAt(
  choices: BuilderFeatAbilityIncreaseChoice[],
  index: number,
  ability: AbilityKey | null,
): BuilderFeatAbilityIncreaseChoice[] {
  return choices.map((choice, i) =>
    i === index ? { ...choice, ability } : choice,
  );
}
