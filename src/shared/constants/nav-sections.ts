/**
 * Single nav map for Sidebar + Home. Hunt Planner lives under World and
 * Exploration (not Bestiary). Sidebar uses icon/to/label; Home adds description
 * and optional badge.
 */
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Calculator,
  Clock,
  Crosshair,
  Flame,
  FlaskConical,
  Hammer,
  Layers,
  Leaf,
  LibraryBig,
  Map,
  PawPrint,
  ScrollText,
  Shield,
  ShoppingBag,
  Skull,
  Sparkles,
  Store,
  Sword,
  Swords,
  TreePine,
  UserRound,
  Users,
  UtensilsCrossed,
  Wand2,
} from "lucide-react";

export type NavItemDef = {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
  disabled?: boolean;
};

export type NavGroupDef = {
  label: string;
  items: NavItemDef[];
};

export type NavSectionDef = {
  id: string;
  label: string;
  groups: NavGroupDef[];
};

export const NAV_SECTIONS: NavSectionDef[] = [
  {
    id: "amellwind-raintdm",
    label: "Amellwind (RaintDM)",
    groups: [
      {
        label: "Character",
        items: [
          {
            to: "/builder",
            label: "Builder",
            icon: UserRound,
            description:
              "Create a full D&D character using catalogs from the whole toolbox, then export/import to Foundry VTT.",
            badge: "ALPHA",
          },
          {
            to: "/damage-calculator",
            label: "Damage Calculator",
            icon: Calculator,
            description: "Compare weapon builds by calculating expected DPT.",
          },
        ],
      },
      {
        label: "Weapons",
        items: [
          {
            to: "/weapon-forge",
            label: "Weapon Forge",
            icon: Hammer,
            description:
              "Browse curated RaintDM weapons or create and edit custom ones for your table.",
          },
        ],
      },
      {
        label: "Items",
        items: [
          {
            to: "/item-forge",
            label: "Items Forge",
            icon: Layers,
            description:
              "Browse curated RaintDM items and craft them with Amellwind Combo List recipes.",
          },
        ],
      },
    ],
  },
  {
    id: "amellwind",
    label: "Amellwind Homebrew",
    groups: [
      {
        label: "Character",
        items: [
          {
            to: "/character-guide",
            label: "Creation Guide",
            icon: BookOpen,
            description:
              "Step-by-step guide to creating an Amellwind character.",
          },
        ],
      },
      {
        label: "Bestiary and Rules",
        items: [
          {
            to: "/monsters",
            label: "Monsters",
            icon: Skull,
            description:
              "Complete bestiary of Monster Hunter with stat blocks.",
          },
          {
            to: "/conditions",
            label: "Conditions & Diseases",
            icon: AlertTriangle,
            description:
              "Blight conditions, afflictions and infectious diseases from Amellwind.",
          },
        ],
      },
      {
        label: "Species and Character Options",
        items: [
          {
            to: "/species",
            label: "Species",
            icon: Users,
            description: "Species and subraces from the Hunter's Guide.",
          },
          {
            to: "/backgrounds",
            label: "Backgrounds",
            icon: ScrollText,
            description: "Hunter backgrounds from the Amellwind manual.",
          },
          {
            to: "/feats",
            label: "Feats",
            icon: Sparkles,
            description: "Exclusive feats from the Amellwind homebrew.",
          },
        ],
      },
      {
        label: "Weapons, Runes, and Equipment",
        items: [
          {
            to: "/weapons",
            label: "Weapons",
            icon: Sword,
            description: "Hunter Weapons and their optional features.",
          },
          {
            to: "/runes",
            label: "Runes",
            icon: Flame,
            description: "Monster materials and visual Rune Planner for runes.",
          },
          {
            to: "/material-effects",
            label: "Material Effects",
            icon: Shield,
            description: "Material effects for armor and weapons.",
          },
          {
            to: "/items",
            label: "Items",
            icon: Layers,
            description: "Catalog of items from the Hunter's Guide.",
          },
        ],
      },
      {
        label: "World and Exploration",
        items: [
          {
            to: "/hunt",
            label: "Hunt Planner",
            icon: Crosshair,
            description:
              "Plan and simulate a monster hunt with tracking rolls and resource tables.",
          },
          {
            to: "/environments",
            label: "Environments",
            icon: TreePine,
            description: "Biomes and encounter/resource tables.",
          },
          {
            to: "/resources",
            label: "Resources",
            icon: Leaf,
            description: "Plants, minerals, and gatherable field resources.",
          },
          {
            to: "/shops",
            label: "Shops",
            icon: ShoppingBag,
            description: "Shops with shopping carts for your sessions.",
          },
          {
            to: "/cooking",
            label: "Cooking",
            icon: UtensilsCrossed,
            description: "Artisan cooking system from the manual.",
          },
          {
            to: "/combo",
            label: "Combo List",
            icon: FlaskConical,
            description: "Crafting and item combinations.",
          },
          {
            to: "/downtime",
            label: "Downtime",
            icon: Clock,
            description: "Free time activities between adventures.",
          },
        ],
      },
      {
        label: "NPCs and Companions",
        items: [
          {
            to: "/monstie-sidekick",
            label: "Monstie Sidekick",
            icon: PawPrint,
            description: "Monstie sidekick rules and creator.",
          },
          {
            to: "/npc-generator",
            label: "NPC Generator",
            icon: Bot,
            description: "Generate stat blocks for humanoid NPCs instantly.",
          },
        ],
      },
    ],
  },
  {
    id: "dnd5e",
    label: "D&D 5e Compendium",
    groups: [
      {
        label: "Spells and Classes",
        items: [
          {
            to: "/spells",
            label: "Spells",
            icon: Wand2,
            description: "Spells with filters by class, level, and source.",
          },
          {
            to: "/classes",
            label: "Classes",
            icon: Swords,
            description: "Base classes with subclass details.",
          },
        ],
      },
      {
        label: "Character Options",
        items: [
          {
            to: "/dnd-races",
            label: "Races",
            icon: Users,
            description: "Official 5e races, lineages, and subraces.",
          },
          {
            to: "/dnd-backgrounds",
            label: "Backgrounds",
            icon: ScrollText,
            description: "Official 5e backgrounds (2014 / 2024).",
          },
          {
            to: "/dnd-feats",
            label: "Feats",
            icon: Sparkles,
            description: "Official 5e feats.",
          },
        ],
      },
      {
        label: "Bestiary",
        items: [
          {
            to: "/bestiary",
            label: "Bestiary",
            icon: Skull,
            description: "Monsters from the MM and other official sources.",
          },
        ],
      },
      {
        label: "Equipment",
        items: [
          {
            to: "/dnd-items",
            label: "Items",
            icon: LibraryBig,
            description:
              "Magic items and equipment from the PHB, DMG, and other sources.",
          },
        ],
      },
      {
        label: "Character Tools",
        items: [
          {
            to: "/xanathar-backstory",
            label: "Xanathar Backstory",
            icon: Map,
            description: "Random backstory generator using XGE tables.",
          },
          {
            to: "/shop-generator",
            label: "Shop Generator",
            icon: Store,
            description:
              "Procedural D&D 5e shops with tiered stock, themes, and prices from the Dump Stat Adventures Magic Item Pricing spreadsheet.",
          },
        ],
      },
    ],
  },
];
