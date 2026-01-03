# Architecture Documentation

## Overview

This document explains the architectural decisions, patterns, and best practices used in the Monster Hunter D&D 5e Tool Hub.

## Core Principles

1. **Feature-based organization** - Each tool/feature is self-contained
2. **Separation of concerns** - Clear boundaries between UI, logic, and data
3. **Type safety** - Comprehensive TypeScript typing throughout
4. **Scalability** - Easy to add new features without affecting existing code
5. **Performance** - Efficient data fetching and caching strategies

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   └── layout/          # App-level layout components
├── features/            # Feature modules (main work happens here)
│   └── [feature-name]/
│       ├── components/  # Feature-specific components
│       ├── hooks/       # Custom React hooks
│       ├── services/    # Data fetching and business logic
│       ├── types/       # TypeScript types
│       └── index.ts     # Public API exports
├── lib/                 # Utility functions
└── App.tsx              # Root component with routing
```

## Feature Module Pattern

Each feature follows a consistent structure:

### 1. Types (`types/`)

- Define all TypeScript interfaces and types
- Based on external data schemas (e.g., 5etools JSON)
- Export from feature's `index.ts`

### 2. Services (`services/`)

- Handle data fetching and external API calls
- Contain business logic and data transformation
- Pure functions that can be easily tested
- No React dependencies

### 3. Hooks (`hooks/`)

- Custom React hooks for state management
- Integrate with TanStack Query for data fetching
- Handle loading, error, and success states
- Provide clean API for components

### 4. Components (`components/`)

- React components specific to the feature
- Focus on UI and user interaction
- Consume hooks for data and state
- Keep components small and focused

### 5. Index (`index.ts`)

- Central export point for the feature
- Defines the public API
- Makes imports cleaner: `import { MonsterList } from '@/features/monsters'`

## Data Fetching Strategy

### TanStack Query (React Query)

We use TanStack Query for all server state management:

**Benefits:**

- Automatic caching and background refetching
- Loading and error states built-in
- Request deduplication
- Optimistic updates capability

**Configuration:**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Usage Pattern:**

1. Create service function (`fetchMonsters()`)
2. Create custom hook (`useMonsters()`)
3. Use hook in component
4. Handle loading/error/success states in UI

## UI Component Strategy

### Component Hierarchy

1. **UI Primitives** (`components/ui/`)

   - Button, Input, Table, Card, etc.
   - Based on shadcn/ui patterns
   - Highly reusable, no business logic
   - Accept all standard HTML props

2. **Layout Components** (`components/layout/`)

   - App-level structure
   - Navigation, headers, footers
   - Responsive behavior

3. **Feature Components** (`features/[name]/components/`)
   - Feature-specific logic
   - Compose UI primitives
   - Handle data and interactions

### Styling Approach

- **Tailwind CSS** for all styling
- **CSS Variables** for theming
- **Mobile-first** responsive design
- **Utility-first** classes

## Routing

Currently using **simple state-based routing**:

- Single `currentPage` state in App.tsx
- Conditional rendering based on route
- Easy to understand and debug

**Future Migration Path:**
Can easily migrate to React Router or TanStack Router:

1. Replace state with router
2. Update navigation handlers
3. Components remain unchanged

## Adding a New Feature

### Step-by-Step Guide

1. **Create Feature Folder**

```bash
mkdir -p src/features/[feature-name]/{components,hooks,services,types}
```

2. **Define Types** (`types/`)

```typescript
// types/[feature].types.ts
export interface Item {
  name: string;
  type: string;
  // ...
}
```

3. **Create Service** (`services/`)

```typescript
// services/[feature].service.ts
export async function fetchItems(): Promise<Item[]> {
  // fetch logic
}
```

4. **Create Hook** (`hooks/`)

```typescript
// hooks/useItems.ts
export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });
}
```

5. **Create Components** (`components/`)

```typescript
// components/ItemList.tsx
export function ItemList() {
  const { data, isLoading, error } = useItems();
  // render logic
}
```

6. **Export Public API** (`index.ts`)

```typescript
// index.ts
export { ItemList } from "./components/ItemList";
export { useItems } from "./hooks/useItems";
export type { Item } from "./types/item.types";
```

7. **Add Navigation**
   Update `src/components/layout/Sidebar.tsx`:

```typescript
{
  id: "items",
  title: "Items",
  icon: <Package />,
  href: "/items",
  enabled: true,
}
```

8. **Add Route**
   Update `src/App.tsx`:

```typescript
case "/items":
  return <ItemList />;
```

## Performance Considerations

### Data Fetching

- Cache data aggressively (TanStack Query handles this)
- Use appropriate `staleTime` for each query
- Implement pagination for large datasets

### Component Rendering

- Keep components small and focused
- Use React.memo() sparingly (only when needed)
- Avoid unnecessary re-renders

### Bundle Size

- Code splitting opportunities (not implemented yet)
- Tree-shaking through proper exports
- Monitor bundle size in build output

## Testing Strategy (Future)

### Recommended Approach

1. **Unit Tests** - Services and utilities

   - Test data transformation logic
   - Test helper functions
   - Pure functions are easy to test

2. **Integration Tests** - Hooks

   - Test React Query hooks
   - Mock API responses
   - Verify loading/error states

3. **Component Tests** - UI Components
   - Test user interactions
   - Verify correct rendering
   - Test accessibility

## Accessibility

### Current Implementation

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management

### Future Improvements

- Screen reader testing
- Skip navigation links
- Better focus indicators
- ARIA live regions for dynamic content

## Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- ES2022 features used
- No IE11 support

## Deployment

### Build for Production

```bash
npm run build
```

### Output

- Static files in `dist/` folder
- Can be deployed to any static hosting (Vercel, Netlify, GitHub Pages, etc.)
- No server-side rendering required

## Future Enhancements

### Planned Features

1. Monster detail view with full stat blocks
2. Print-friendly views
3. Favorites/bookmarks system
4. Export to various formats (PDF, JSON)
5. Offline support (PWA)
6. Dark mode toggle

### Technical Improvements

1. Add React Router for better URL management
2. Implement code splitting
3. Add comprehensive testing
4. Set up CI/CD pipeline
5. Add error boundary components
6. Implement analytics

## Contributing Guidelines

1. Follow existing file structure
2. Use TypeScript strictly
3. Add JSDoc comments for complex functions
4. Keep components focused and small
5. Test in mobile and desktop views
6. Maintain accessibility standards

## Questions?

For questions about architecture decisions or patterns, refer to:

- Code comments in the files
- This documentation
- The main README.md
