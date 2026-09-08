export interface SiegeWeaponAction {
  name: string;
  paragraphs: string[];
}

export interface SiegeWeapon {
  id: string;
  name: string;
  source: string;
  page?: number;
  sizeLabel: string;
  objectType: string;
  objectTypeLabel: string;
  acLabel: string;
  hpLabel: string;
  immunities: string[];
  paragraphs: string[];
  actions: SiegeWeaponAction[];
  summary: string;
}
