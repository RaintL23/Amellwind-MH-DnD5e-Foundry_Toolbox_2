export const CASTER_OPTIONS = [
  { value: "", label: "All casters" },
  { value: "full", label: "Full caster" },
  { value: "1/2", label: "Half caster" },
  { value: "1/3", label: "Third caster" },
  { value: "artificer", label: "Artificer" },
  { value: "none", label: "None" },
] as const;

export const DEFAULT_EXCLUDED_SOURCES = ["UATheMysticClass"] as const;

export function defaultSelectedSources(sourceOptions: string[]): string[] {
  return sourceOptions.filter(
    (source) =>
      !DEFAULT_EXCLUDED_SOURCES.includes(
        source as (typeof DEFAULT_EXCLUDED_SOURCES)[number],
      ),
  );
}
