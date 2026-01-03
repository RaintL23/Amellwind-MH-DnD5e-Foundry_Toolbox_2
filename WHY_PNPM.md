# Por qué usar pnpm / Why use pnpm

## 🚀 Español

### ¿Qué es pnpm?

**pnpm** (performant npm) es un gestor de paquetes rápido y eficiente para JavaScript que resuelve muchos problemas de npm y yarn.

### Ventajas principales

#### 1. **Ahorro de espacio en disco** 💾

- pnpm usa un **almacenamiento de contenido direccionable** (content-addressable storage)
- Los paquetes se almacenan una sola vez en tu máquina en `~/.pnpm-store`
- Los proyectos crean enlaces simbólicos a ese almacén
- **Resultado:** Ahorro de hasta 50-70% de espacio en disco

**Ejemplo:**

- Con npm: 10 proyectos con React = React instalado 10 veces
- Con pnpm: 10 proyectos con React = React instalado 1 vez, 10 enlaces

#### 2. **Instalaciones más rápidas** ⚡

- Primera instalación: similar a npm
- Instalaciones subsecuentes: **hasta 2x más rápido**
- No necesita descargar paquetes que ya están en el almacén

#### 3. **Estructura de node_modules más limpia** 📁

- Solo las dependencias declaradas están accesibles
- Previene el uso accidental de dependencias no declaradas
- Evita el "dependency hell"

#### 4. **Monorepos nativos** 🏗️

- Soporte nativo para workspaces
- Excelente para proyectos grandes con múltiples paquetes

#### 5. **Compatible con npm** ✅

- Usa el mismo `package.json`
- Comandos casi idénticos
- Fácil migración desde npm

### Comparación de comandos

| npm                   | pnpm                | Descripción           |
| --------------------- | ------------------- | --------------------- |
| `npm install`         | `pnpm install`      | Instalar dependencias |
| `npm install <pkg>`   | `pnpm add <pkg>`    | Agregar paquete       |
| `npm uninstall <pkg>` | `pnpm remove <pkg>` | Quitar paquete        |
| `npm run <script>`    | `pnpm <script>`     | Ejecutar script       |
| `npm update`          | `pnpm update`       | Actualizar paquetes   |

### Instalación

```bash
# Con npm (una vez)
npm install -g pnpm

# Verificar instalación
pnpm --version
```

### Migración desde npm

```bash
# 1. Eliminar node_modules y package-lock.json
rm -rf node_modules package-lock.json

# 2. Instalar con pnpm
pnpm install

# ¡Listo! Tu proyecto ahora usa pnpm
```

### Configuración recomendada (.npmrc)

```ini
# Instalar peers automáticamente
auto-install-peers=true

# No ser estricto con peer dependencies
strict-peer-dependencies=false

# Mejor compatibilidad con herramientas
shamefully-hoist=true
```

---

## 🚀 English

### What is pnpm?

**pnpm** (performant npm) is a fast, disk space efficient package manager for JavaScript that solves many problems of npm and yarn.

### Main advantages

#### 1. **Disk space savings** 💾

- pnpm uses **content-addressable storage**
- Packages are stored once on your machine in `~/.pnpm-store`
- Projects create symbolic links to that store
- **Result:** Save up to 50-70% disk space

**Example:**

- With npm: 10 projects with React = React installed 10 times
- With pnpm: 10 projects with React = React installed once, 10 links

#### 2. **Faster installations** ⚡

- First install: similar to npm
- Subsequent installs: **up to 2x faster**
- No need to download packages already in the store

#### 3. **Cleaner node_modules structure** 📁

- Only declared dependencies are accessible
- Prevents accidental use of undeclared dependencies
- Avoids "dependency hell"

#### 4. **Native monorepos** 🏗️

- Native workspace support
- Excellent for large projects with multiple packages

#### 5. **npm compatible** ✅

- Uses the same `package.json`
- Almost identical commands
- Easy migration from npm

### Command comparison

| npm                   | pnpm                | Description          |
| --------------------- | ------------------- | -------------------- |
| `npm install`         | `pnpm install`      | Install dependencies |
| `npm install <pkg>`   | `pnpm add <pkg>`    | Add package          |
| `npm uninstall <pkg>` | `pnpm remove <pkg>` | Remove package       |
| `npm run <script>`    | `pnpm <script>`     | Run script           |
| `npm update`          | `pnpm update`       | Update packages      |

### Installation

```bash
# With npm (once)
npm install -g pnpm

# Verify installation
pnpm --version
```

### Migration from npm

```bash
# 1. Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# 2. Install with pnpm
pnpm install

# Done! Your project now uses pnpm
```

### Recommended configuration (.npmrc)

```ini
# Auto-install peers
auto-install-peers=true

# Not strict with peer dependencies
strict-peer-dependencies=false

# Better compatibility with tools
shamefully-hoist=true
```

---

## 📊 Benchmarks

According to official benchmarks (as of 2024):

- **Installation speed:** pnpm ≥ yarn > npm
- **Disk space:** pnpm << yarn < npm
- **Node modules size:** pnpm < yarn ≈ npm

## 🔗 Resources

- Official website: https://pnpm.io
- Documentation: https://pnpm.io/motivation
- GitHub: https://github.com/pnpm/pnpm

## ❓ Can I still use npm?

**Yes!** This project works with both npm and pnpm. We recommend pnpm for its advantages, but npm works perfectly fine.

To use npm instead:

```bash
npm install
npm run dev
```

The choice is yours! 🎉
