# Monster Hunter D&D 5e - Centro de Herramientas

## 🎉 ¡Proyecto Completado!

Has creado exitosamente un **Tool Hub profesional y escalable** para contenido de Monster Hunter adaptado a D&D 5e, basado en el trabajo de Amellwind.

---

## 📋 ¿Qué se ha construido?

### ✅ Infraestructura Completa

- **React 18** con **TypeScript** y **Vite**
- **Tailwind CSS** para estilos modernos
- **TanStack Query** para gestión de datos
- **TanStack Table** para tablas avanzadas
- Componentes UI estilo **shadcn/ui**
- Arquitectura basada en features (escalable)

### ✅ Herramienta Principal: Bestiario de Monstruos

**Completamente funcional** con:

- 🔍 Búsqueda en tiempo real
- 🎯 Filtros por Tipo y CR (Challenge Rating)
- ⬆️⬇️ Ordenamiento por cualquier columna
- 📏 Nombres legibles de tamaños (Tiny, Small, Medium, Large, Huge, Gargantuan)
- 🏰 Manejo correcto de CR complejos (CR base, CR en guarida, CR en aquelarre)
- 💡 Tooltips informativos mostrando ambientes ocultos
- 📖 **Vista detallada de monstruos con pestañas**: Haz clic en cualquier monstruo para acceder a:
  - **Stat Block**: Estadísticas completas, habilidades, rasgos, acciones y acciones legendarias
  - **Descripción**: Historia y trasfondo del monstruo
  - **Imagen**: Arte oficial (cuando esté disponible)
  - **Runas**: Información de runas de Monster Hunter (efectos de materiales de armadura y armas)
- 📄 Paginación (20 monstruos por página)
- 📱 Diseño responsive (móvil y escritorio)
- 🌓 Modo oscuro con persistencia
- ⚡ Caché inteligente (24 horas)
- 🎨 UI limpia y profesional

### ✅ Sistema de Navegación

- **Escritorio:** Sidebar fijo con lista de herramientas
- **Móvil:** Menú hamburguesa con drawer
- Herramientas futuras marcadas como "Coming Soon"
- Fácil de extender con nuevas herramientas

### ✅ Sistema de Temas

**Modo Oscuro:**

- Alternar entre tema claro y oscuro
- Preferencia guardada en localStorage
- Detección automática de preferencia del sistema
- Botón de cambio disponible en escritorio (sidebar) y móvil (header)

---

## 🚀 Cómo Usar

### Iniciar el Proyecto

```bash
# 1. Instalar dependencias (si no lo has hecho)
pnpm install
# o con npm
npm install

# 2. Iniciar servidor de desarrollo
pnpm dev
# o con npm
npm run dev

# 3. Abrir en el navegador
# → http://localhost:5173
```

**Nota:** Este proyecto usa **pnpm** como gestor de paquetes para instalaciones más rápidas y mejor uso del espacio en disco.

**¿Por qué pnpm?** Lee [WHY_PNPM.md](./WHY_PNPM.md) para ver una comparación detallada y beneficios.

Si no tienes pnpm instalado:

```bash
npm install -g pnpm
```

¡Puedes seguir usando npm si lo prefieres - ambos funcionan perfectamente!

### Compilar para Producción

```bash
# Crear build de producción
pnpm build
# o con npm
npm run build

# Vista previa del build
pnpm preview
# o con npm
npm run preview
```

---

## 📁 Estructura del Proyecto

```
📦 Proyecto
├── 📄 README.md              # Documentación principal (inglés)
├── 📄 LEEME.md               # Este archivo (español)
├── 📄 QUICK_START.md         # Guía rápida de inicio
├── 📄 ARCHITECTURE.md        # Documentación técnica
├── 📄 EXAMPLES.md            # Ejemplos de código
├── 📄 CHECKLIST.md           # Lista de verificación
├── 📄 PROJECT_SUMMARY.md     # Resumen completo del proyecto
│
└── 📁 src/
    ├── 📄 App.tsx                    # Componente raíz + rutas
    ├── 📄 main.tsx                   # Punto de entrada
    │
    ├── 📁 components/
    │   ├── 📁 ui/                    # Componentes UI reutilizables
    │   └── 📁 layout/                # Componentes de layout
    │
    ├── 📁 features/
    │   └── 📁 monsters/              # Feature de Monstruos
    │       ├── components/           # Componentes específicos
    │       ├── hooks/                # Hooks personalizados
    │       ├── services/             # Lógica de datos
    │       └── types/                # Tipos TypeScript
    │
    └── 📁 lib/                       # Utilidades
```

