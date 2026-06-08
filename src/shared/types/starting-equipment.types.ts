export interface StartingEquipmentItem {
  /** Stable id within the parent class/background offers. */
  id: string;
  name: string;
  quantity: number;
  source?: string;
  cost?: string;
  weight?: string;
}

export interface StartingEquipmentOption {
  /** Option key from 5etools (a, b, A, B, C, …). */
  key: string;
  items: StartingEquipmentItem[];
}

export interface StartingEquipmentGroup {
  id: string;
  label?: string;
  /** Items granted without mutually-exclusive choice. */
  guaranteed?: StartingEquipmentItem[];
  /** Mutually exclusive packages — pick items from at most one option. */
  options?: StartingEquipmentOption[];
}

export interface StartingEquipmentOffers {
  groups: StartingEquipmentGroup[];
  goldAlternative?: string;
  additionalFromBackground?: boolean;
}

export type StartingEquipmentSourceType = "class" | "background";

export interface StartingEquipmentSource {
  type: StartingEquipmentSourceType;
  id: string;
  name: string;
}
