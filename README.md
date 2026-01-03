# Monster Hunter D&D 5e Tool Hub

A professional, scalable React application for managing and exploring Amellwind's Monster Hunter content for D&D 5e.

## 🎯 Overview

This tool hub provides a comprehensive suite of utilities for DMs and players using the Monster Hunter homebrew content in D&D 5e campaigns. The project is designed with scalability in mind, making it easy to add new tools and features over time.

## 🧱 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **UI Components:** shadcn/ui inspired components
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query (React Query) for server state
- **Table Management:** TanStack Table
- **Icons:** Lucide React

## 📁 Project Structure

The project follows a feature-based architecture that promotes scalability and maintainability:

```
src/
├── components/          # Shared components
│   ├── ui/             # Reusable UI components (Button, Input, Table, etc.)
│   └── layout/         # Layout components (Sidebar, MobileNav, MainLayout)
├── features/           # Feature modules (self-contained)
│   └── monsters/       # Monster feature
│       ├── components/ # Monster-specific components
│       ├── hooks/      # Custom hooks for monsters
│       ├── services/   # API/data fetching services
│       └── types/      # TypeScript type definitions
├── lib/                # Utility functions
├── services/           # Global services (future use)
├── types/              # Global type definitions (future use)
├── hooks/              # Global custom hooks (future use)
├── App.tsx             # Root application component
├── main.tsx            # Application entry point
└── index.css           # Global styles and Tailwind imports
```

### Architecture Decisions

1. **Feature-based organization:** Each major tool (monsters, items, crafting) lives in its own feature folder with all related code (components, hooks, services, types).

2. **Shared UI components:** Common UI primitives are extracted to `components/ui/` for reuse across features.

3. **Separation of concerns:** Business logic (services), UI (components), and type definitions are clearly separated.

4. **Future-proof routing:** Currently using simple state-based routing; can be easily upgraded to React Router or TanStack Router when needed.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install
# or
npm install

# Start development server
pnpm dev
# or
npm run dev

# Build for production
pnpm build
# or
npm run build

# Preview production build
pnpm preview
# or
npm run preview
```

**Note:** This project uses **pnpm** as the package manager for faster installs and better disk space efficiency. 

**Why pnpm?** See [WHY_PNPM.md](./WHY_PNPM.md) for a detailed comparison and benefits.

If you don't have pnpm installed:
```bash
npm install -g pnpm
```

You can still use npm if you prefer - both work perfectly!

## 🐲 Features

### ✅ Monster Bestiary (Implemented)

A comprehensive, searchable database of Monster Hunter monsters adapted for D&D 5e.

**Features:**

- Real-time search and filtering
- Sort by Name, CR, Size, Type
- Filter by Type, Challenge Rating, and Environment
- Human-readable size names (Tiny, Small, Medium, Large, Huge, Gargantuan)
- Proper handling of complex CR values (base CR, lair CR, coven CR)
- Hover tooltips showing hidden environments
- **Detailed monster view with tabs**: Click on any monster to access:
  - **Stat Block**: Complete stats, abilities, traits, actions, and legendary actions
  - **Description**: Monster lore and background information
  - **Image**: Official artwork (when available)
  - **Runes**: Monster Hunter rune information (armor and weapon material effects)
- Pagination for large datasets
- Responsive design (mobile and desktop)
- Dark mode support with system preference detection
- Data fetched from Amellwind's GitHub homebrew collection

**Data Source:**
Monsters are loaded from [TheGiddyLimit/homebrew](https://github.com/TheGiddyLimit/homebrew) Monster Hunter Monster Manual collection.

### ✅ Theme System

**Dark Mode:**
- Toggle between light and dark themes
- Persists preference in localStorage
- Detects system preference on first load
- Available in both desktop sidebar and mobile header

### 🔜 Coming Soon

The following tools are planned for future releases:

- **Items & Equipment:** Browse Monster Hunter weapons, armor, and gear
- **Crafting System:** Craft equipment using monster materials
- **Armor Builder:** Design custom armor sets with set bonuses
- **Carving Tables:** Roll for materials after defeating monsters

## 🎨 Design Philosophy

- **Clean & Professional:** Minimalist design that doesn't distract from content
- **Mobile-First:** Fully responsive from phone to desktop
- **DM-Friendly:** Optimized for long sessions and quick reference
- **Accessibility:** Follows basic a11y best practices
- **Performance:** Efficient data caching and lazy loading

## 🔧 Development

### Adding a New Tool

1. Create a new feature folder in `src/features/[tool-name]/`
2. Add components, hooks, services, and types as needed
3. Update `src/components/layout/Sidebar.tsx` to add navigation item
4. Add route handling in `src/App.tsx`

Example structure for a new tool:

```
src/features/items/
├── components/
│   ├── ItemList.tsx
│   └── ItemDataTable.tsx
├── hooks/
│   └── useItems.ts
├── services/
│   └── item.service.ts
└── types/
    └── item.types.ts
```

### Code Style

- Use TypeScript for all new files
- Follow existing naming conventions
- Add JSDoc comments to complex functions
- Keep components small and focused
- Extract reusable logic into hooks

## 📝 Data Format

Monster data follows the 5etools JSON schema. See `src/features/monsters/types/monster.types.ts` for the full TypeScript interface.

## 🤝 Contributing

This project is based on [Amellwind's Monster Hunter content](https://github.com/TheGiddyLimit/homebrew) for D&D 5e.

## 📄 License

This project is for personal and community use. Monster Hunter content is adapted for D&D 5e based on Amellwind's homebrew work.

---

**Built with ❤️ for the D&D and Monster Hunter communities**
