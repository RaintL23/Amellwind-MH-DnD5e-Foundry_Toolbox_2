# Code Examples & Patterns

This document provides practical examples for common tasks and patterns used in this project.

## Table of Contents

1. [Creating a New Feature](#creating-a-new-feature)
2. [Creating UI Components](#creating-ui-components)
3. [Data Fetching Patterns](#data-fetching-patterns)
4. [Table Patterns](#table-patterns)
5. [Form Patterns](#form-patterns)
6. [Styling Patterns](#styling-patterns)

---

## Creating a New Feature

### Example: Items Feature

#### 1. Define Types (`src/features/items/types/item.types.ts`)

```typescript
export interface Item {
  name: string;
  type: "weapon" | "armor" | "consumable" | "material";
  rarity: "common" | "uncommon" | "rare" | "very rare" | "legendary";
  cost?: {
    amount: number;
    currency: string;
  };
  weight?: number;
  description: string;
  properties?: string[];
}

export interface ItemsResponse {
  items: Item[];
}
```

#### 2. Create Service (`src/features/items/services/item.service.ts`)

```typescript
import type { Item, ItemsResponse } from "../types/item.types";

const ITEMS_URL = "https://example.com/api/items.json";

export async function fetchItems(): Promise<Item[]> {
  try {
    const response = await fetch(ITEMS_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ItemsResponse = await response.json();
    return data.items;
  } catch (error) {
    console.error("Failed to fetch items:", error);
    throw error;
  }
}

// Helper to filter items by type
export function filterItemsByType(items: Item[], type: string): Item[] {
  if (type === "all") return items;
  return items.filter((item) => item.type === type);
}

// Helper to sort items by rarity
export function sortItemsByRarity(items: Item[]): Item[] {
  const rarityOrder = {
    common: 1,
    uncommon: 2,
    rare: 3,
    "very rare": 4,
    legendary: 5,
  };

  return [...items].sort(
    (a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]
  );
}
```

#### 3. Create Hook (`src/features/items/hooks/useItems.ts`)

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchItems } from "../services/item.service";
import type { Item } from "../types/item.types";

export const ITEMS_QUERY_KEY = ["items"] as const;

export function useItems() {
  return useQuery<Item[], Error>({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: fetchItems,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 2,
  });
}

// Hook with filtering
export function useFilteredItems(type: string) {
  const { data, ...rest } = useItems();

  const filteredData = React.useMemo(() => {
    if (!data) return undefined;
    return filterItemsByType(data, type);
  }, [data, type]);

  return { data: filteredData, ...rest };
}
```

#### 4. Create Component (`src/features/items/components/ItemList.tsx`)

```typescript
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useItems } from "../hooks/useItems";
import { ItemCard } from "./ItemCard";

export function ItemList() {
  const { data: items, isLoading, error } = useItems();
  const [filterType, setFilterType] = useState("all");

  const filteredItems = items?.filter(
    (item) => filterType === "all" || item.type === filterType
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Error: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Items & Equipment</CardTitle>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="weapon">Weapons</option>
              <option value="armor">Armor</option>
              <option value="consumable">Consumables</option>
              <option value="material">Materials</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems?.map((item) => (
              <ItemCard key={item.name} item={item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 5. Export Public API (`src/features/items/index.ts`)

```typescript
export { ItemList } from "./components/ItemList";
export { useItems } from "./hooks/useItems";
export type { Item } from "./types/item.types";
export { fetchItems } from "./services/item.service";
```

---

## Creating UI Components

### Example: Loading Spinner Component

```typescript
// src/components/ui/spinner.tsx
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
```

### Example: Alert Component

```typescript
// src/components/ui/alert.tsx
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

const variants = {
  info: "bg-blue-50 text-blue-900 border-blue-200",
  success: "bg-green-50 text-green-900 border-green-200",
  warning: "bg-yellow-50 text-yellow-900 border-yellow-200",
  error: "bg-red-50 text-red-900 border-red-200",
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: AlertProps) {
  const Icon = icons[variant];

  return (
    <div
      className={cn("rounded-lg border p-4", variants[variant], className)}
      role="alert"
    >
      <div className="flex gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          {title && <h5 className="font-semibold mb-1">{title}</h5>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
```

---

## Data Fetching Patterns

### Pattern: Dependent Queries

```typescript
// Fetch monster, then fetch its loot table
export function useMonsterWithLoot(monsterId: string) {
  // First query: get monster
  const { data: monster, ...monsterQuery } = useQuery({
    queryKey: ["monster", monsterId],
    queryFn: () => fetchMonster(monsterId),
  });

  // Second query: get loot (only runs if monster exists)
  const { data: loot, ...lootQuery } = useQuery({
    queryKey: ["loot", monster?.lootTableId],
    queryFn: () => fetchLootTable(monster!.lootTableId),
    enabled: !!monster?.lootTableId, // Only run if we have a loot table ID
  });

  return {
    monster,
    loot,
    isLoading: monsterQuery.isLoading || lootQuery.isLoading,
    error: monsterQuery.error || lootQuery.error,
  };
}
```

### Pattern: Parallel Queries

```typescript
// Fetch multiple resources at once
export function useGameData() {
  const monsters = useQuery({
    queryKey: ["monsters"],
    queryFn: fetchMonsters,
  });

  const items = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const crafting = useQuery({
    queryKey: ["crafting"],
    queryFn: fetchCraftingRecipes,
  });

  return {
    monsters: monsters.data,
    items: items.data,
    crafting: crafting.data,
    isLoading: monsters.isLoading || items.isLoading || crafting.isLoading,
    error: monsters.error || items.error || crafting.error,
  };
}
```

### Pattern: Mutations (Create/Update/Delete)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (monsterId: string) => {
      return fetch("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ monsterId }),
      });
    },
    onSuccess: () => {
      // Invalidate and refetch favorites
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

// Usage in component
function MonsterCard({ monster }) {
  const createFavorite = useCreateFavorite();

  const handleFavorite = () => {
    createFavorite.mutate(monster.id);
  };

  return (
    <Button onClick={handleFavorite} disabled={createFavorite.isPending}>
      {createFavorite.isPending ? "Saving..." : "Add to Favorites"}
    </Button>
  );
}
```

---

## Table Patterns

### Pattern: Custom Column with Actions

```typescript
const columns: ColumnDef<Item>[] = [
  // ... other columns
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleView(item)}>
            View
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
            Edit
          </Button>
        </div>
      );
    },
  },
];
```

### Pattern: Expandable Rows

```typescript
function DataTableWithExpand({ data }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const table = useReactTable({
    data,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <Table>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <>
            <TableRow key={row.id}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => row.toggleExpanded()}
                >
                  {row.getIsExpanded() ? "▼" : "▶"}
                </Button>
              </TableCell>
              {/* ... other cells */}
            </TableRow>
            {row.getIsExpanded() && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="p-4">
                    {/* Expanded content */}
                    <MonsterDetails monster={row.original} />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Form Patterns

### Pattern: Controlled Form with Validation

```typescript
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FormData {
  name: string;
  cr: string;
  type: string;
}

export function MonsterForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    cr: "",
    type: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.cr) {
      newErrors.cr = "CR is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      console.log("Form submitted:", formData);
      // Handle submission
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Monster Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <Input
          placeholder="Challenge Rating"
          value={formData.cr}
          onChange={(e) => setFormData({ ...formData, cr: e.target.value })}
        />
        {errors.cr && (
          <p className="text-sm text-destructive mt-1">{errors.cr}</p>
        )}
      </div>

      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

## Styling Patterns

### Pattern: Responsive Grid

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))}
</div>
```

### Pattern: Conditional Styling

```typescript
<div
  className={cn(
    "rounded-lg p-4 border",
    isActive && "bg-accent border-primary",
    isDisabled && "opacity-50 cursor-not-allowed",
    size === "lg" && "p-6 text-lg"
  )}
>
  {children}
</div>
```

### Pattern: Hover Effects

```typescript
<button
  className="
    px-4 py-2 rounded-md
    bg-primary text-primary-foreground
    hover:bg-primary/90
    active:scale-95
    transition-all duration-200
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-ring
  "
>
  Click me
</button>
```

---

## Best Practices Summary

1. **Always type your data** - Use TypeScript interfaces
2. **Separate concerns** - Keep services, hooks, and components separate
3. **Use React Query** - For all server state management
4. **Compose components** - Build complex UIs from simple pieces
5. **Handle loading/error states** - Always show feedback to users
6. **Make it accessible** - Use semantic HTML and ARIA labels
7. **Keep it responsive** - Test on mobile and desktop
8. **Document your code** - Add comments for complex logic

---

For more examples, explore the `src/features/monsters/` directory which implements all these patterns!
