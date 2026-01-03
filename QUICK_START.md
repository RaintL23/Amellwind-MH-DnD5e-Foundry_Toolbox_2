# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
pnpm install
# or with npm
npm install
```

**Don't have pnpm?** Install it globally:

```bash
npm install -g pnpm
```

### 2. Start Development Server

```bash
pnpm dev
# or with npm
npm run dev
```

### 3. Open in Browser

Navigate to: **http://localhost:5173**

---

## 📖 What You'll See

### Monster Bestiary (Default Page)

- A searchable table of Monster Hunter monsters
- Filter by Type, Challenge Rating, and Environment
- Sort by any column
- Pagination for easy browsing
- **Click on any monster** to view detailed stats, abilities, and lore

### Navigation

- **Desktop:** Sidebar on the left with all tools
- **Mobile:** Hamburger menu in the top-right

---

## 🛠️ Available Commands

```bash
# Development
pnpm dev             # Start dev server with hot reload
# or: npm run dev

# Production
pnpm build           # Build for production
# or: npm run build

pnpm preview         # Preview production build locally
# or: npm run preview

# Code Quality
pnpm lint            # Run ESLint
# or: npm run lint
```

---

## 📱 Testing Responsive Design

### Desktop

- Open http://localhost:5173 in your browser
- Sidebar should be visible on the left
- Full table with all columns

### Mobile

- Open DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Select a mobile device
- Hamburger menu should appear
- Table should be scrollable

---

## 🎯 Key Features to Test

### Monster Bestiary

1. **Search**

   - Type in the search box at the top
   - Results filter in real-time

2. **Filter by Type**

   - Use the "All Types" dropdown
   - Select a specific monster type

3. **Filter by CR**

   - Use the "All CRs" dropdown
   - Select a specific Challenge Rating

4. **Filter by Environment**

   - Use the "All Environments" dropdown
   - Select a specific habitat/environment
   - **Tip:** Hover over "+X" badges to see hidden environments

5. **Sort**

   - Click any column header
   - Click again to reverse sort order

6. **Pagination**

   - Use Previous/Next buttons at bottom
   - See current page and total pages

7. **Monster Details**

   - Click any monster row to open detailed view with tabs
   - **Stat Block Tab**: Complete stats, abilities, traits, actions, reactions, and legendary actions
   - **Description Tab**: Monster lore and background information
   - **Image Tab**: Official artwork (when available)
   - **Runes Tab**: Monster Hunter rune information with tables showing armor and weapon material effects
   - Navigate between tabs to explore different aspects
   - Close with X button, click outside the dialog, or press ESC

8. **Dark Mode**
   - **Desktop:** Click sun/moon icon in sidebar footer
   - **Mobile:** Click sun/moon icon in header (top-right)
   - Theme preference is saved automatically
   - Works across all pages and dialogs

---

## 🔍 Project Structure Overview

```
src/
├── App.tsx                    # Main app with routing
├── main.tsx                   # Entry point
├── components/
│   ├── ui/                    # Reusable UI components
│   └── layout/                # Layout components
└── features/
    └── monsters/              # Monster feature
        ├── components/        # Monster UI
        ├── hooks/             # Data hooks
        ├── services/          # API calls
        └── types/             # TypeScript types
```

---

## 🎨 Customization

### Change Theme Colors

Edit `src/index.css` - look for CSS variables:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... more colors ... */
}
```

### Add a New Tool

1. Create folder: `src/features/[tool-name]/`
2. Follow the pattern from `monsters/`
3. Add navigation in `Sidebar.tsx`
4. Add route in `App.tsx`

---

## 📚 Documentation

- **README.md** - Project overview and features
- **ARCHITECTURE.md** - Technical architecture details
- **PROJECT_SUMMARY.md** - Complete feature list and status

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- --port 3000
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build
```

---

## 💡 Tips

1. **Hot Reload:** Changes auto-refresh in browser
2. **Console:** Check browser console for errors/logs
3. **Network Tab:** Monitor API calls to GitHub
4. **React DevTools:** Install for better debugging

---

## 🎉 You're Ready!

The app is now running and ready to use. Start exploring the Monster Bestiary or begin adding your own features!

**Need Help?**

- Check ARCHITECTURE.md for technical details
- Review code comments in the files
- Look at the Monster feature as a template