---

## 🎯 Herramientas Disponibles

| Herramienta                | Estado          | Ruta        |
| -------------------------- | --------------- | ----------- |
| **Bestiario de Monstruos** | ✅ Completo     | `/monsters` |
| Objetos y Equipo           | 🔜 Próximamente | `/items`    |
| Sistema de Crafteo         | 🔜 Próximamente | `/crafting` |
| Constructor de Armaduras   | 🔜 Próximamente | `/armor`    |
| Tablas de Despiece         | 🔜 Próximamente | `/carving`  |

---

## 🎨 Características Principales

### Bestiario de Monstruos

1. **Búsqueda Global**

   - Escribe en el campo de búsqueda
   - Filtra monstruos por nombre en tiempo real

2. **Filtros**

   - **Por Tipo:** Selecciona tipo de criatura
   - **Por CR:** Filtra por nivel de desafío
   - **Por Ambiente:** Filtra por entorno/hábitat

3. **Ordenamiento**

   - Haz clic en cualquier encabezado de columna
   - Ordena ascendente o descendente

4. **Modo Oscuro**

   - Haz clic en el ícono de sol/luna
   - Cambia entre tema claro y oscuro
   - Preferencia guardada automáticamente

5. **Responsive**
   - **Móvil:** Menú hamburguesa, tabla desplazable
   - **Tablet:** Layout optimizado
   - **Escritorio:** Sidebar completo

---

## 🛠️ Stack Tecnológico

| Tecnología     | Uso                        |
| -------------- | -------------------------- |
| React 18       | Framework UI               |
| TypeScript     | Tipado estático            |
| Vite           | Build tool rápido          |
| Tailwind CSS   | Estilos utility-first      |
| TanStack Query | Gestión de estado servidor |
| TanStack Table | Tablas avanzadas           |
| Lucide React   | Iconos                     |

---

## 📚 Documentación Disponible

1. **README.md** - Documentación completa en inglés
2. **QUICK_START.md** - Guía rápida de inicio
3. **ARCHITECTURE.md** - Arquitectura técnica detallada
4. **EXAMPLES.md** - Ejemplos de código y patrones
5. **CHECKLIST.md** - Lista de verificación de funcionalidades
6. **PROJECT_SUMMARY.md** - Resumen completo del proyecto

---

## 🔧 Comandos Disponibles

```bash
# Desarrollo
pnpm dev             # Servidor de desarrollo con hot reload
# o: npm run dev

# Producción
pnpm build           # Compilar para producción
# o: npm run build

pnpm preview         # Vista previa del build
# o: npm run preview

# Calidad de Código
pnpm lint            # Ejecutar ESLint
# o: npm run lint

pnpm audit           # Verificar vulnerabilidades
# o: npm audit
```

---

## 📱 Probar Diseño Responsive

### En Escritorio

1. Abre http://localhost:5173
2. Verás el sidebar a la izquierda
3. Tabla completa con todas las columnas

### En Móvil

1. Abre DevTools (F12)
2. Activa toolbar de dispositivo (Ctrl+Shift+M)
3. Selecciona un dispositivo móvil
4. Verás el menú hamburguesa
5. Tabla desplazable horizontalmente

---

## 🎓 Cómo Agregar Nuevas Herramientas

### Pasos Básicos

1. **Crear carpeta de feature**

   ```bash
   mkdir -p src/features/[nombre-herramienta]/{components,hooks,services,types}
   ```

2. **Definir tipos** en `types/`
3. **Crear servicio** en `services/`
4. **Crear hook** en `hooks/`
5. **Crear componentes** en `components/`
6. **Agregar navegación** en `Sidebar.tsx`
7. **Agregar ruta** en `App.tsx`

**Ejemplo completo:** Ver `EXAMPLES.md`

---

## 🌟 Características Destacadas

### Arquitectura

- ✅ Organización basada en features
- ✅ Separación clara de responsabilidades
- ✅ TypeScript en todo el proyecto
- ✅ Código bien documentado

### Performance

- ✅ Caché inteligente de datos
- ✅ Paginación eficiente
- ✅ Bundle optimizado
- ✅ Lazy loading preparado

