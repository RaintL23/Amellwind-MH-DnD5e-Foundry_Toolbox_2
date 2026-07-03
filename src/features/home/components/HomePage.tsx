import { Link } from "react-router-dom";
import {
  Sword,
  BookOpen,
  Wand2,
  Skull,
  ShoppingBag,
  UtensilsCrossed,
  Leaf,
  Map,
  Swords,
  AlertTriangle,
  Users,
  Sparkles,
  FlaskConical,
  ScrollText,
  LibraryBig,
  Layers,
  TreePine,
  Clock,
  Hammer,
  Shield,
  Calculator,
  UserRound,
  Flame,
  PawPrint,
  Bot,
  ImportIcon,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SectionItem {
  label: string;
  route: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const amellwindSections: { group: string; items: SectionItem[] }[] = [
  {
    group: "Character",
    items: [
      {
        label: "Builder",
        route: "/builder",
        description:
          "Create your hunter: stats, equipment, runes, and export/import to Foundry VTT.",
        icon: <UserRound className="h-5 w-5" />,
        badge: "ALPHA",
      },
      {
        label: "Damage Calculator",
        route: "/damage-calculator",
        description: "Compare weapon builds by calculating expected DPT.",
        icon: <Calculator className="h-5 w-5" />,
      },
      {
        label: "Creation Guide",
        route: "/character-guide",
        description: "Step-by-step guide to creating an Amellwind character.",
        icon: <BookOpen className="h-5 w-5" />,
      },
    ],
  },
  {
    group: "Bestiary and Rules",
    items: [
      {
        label: "Monsters",
        route: "/monsters",
        description: "Complete bestiary of Monster Hunter with stat blocks.",
        icon: <Skull className="h-5 w-5" />,
      },
      {
        label: "Conditions & Diseases",
        route: "/conditions",
        description:
          "Blight conditions, afflictions and infectious diseases from Amellwind.",
        icon: <AlertTriangle className="h-5 w-5" />,
      },
    ],
  },
  {
    group: "Species and Character Options",
    items: [
      {
        label: "Species",
        route: "/species",
        description: "Species and subraces from the Hunter's Guide.",
        icon: <Users className="h-5 w-5" />,
      },
      {
        label: "Backgrounds",
        route: "/backgrounds",
        description: "Hunter backgrounds from the Amellwind manual.",
        icon: <ScrollText className="h-5 w-5" />,
      },
      {
        label: "Feats",
        route: "/feats",
        description: "Exclusive feats from the Amellwind homebrew.",
        icon: <Sparkles className="h-5 w-5" />,
      },
    ],
  },
  {
    group: "Weapons, Runes, and Equipment",
    items: [
      {
        label: "Weapons",
        route: "/weapons",
        description: "Hunter Weapons and their optional features.",
        icon: <Sword className="h-5 w-5" />,
      },
      {
        label: "Runes",
        route: "/runes",
        description: "Monster materials and visual Rune Planner for runes.",
        icon: <Flame className="h-5 w-5" />,
      },
      {
        label: "Material Effects",
        route: "/material-effects",
        description: "Material effects for armor and weapons.",
        icon: <Shield className="h-5 w-5" />,
      },
      {
        label: "Items",
        route: "/items",
        description: "Catalog of items from the Hunter's Guide.",
        icon: <Layers className="h-5 w-5" />,
      },
    ],
  },
  {
    group: "World and Exploration",
    items: [
      {
        label: "Environments",
        route: "/environments",
        description: "Biomes and encounter/resource tables.",
        icon: <TreePine className="h-5 w-5" />,
      },
      {
        label: "Resources",
        route: "/resources",
        description: "Plants, minerals, and gatherable field resources.",
        icon: <Leaf className="h-5 w-5" />,
      },
      {
        label: "Shops",
        route: "/shops",
        description: "Shops with shopping carts for your sessions.",
        icon: <ShoppingBag className="h-5 w-5" />,
      },
      {
        label: "Cooking",
        route: "/cooking",
        description: "Artisan cooking system from the manual.",
        icon: <UtensilsCrossed className="h-5 w-5" />,
      },
      {
        label: "Combo List",
        route: "/combo",
        description: "Crafting and item combinations.",
        icon: <FlaskConical className="h-5 w-5" />,
      },
      {
        label: "Downtime",
        route: "/downtime",
        description: "Free time activities between adventures.",
        icon: <Clock className="h-5 w-5" />,
      },
    ],
  },
  {
    group: "NPCs and Companions",
    items: [
      {
        label: "Monstie Sidekick",
        route: "/monstie-sidekick",
        description: "Monstie sidekick rules and creator.",
        icon: <PawPrint className="h-5 w-5" />,
      },
      {
        label: "NPC Generator",
        route: "/npc-generator",
        description: "Generate stat blocks for humanoid NPCs instantly.",
        icon: <Bot className="h-5 w-5" />,
      },
    ],
  },
];

const dndSections: SectionItem[] = [
  {
    label: "Spells",
    route: "/spells",
    description: "Spells with filters by class, level, and source.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    label: "Classes",
    route: "/classes",
    description: "Base classes with subclass details.",
    icon: <Swords className="h-5 w-5" />,
  },
  {
    label: "Bestiary",
    route: "/bestiary",
    description: "Monsters from the MM and other official sources.",
    icon: <Skull className="h-5 w-5" />,
  },
  {
    label: "Races",
    route: "/dnd-races",
    description: "Official 5e races, lineages, and subraces.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Backgrounds",
    route: "/dnd-backgrounds",
    description: "Official 5e backgrounds (2014 / 2024).",
    icon: <ScrollText className="h-5 w-5" />,
  },
  {
    label: "Feats",
    route: "/dnd-feats",
    description: "Official 5e feats.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    label: "Items",
    route: "/dnd-items",
    description:
      "Magic items and equipment from the PHB, DMG, and other sources.",
    icon: <LibraryBig className="h-5 w-5" />,
  },
  {
    label: "Xanathar Backstory",
    route: "/xanathar-backstory",
    description: "Random backstory generator using XGE tables.",
    icon: <Map className="h-5 w-5" />,
  },
];

function SectionCard({ item }: { item: SectionItem }) {
  return (
    <Link to={item.route} className="group focus:outline-none">
      <Card className="h-full transition-colors hover:bg-accent hover:border-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader className="p-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-primary">{item.icon}</span>
            <CardTitle className="text-sm">{item.label}</CardTitle>
            {item.badge && (
              <Badge variant="orange" className="ml-auto text-[10px] py-0">
                {item.badge}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs leading-snug">
            {item.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export function HomePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      {/* Hero */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <Hammer className="h-7 w-7 text-primary shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight">
            Amellwind MH DnD5e Toolbox
          </h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
          Web toolkit for{" "}
          <span className="text-foreground font-medium">Dungeon Masters</span>{" "}
          and players of the{" "}
          <span className="text-foreground font-medium">Amellwind</span>{" "}
          homebrew, combining{" "}
          <span className="text-foreground font-medium">Monster Hunter</span>{" "}
          with <span className="text-foreground font-medium">D&amp;D 5e</span>.
          All data is synchronized and cached in your browser for offline access
          between sessions.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="secondary">
            <ImportIcon className="h-3 w-3 mr-1" />
            Export / Import Foundry VTT
          </Badge>
          <Badge variant="secondary">Offline after initial load</Badge>
          <Badge variant="secondary">v0.1.23</Badge>
        </div>
      </section>

      <Separator />

      {/* Amellwind sections */}
      <section className="space-y-7">
        <div>
          <h2 className="text-lg font-semibold">Amellwind Homebrew</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Exclusive content from the Amellwind Monster Hunter D&amp;D 5e
            system.
          </p>
        </div>

        {amellwindSections.map((group) => (
          <div key={group.group} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {group.group}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.items.map((item) => (
                <SectionCard key={item.route} item={item} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <Separator />

      {/* D&D 5e sections */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">D&D 5e Compendium</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official reference data loaded from{" "}
            <a
              href="https://5e.tools"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              5etools
            </a>
            . Not homebrew content from Amellwind.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {dndSections.map((item) => (
            <SectionCard key={item.route} item={item} />
          ))}
        </div>
      </section>

      {/* Footer note */}
      <Separator />
      <p className="text-xs text-muted-foreground pb-2">
        Fan-made project. Homebrew content is created by{" "}
        <a
          href="https://www.patreon.com/cw/amellwind"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Amellwind
        </a>
        . Monster Hunter is property of Capcom; D&amp;D is property of Wizards
        of the Coast.
      </p>
    </div>
  );
}
