export interface ComboRow {
  category: string;
  name: string;
  item1: string;
  item2: string;
  dc: string;
  quantity: string;
}

export interface ComboToolTable {
  id: string;
  toolName: string;
  hasCategory: boolean;
  rows: ComboRow[];
}

export interface ComboRuleSection {
  name: string;
  content: string[];
  isInset?: boolean;
}