### UX/UI

- ✅ Diseño limpio y profesional
- ✅ Mobile-first responsive
- ✅ Estados de carga claros
- ✅ Manejo de errores

### Escalabilidad

- ✅ Fácil agregar features
- ✅ Componentes reutilizables
- ✅ Patrones consistentes
- ✅ Preparado para crecer

---

## 🔍 Fuente de Datos

**Monstruos:**

- Repositorio: TheGiddyLimit/homebrew (GitHub)
- Colección: Amellwind's Monster Hunter Monster Manual
- Formato: JSON schema de 5etools
- Actualización: Fetch bajo demanda (caché 24h)

---

## 🚀 Próximos Pasos Sugeridos

### Corto Plazo

1. ✅ Probar la aplicación en el navegador
2. ✅ Verificar que los monstruos se carguen
3. ✅ Probar en móvil y escritorio
4. ✅ Implementar modo oscuro (Completado)
5. Agregar vista de detalle de monstruo
6. Agregar funcionalidad de impresión

### Mediano Plazo

1. Construir feature de Objetos
2. Construir feature de Crafteo
3. Agregar funcionalidad de favoritos
4. Implementar React Router para URLs

### Largo Plazo

1. Sistema de cuentas de usuario
2. Características comunitarias
3. Soporte PWA (modo offline)
4. Más fuentes de datos

---

## 🎉 Estado del Proyecto

### ✅ LISTO PARA PRODUCCIÓN

El proyecto está **completamente funcional** y listo para usar:

- ✅ Compilación exitosa
- ✅ Sin errores de TypeScript
- ✅ Sin errores de linting
- ✅ Bestiario completamente funcional
- ✅ Navegación responsive
- ✅ Documentación completa
- ✅ Código limpio y mantenible

---

## 💡 Consejos

1. **Hot Reload:** Los cambios se reflejan automáticamente
2. **Consola:** Revisa la consola del navegador para logs
3. **Network Tab:** Monitorea las llamadas a la API
4. **React DevTools:** Instala para mejor debugging

---

## 🤝 Contribuir

Para agregar nuevas features:

1. Sigue la estructura existente en `features/monsters/`
2. Mantén la separación de responsabilidades
3. Documenta tu código
4. Prueba en móvil y escritorio

---

## 📝 Notas Importantes

- **Performance:** TanStack Query maneja el caché automáticamente
- **Type Safety:** TypeScript completo, sin tipos `any`
- **Extensibilidad:** Fácil agregar features siguiendo patrones existentes
- **Mantenibilidad:** Estructura clara y código documentado

---

## 🎯 Criterios de Éxito Cumplidos

✅ Proyecto React profesional y escalable
✅ TypeScript en todo el proyecto
✅ Biblioteca de componentes UI (shadcn/ui)
✅ Tailwind CSS para estilos
✅ TanStack Query para datos
✅ Mobile-first, completamente responsive
✅ Estructura de carpetas limpia y escalable
✅ Feature de Lista de Monstruos implementada
✅ DataTable con ordenamiento, filtros y paginación
✅ Sistema de navegación (escritorio + móvil)
✅ Preparado para herramientas futuras
✅ Código bien documentado

---

## 🌐 Despliegue

### Opciones Recomendadas

1. **Vercel** (Recomendado)

   - Conecta tu repositorio de GitHub
   - Deploy automático
   - Gratis para proyectos personales

2. **Netlify**

   - Similar a Vercel
   - Fácil configuración
   - Gratis para proyectos personales

3. **GitHub Pages**
   - Hosting gratuito
   - Requiere configuración de base path

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa **CHECKLIST.md** para verificaciones comunes
2. Consulta **QUICK_START.md** para guía básica
3. Lee **ARCHITECTURE.md** para detalles técnicos
4. Revisa **EXAMPLES.md** para patrones de código

---

## 🎊 ¡Felicidades!

Has creado un **Tool Hub profesional** para D&D 5e Monster Hunter. El proyecto está listo para:

- ✅ Usar inmediatamente
- ✅ Agregar nuevas herramientas
- ✅ Desplegar a producción
- ✅ Compartir con la comunidad

**¡Disfruta construyendo más herramientas!** 🐲⚔️

---

**Construido con ❤️ para las comunidades de D&D y Monster Hunter**
