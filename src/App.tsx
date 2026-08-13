/**
 * App shell: Amellwind IndexedDB sync on boot, in-memory cache invalidation
 * when MM/GTMH refresh, and lazy React Router routes grouped by Sidebar
 * section (Amellwind / RaintDM / D&D 5e).
 */
import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { BuilderRouteProviders } from "@/components/layout/BuilderRouteProviders";
import { RuneBuildRouteLayout } from "@/components/layout/RuneBuildRouteLayout";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { NotFound } from "@/components/layout/NotFound";
import { SyncProvider } from "@/shared/context/SyncContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { loadChooseableLanguages } from "@/shared/data/chooseable-languages";
import { loadChooseableMusicalInstruments } from "@/shared/data/chooseable-musical-instruments";
import { syncData } from "@/shared/db/sync.service";

// ─── Lazy page imports ───────────────────────────────────────────────────────

const MonsterList = lazy(() =>
  import("@/features/amellwind/monsters/components/MonsterList").then((m) => ({
    default: m.MonsterList,
  })),
);
const MonsterDetailPage = lazy(() =>
  import("@/features/amellwind/monsters/components/MonsterDetailPage").then((m) => ({
    default: m.MonsterDetailPage,
  })),
);
const MonstersOutlet = lazy(() =>
  import("@/features/amellwind/monsters/components/MonstersOutlet").then((m) => ({
    default: m.MonstersOutlet,
  })),
);
const RuneList = lazy(() =>
  import("@/features/amellwind/runes/components/list/RuneList").then((m) => ({
    default: m.RuneList,
  })),
);
const MaterialEffectList = lazy(() =>
  import("@/features/amellwind/material-effects/components/MaterialEffectList").then(
    (m) => ({ default: m.MaterialEffectList }),
  ),
);
const ConditionsDiseasesPage = lazy(() =>
  import("@/features/amellwind/conditions/components/ConditionsDiseasesPage").then((m) => ({
    default: m.ConditionsDiseasesPage,
  })),
);
const CookingPage = lazy(() =>
  import("@/features/amellwind/cooking/components/CookingPage").then((m) => ({
    default: m.CookingPage,
  })),
);
const ComboPage = lazy(() =>
  import("@/features/amellwind/combo/components/ComboPage").then((m) => ({
    default: m.ComboPage,
  })),
);
const ItemList = lazy(() =>
  import("@/features/amellwind/shops/components/ItemList").then((m) => ({
    default: m.ItemList,
  })),
);
const ShopList = lazy(() =>
  import("@/features/amellwind/shops/components/ShopList").then((m) => ({
    default: m.ShopList,
  })),
);
const WeaponList = lazy(() =>
  import("@/features/amellwind/weapons/components/WeaponList").then((m) => ({
    default: m.WeaponList,
  })),
);
const WeaponForgeList = lazy(() =>
  import("@/features/raintdm/weapon-forge/components/WeaponForgeList").then((m) => ({
    default: m.WeaponForgeList,
  })),
);
const WeaponForgeForm = lazy(() =>
  import("@/features/raintdm/weapon-forge/components/WeaponForgeForm").then((m) => ({
    default: m.WeaponForgeForm,
  })),
);
const ItemForgeList = lazy(() =>
  import("@/features/raintdm/item-forge/components/ItemForgeList").then((m) => ({
    default: m.ItemForgeList,
  })),
);
const ResourcePage = lazy(() =>
  import("@/features/amellwind/resources/components/ResourcePage").then((m) => ({
    default: m.ResourcePage,
  })),
);
const EnvironmentList = lazy(() =>
  import("@/features/amellwind/environments/components/EnvironmentList").then((m) => ({
    default: m.EnvironmentList,
  })),
);
const HuntPage = lazy(() =>
  import("@/features/amellwind/hunt/components/HuntPage").then((m) => ({
    default: m.HuntPage,
  })),
);
const BuilderPage = lazy(() =>
  import("@/features/raintdm/builder/components/page/BuilderPage").then((m) => ({
    default: m.BuilderPage,
  })),
);
const SpeciesList = lazy(() =>
  import("@/features/amellwind/species/components/SpeciesList").then((m) => ({
    default: m.SpeciesList,
  })),
);
const BackgroundList = lazy(() =>
  import("@/features/amellwind/backgrounds/components/BackgroundList").then((m) => ({
    default: m.BackgroundList,
  })),
);
const FeatList = lazy(() =>
  import("@/features/amellwind/feats/components/FeatList").then((m) => ({
    default: m.FeatList,
  })),
);
const CharacterGuidePage = lazy(() =>
  import("@/features/amellwind/character-guide/components/CharacterGuidePage").then(
    (m) => ({ default: m.CharacterGuidePage }),
  ),
);
const DowntimePage = lazy(() =>
  import("@/features/amellwind/downtime/components/DowntimePage").then((m) => ({
    default: m.DowntimePage,
  })),
);
const MonstieSidekickPage = lazy(() =>
  import("@/features/amellwind/monstie-sidekick/components/MonstieSidekickPage").then(
    (m) => ({ default: m.MonstieSidekickPage }),
  ),
);
const NpcGeneratorPage = lazy(() =>
  import("@/features/amellwind/npc-generator/components/NpcGeneratorPage").then((m) => ({
    default: m.NpcGeneratorPage,
  })),
);
const SpellList = lazy(() =>
  import("@/features/dnd/spells/components/SpellList").then((m) => ({
    default: m.SpellList,
  })),
);
const ClassList = lazy(() =>
  import("@/features/dnd/classes/components/ClassList").then((m) => ({
    default: m.ClassList,
  })),
);
const ClassDetailPage = lazy(() =>
  import("@/features/dnd/classes/components/ClassDetailPage").then((m) => ({
    default: m.ClassDetailPage,
  })),
);
const DndItemList = lazy(() =>
  import("@/features/dnd/items/components/DndItemList").then((m) => ({
    default: m.DndItemList,
  })),
);
const BestiaryList = lazy(() =>
  import("@/features/dnd/bestiary/components/BestiaryList").then((m) => ({
    default: m.BestiaryList,
  })),
);
const BestiaryDetailPage = lazy(() =>
  import("@/features/dnd/bestiary/components/BestiaryDetailPage").then((m) => ({
    default: m.BestiaryDetailPage,
  })),
);
const XanatharBackstoryPage = lazy(() =>
  import("@/features/dnd/xanathar-backstory/components/XanatharBackstoryPage").then(
    (m) => ({
      default: m.XanatharBackstoryPage,
    }),
  ),
);
const ShopGeneratorPage = lazy(() =>
  import("@/features/dnd/shop-generator/components/ShopGeneratorPage").then(
    (m) => ({
      default: m.ShopGeneratorPage,
    }),
  ),
);
const DamageCalculatorPage = lazy(() =>
  import("@/features/amellwind/damage-calculator/components/DamageCalculatorPage").then(
    (m) => ({
      default: m.DamageCalculatorPage,
    }),
  ),
);
const DndRaceList = lazy(() =>
  import("@/features/dnd/races/components/DndRaceList").then((m) => ({
    default: m.DndRaceList,
  })),
);
const DndBackgroundList = lazy(() =>
  import("@/features/dnd/backgrounds/components/DndBackgroundList").then(
    (m) => ({
      default: m.DndBackgroundList,
    }),
  ),
);
const DndFeatList = lazy(() =>
  import("@/features/dnd/feats/components/DndFeatList").then((m) => ({
    default: m.DndFeatList,
  })),
);
const HomePage = lazy(() =>
  import("@/features/home/components/HomePage").then((m) => ({
    default: m.HomePage,
  })),
);

