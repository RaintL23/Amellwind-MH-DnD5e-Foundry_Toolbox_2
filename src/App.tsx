import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { NotFound } from "@/components/layout/NotFound";
import { SyncProvider } from "@/shared/context/SyncContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { loadChooseableLanguages } from "@/shared/data/chooseable-languages";
import { loadChooseableMusicalInstruments } from "@/shared/data/chooseable-musical-instruments";
import { syncData } from "@/shared/db/sync.service";
import { clearMonsterCache } from "@/features/monsters/services/monster.service";
import { clearRuneCache } from "@/features/runes/services/rune.service";
import { clearSpeciesCache } from "@/features/species/services/species.service";
import { clearBackgroundCache } from "@/features/backgrounds/services/background.service";
import { clearFeatCache } from "@/features/feats/services/feat.service";
import { clearMonstieSidekickCache } from "@/features/monstie-sidekick/services/monstie-sidekick.service";
import { clearMaterialEffectCache } from "@/features/material-effects/services/material-effect.service";
import { clearConditionCache } from "@/features/conditions/services/condition.service";
import { clearDiseaseCache } from "@/features/diseases/services/disease.service";

const MonsterList = lazy(() =>
  import("@/features/monsters/components/MonsterList").then((m) => ({
    default: m.MonsterList,
  })),
);
const MonsterDetailPage = lazy(() =>
  import("@/features/monsters/components/MonsterDetailPage").then((m) => ({
    default: m.MonsterDetailPage,
  })),
);
const MonstersOutlet = lazy(() =>
  import("@/features/monsters/components/MonstersOutlet").then((m) => ({
    default: m.MonstersOutlet,
  })),
);
const RuneList = lazy(() =>
  import("@/features/runes/components/list/RuneList").then((m) => ({
    default: m.RuneList,
  })),
);
const MaterialEffectList = lazy(() =>
  import("@/features/material-effects/components/MaterialEffectList").then(
    (m) => ({ default: m.MaterialEffectList }),
  ),
);
const ConditionsDiseasesPage = lazy(() =>
  import("@/features/conditions/components/ConditionsDiseasesPage").then((m) => ({
    default: m.ConditionsDiseasesPage,
  })),
);
const CookingPage = lazy(() =>
  import("@/features/cooking/components/CookingPage").then((m) => ({
    default: m.CookingPage,
  })),
);
const ComboPage = lazy(() =>
  import("@/features/combo/components/ComboPage").then((m) => ({
    default: m.ComboPage,
  })),
);
const ItemList = lazy(() =>
  import("@/features/shops/components/ItemList").then((m) => ({
    default: m.ItemList,
  })),
);
const ShopList = lazy(() =>
  import("@/features/shops/components/ShopList").then((m) => ({
    default: m.ShopList,
  })),
);
const WeaponList = lazy(() =>
  import("@/features/weapons/components/WeaponList").then((m) => ({
    default: m.WeaponList,
  })),
);
const ResourcePage = lazy(() =>
  import("@/features/resources/components/ResourcePage").then((m) => ({
    default: m.ResourcePage,
  })),
);
const EnvironmentList = lazy(() =>
  import("@/features/environments/components/EnvironmentList").then((m) => ({
    default: m.EnvironmentList,
  })),
);
const HuntPage = lazy(() =>
  import("@/features/hunt/components/HuntPage").then((m) => ({
    default: m.HuntPage,
  })),
);
const BuilderPage = lazy(() =>
  import("@/features/builder/components/page/BuilderPage").then((m) => ({
    default: m.BuilderPage,
  })),
);
const SpeciesList = lazy(() =>
  import("@/features/species/components/SpeciesList").then((m) => ({
    default: m.SpeciesList,
  })),
);
const BackgroundList = lazy(() =>
  import("@/features/backgrounds/components/BackgroundList").then((m) => ({
    default: m.BackgroundList,
  })),
);
const FeatList = lazy(() =>
  import("@/features/feats/components/FeatList").then((m) => ({
    default: m.FeatList,
  })),
);
const CharacterGuidePage = lazy(() =>
  import("@/features/character-guide/components/CharacterGuidePage").then(
    (m) => ({ default: m.CharacterGuidePage }),
  ),
);
const DowntimePage = lazy(() =>
  import("@/features/downtime/components/DowntimePage").then((m) => ({
    default: m.DowntimePage,
  })),
);
const MonstieSidekickPage = lazy(() =>
  import("@/features/monstie-sidekick/components/MonstieSidekickPage").then(
    (m) => ({ default: m.MonstieSidekickPage }),
  ),
);
const NpcGeneratorPage = lazy(() =>
  import("@/features/npc-generator/components/NpcGeneratorPage").then((m) => ({
    default: m.NpcGeneratorPage,
  })),
);
const SpellList = lazy(() =>
  import("@/features/spells/components/SpellList").then((m) => ({
    default: m.SpellList,
  })),
);
const ClassList = lazy(() =>
  import("@/features/classes/components/ClassList").then((m) => ({
    default: m.ClassList,
  })),
);
const ClassDetailPage = lazy(() =>
  import("@/features/classes/components/ClassDetailPage").then((m) => ({
    default: m.ClassDetailPage,
  })),
);
const DndItemList = lazy(() =>
  import("@/features/dnd-items/components/DndItemList").then((m) => ({
    default: m.DndItemList,
  })),
);
const BestiaryList = lazy(() =>
  import("@/features/bestiary/components/BestiaryList").then((m) => ({
    default: m.BestiaryList,
  })),
);
const BestiaryDetailPage = lazy(() =>
  import("@/features/bestiary/components/BestiaryDetailPage").then((m) => ({
    default: m.BestiaryDetailPage,
  })),
);
const XanatharBackstoryPage = lazy(() =>
  import("@/features/xanathar-backstory/components/XanatharBackstoryPage").then(
    (m) => ({
      default: m.XanatharBackstoryPage,
    }),
  ),
);
const DamageCalculatorPage = lazy(() =>
  import("@/features/damage-calculator/components/DamageCalculatorPage").then(
    (m) => ({
      default: m.DamageCalculatorPage,
    }),
  ),
);
const DndRaceList = lazy(() =>
  import("@/features/dnd-races/components/DndRaceList").then((m) => ({
    default: m.DndRaceList,
  })),
);
const DndBackgroundList = lazy(() =>
  import("@/features/dnd-backgrounds/components/DndBackgroundList").then(
    (m) => ({
      default: m.DndBackgroundList,
    }),
  ),
);
const DndFeatList = lazy(() =>
  import("@/features/dnd-feats/components/DndFeatList").then((m) => ({
    default: m.DndFeatList,
  })),
);
const HomePage = lazy(() =>
  import("@/features/home/components/HomePage").then((m) => ({
    default: m.HomePage,
  })),
);

function PageFallback() {
  return <LoadingScreen message="Loading..." />;
}

export default function App() {
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    Promise.all([
      syncData(),
      loadChooseableLanguages().catch((error) => {
        console.warn("[Bootstrap] Failed to load languages:", error);
      }),
      loadChooseableMusicalInstruments().catch((error) => {
        console.warn("[Bootstrap] Failed to load musical instruments:", error);
      }),
    ])
      .then(([result]) => {
        if (result.updated.mm) {
          clearMonsterCache();
          clearRuneCache();
          clearConditionCache();
          clearDiseaseCache();
        }
        if (result.updated.gtmh) {
          clearSpeciesCache();
          clearBackgroundCache();
          clearFeatCache();
          clearMonstieSidekickCache();
          clearMaterialEffectCache();
        }
      })
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
              <Route
                index
                element={
                  <Suspense fallback={<PageFallback />}>
                    <HomePage />
                  </Suspense>
                }
              />
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
              <Route
                path="runes"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <RuneList />
                  </Suspense>
                }
              />
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
                path="builder"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <BuilderPage />
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
