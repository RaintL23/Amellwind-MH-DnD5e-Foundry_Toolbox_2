export interface MHItem {
  name: string;
  source: string;
  type: string;
  typeLabel: string;
  rarity: string;
  valueCp: number | null;
  weight: number | null;
  page?: number;
  entries: unknown[];
}

export interface CartEntry {
  name: string;
  cost: string;
  weight: string;
  source?: string;
  shopName?: string;
  quantity: number;
}

export interface ShopEntry {
  name: string;
  cost: string;
  weight: string;
  category?: string;
  craftOnly?: boolean;
  extra?: string;
}

export interface ShopSection {
  caption?: string;
  entries: ShopEntry[];
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  requirement?: string;
  sections: ShopSection[];
}