function PageFallback() {
  return <LoadingScreen />;
}

// ─── Cache invalidation after Amellwind sync ─────────────────────────────────

async function clearMonsterManualDerivedCaches(): Promise<void> {
  // Cache-clearers are imported on demand so their service + mapper modules
  // stay out of the initial `index` chunk (loaded on every page); they only
  // load when a refresh actually replaces the underlying data.
  const [
    { clearMonsterCache },
    { clearRuneCache },
    { clearConditionCache },
    { clearDiseaseCache },
  ] = await Promise.all([
    import("@/features/amellwind/monsters/services/monster.service"),
    import("@/features/amellwind/runes/services/rune.service"),
    import("@/features/amellwind/conditions/services/condition.service"),
    import("@/features/amellwind/diseases/services/disease.service"),
  ]);
  clearMonsterCache();
  clearRuneCache();
  clearConditionCache();
  clearDiseaseCache();
}

async function clearGuideDerivedCaches(): Promise<void> {
  const [
    { clearSpeciesCache },
    { clearBackgroundCache },
    { clearFeatCache },
    { clearMonstieSidekickCache },
    { clearMaterialEffectCache },
    { clearItemCache },
    { clearWeaponCache },
    { clearDowntimeCache },
  ] = await Promise.all([
    import("@/features/amellwind/species/services/species.service"),
    import("@/features/amellwind/backgrounds/services/background.service"),
    import("@/features/amellwind/feats/services/feat.service"),
    import("@/features/amellwind/monstie-sidekick/services/monstie-sidekick.service"),
    import("@/features/amellwind/material-effects/services/material-effect.service"),
    import("@/features/amellwind/shops/services/item.service"),
    import("@/features/amellwind/weapons/services/weapon.service"),
    import("@/features/amellwind/downtime/services/downtime.service"),
  ]);
  clearSpeciesCache();
  clearBackgroundCache();
  clearFeatCache();
  clearMonstieSidekickCache();
  clearMaterialEffectCache();
  clearItemCache();
  clearWeaponCache();
  clearDowntimeCache();
}

/**
 * Invalidate in-memory caches derived from the Amellwind stores when a sync (or
 * a later background refresh) lands new data, so the next navigation renders it.
 */
function handleDataUpdated(updated: { mm: boolean; gtmh: boolean }): void {
  if (updated.mm) void clearMonsterManualDerivedCaches();
  if (updated.gtmh) void clearGuideDerivedCaches();
}

