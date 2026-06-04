import type { Background, Species } from "@/shared/types";
import type { NpcTemplate } from "@/shared/types/npc.types";
import { getAllBackgrounds } from "@/features/backgrounds/services/background.service";
import { getAllSpecies } from "@/features/species/services/species.service";
import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import { getOptionalFeaturesMap } from "@/features/weapons/services/optionalfeature.service";
import type { NpcWeaponContext } from "../utils/npc-weapon.utils";
import { NPC_TEMPLATES } from "../data/npc-templates.data";
import { NPC_TEMPLATE_PRIMARY_WEAPON } from "../data/npc-template-weapons.data";

function applyTemplateWeaponMap(templates: NpcTemplate[]): NpcTemplate[] {
  return templates.map((template) => {
    const primaryWeapon = NPC_TEMPLATE_PRIMARY_WEAPON[template.id];
    if (!primaryWeapon) return template;

    return {
      ...template,
      attacks: template.attacks.map((attack, index) => ({
        ...attack,
        mhWeaponName: index === 0 ? primaryWeapon : undefined,
      })),
    };
  });
}

export async function loadNpcGeneratorData(): Promise<{
  species: Species[];
  backgrounds: Background[];
  templates: NpcTemplate[];
  weaponContext: NpcWeaponContext;
}> {
  const [species, backgrounds, weapons, featuresMap] = await Promise.all([
    getAllSpecies(),
    getAllBackgrounds(),
    getAllWeapons(),
    getOptionalFeaturesMap(),
  ]);

  return {
    species: species.sort((a, b) => a.name.localeCompare(b.name)),
    backgrounds: backgrounds.sort((a, b) => a.name.localeCompare(b.name)),
    templates: applyTemplateWeaponMap(NPC_TEMPLATES),
    weaponContext: { weapons, featuresMap },
  };
}

export function getNpcTemplateById(id: string): NpcTemplate | undefined {
  return applyTemplateWeaponMap(NPC_TEMPLATES).find((t) => t.id === id);
}
