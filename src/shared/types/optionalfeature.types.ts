export interface OptionalFeature {
  name: string;
  source: string;
  page?: number;
  featureType: string[];
  /** Weapon base name, e.g. "Accel Axe", parsed from prerequisite */
  weaponName: string;
  /** Rarity at which this feature is introduced, e.g. "Uncommon". Undefined = base/all rarities */
  prerequisiteRarity?: string;
  /** Rendered paragraphs, ready to display. List items are prefixed with "•" */
  paragraphs: string[];
}