// ─── Bootstrap + providers ───────────────────────────────────────────────────

export default function App() {
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    Promise.all([
      syncData({ onUpdated: handleDataUpdated }),
      loadChooseableLanguages().catch((error) => {
        console.warn("[Bootstrap] Failed to load languages:", error);
      }),
      loadChooseableMusicalInstruments().catch((error) => {
        console.warn("[Bootstrap] Failed to load musical instruments:", error);
      }),
    ])
      .catch((error) => {
        console.warn(
          "[Bootstrap] Sync failed, using cached data if available:",
          error,
        );
      })
      .finally(() => setSyncing(false));
  }, []);

  return (
    <ThemeProvider>
      <SyncProvider syncing={syncing}>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout syncing={syncing} />}>
              {/* ── Home ── */}
              <Route
                index
                element={
                  <Suspense fallback={<PageFallback />}>
                    <HomePage />
                  </Suspense>
                }
              />
              {/* ── Amellwind Homebrew ── */}
              <Route
                path="monsters"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <MonstersOutlet />
                  </Suspense>
                }
              >
                <Route
                  index
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <MonsterList />
                    </Suspense>
                  }
                />
                <Route
                  path=":monsterId"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <MonsterDetailPage />
                    </Suspense>
                  }
                />
              </Route>
              {/* Shared rune planner: /runes + /builder */}
              <Route element={<RuneBuildRouteLayout />}>
                <Route
                  path="runes"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <RuneList />
                    </Suspense>
                  }
                />
                <Route
                  path="builder"
                  element={
                    <BuilderRouteProviders>
                      <Suspense fallback={<PageFallback />}>
                        <BuilderPage />
                      </Suspense>
                    </BuilderRouteProviders>
                  }
                />
              </Route>
              <Route
                path="material-effects"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <MaterialEffectList />
                  </Suspense>
                }
              />
              <Route
                path="conditions"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ConditionsDiseasesPage />
                  </Suspense>
                }
              />
              <Route
                path="diseases"
                element={<Navigate to="/conditions" replace />}
              />
              <Route
                path="cooking"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <CookingPage />
                  </Suspense>
                }
              />
              <Route
                path="combo"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ComboPage />
                  </Suspense>
                }
              />
              <Route
                path="items"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ItemList />
                  </Suspense>
                }
              />
              <Route
                path="shops"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ShopList />
                  </Suspense>
                }
              />
              <Route
                path="weapons"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <WeaponList />
                  </Suspense>
                }
              />
              {/* ── RaintDM forges ── */}
              <Route
                path="weapon-forge"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <WeaponForgeList />
                  </Suspense>
                }
              />
              <Route
                path="weapon-forge/new"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <WeaponForgeForm />
                  </Suspense>
                }
              />
              <Route
                path="weapon-forge/edit/:weaponId"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <WeaponForgeForm />
                  </Suspense>
                }
              />
              <Route
                path="item-forge"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ItemForgeList />
                  </Suspense>
                }
              />
              <Route
                path="resources"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ResourcePage />
                  </Suspense>
                }
              />
              <Route
                path="environments"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <EnvironmentList />
                  </Suspense>
                }
              />
              <Route
                path="hunt"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <HuntPage />
                  </Suspense>
                }
              />
              <Route
                path="species"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <SpeciesList />
                  </Suspense>
                }
              />
              <Route
                path="backgrounds"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <BackgroundList />
                  </Suspense>
                }
              />
              <Route
                path="feats"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <FeatList />
                  </Suspense>
                }
              />
              <Route
                path="character-guide"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <CharacterGuidePage />
                  </Suspense>
                }
              />
              <Route
                path="monstie-sidekick"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <MonstieSidekickPage />
                  </Suspense>
                }
              />
              <Route
                path="npc-generator"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <NpcGeneratorPage />
                  </Suspense>
                }
              />
              <Route
                path="downtime"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <DowntimePage />
                  </Suspense>
                }
              />
              {/* ── D&D 5e Compendium ── */}
              <Route
                path="spells"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <SpellList />
                  </Suspense>
                }
              />
              <Route
                path="dnd-items"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <DndItemList />
                  </Suspense>
                }
              />
              <Route
                path="bestiary"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <BestiaryList />
                  </Suspense>
                }
              />
              <Route
                path="bestiary/:creatureId"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <BestiaryDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="classes"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ClassList />
                  </Suspense>
                }
              />
              <Route
                path="classes/:classId"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ClassDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="dnd-races"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <DndRaceList />
                  </Suspense>
                }
              />
              <Route
                path="dnd-backgrounds"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <DndBackgroundList />
                  </Suspense>
                }
              />
              <Route
                path="dnd-feats"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <DndFeatList />
                  </Suspense>
                }
              />
              <Route
                path="damage-calculator"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <DamageCalculatorPage />
                  </Suspense>
                }
              />
              <Route
                path="xanathar-backstory"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <XanatharBackstoryPage />
                  </Suspense>
                }
              />
              <Route
                path="shop-generator"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ShopGeneratorPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
            </Routes>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </SyncProvider>
    </ThemeProvider>
  );
}
