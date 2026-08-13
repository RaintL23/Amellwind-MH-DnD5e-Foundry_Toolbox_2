import type { ClassMetaListGroup } from "@/shared/types";

function isClassMetaListGroup(value: unknown): value is ClassMetaListGroup {
  return (
    typeof value === "object" &&
    value !== null &&
    "label" in value &&
    "items" in value &&
    Array.isArray((value as ClassMetaListGroup).items)
  );
}

/** Accepts grouped proficiencies or legacy flat strings from an older cache. */
export function normalizeClassMetaGroups(
  input: ClassMetaListGroup[] | string[] | undefined | null,
): ClassMetaListGroup[] {
  if (!input?.length) return [];

  if (isClassMetaListGroup(input[0])) {
    return (input as ClassMetaListGroup[])
      .map((group) => ({
        label: group.label,
        items: (group.items ?? []).filter(Boolean),
      }))
      .filter((group) => group.label && group.items.length > 0);
  }

  if (typeof input[0] === "string") {
    return (input as string[])
      .map((line) => {
        const colon = line.indexOf(":");
        if (colon > 0) {
          return {
            label: line.slice(0, colon).trim(),
            items: line
              .slice(colon + 1)
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean),
          };
        }
        return { label: "Other", items: [line] };
      })
      .filter((group) => group.items.length > 0);
  }

  return [];
}

export function hasClassMetaListContent(
  groups: ClassMetaListGroup[] | string[] | undefined | null,
  items?: string[] | undefined | null,
): boolean {
  return normalizeClassMetaGroups(groups).length > 0 || (items?.length ?? 0) > 0;
}
