import type { NpcGender } from "@/shared/types/npc.types";
import type { Background } from "@/shared/types";
import type { Species } from "@/shared/types";
import type { NpcTemplate } from "@/shared/types/npc.types";
import { NPC_GENDER_LABELS } from "@/shared/types/npc.types";

export function resolveGender(gender: NpcGender): Exclude<NpcGender, "random"> {
  if (gender !== "random") return gender;
  const options: Exclude<NpcGender, "random">[] = ["male", "female"];
  return options[Math.floor(Math.random() * options.length)];
}

export function buildNpcDescriptor(
  gender: NpcGender,
  species: Species,
  template: NpcTemplate,
  background: Background | null,
): string {
  const resolved = resolveGender(gender);
  const genderLabel = NPC_GENDER_LABELS[resolved];
  const parts = [genderLabel, species.name, template.name];
  if (background) parts.push(background.name);
  return parts.join(" · ");
}

export function buildNpcDisplayName(
  customName: string,
  species: Species,
  template: NpcTemplate,
): string {
  if (customName.trim()) return customName.trim();
  return `${species.name} ${template.name}`;
}
