import type { CookingRank } from "@/shared/types";
import type { CookingActiveTab } from "@/shared/types";

export const RANK_COLORS: Record<
  CookingRank,
  {
    badge: "blue" | "green" | "orange" | "red";
    bg: string;
    text: string;
    border: string;
  }
> = {
  1: {
    badge: "blue",
    bg: "bg-blue-900/20",
    text: "text-blue-300",
    border: "border-blue-700/40",
  },
  2: {
    badge: "green",
    bg: "bg-green-900/20",
    text: "text-green-300",
    border: "border-green-700/40",
  },
  3: {
    badge: "orange",
    bg: "bg-orange-900/20",
    text: "text-orange-300",
    border: "border-orange-700/40",
  },
  4: {
    badge: "red",
    bg: "bg-red-900/20",
    text: "text-red-300",
    border: "border-red-700/40",
  },
};

export const RANK_COST: Record<CookingRank, string> = {
  1: "1 sp",
  2: "1 gp",
  3: "5 gp",
  4: "10 gp",
};

export const COOKING_RANK_TABS = ["rank1", "rank2", "rank3", "rank4"] as const;

export const COOKING_TAB_CONFIG: {
  id: CookingActiveTab;
  label: string;
}[] = [
  { id: "rules", label: "How to Cook" },
  { id: "rank1", label: "Rank 1" },
  { id: "rank2", label: "Rank 2" },
  { id: "rank3", label: "Rank 3" },
  { id: "rank4", label: "Rank 4" },
  { id: "daily", label: "Daily Skills" },
];
