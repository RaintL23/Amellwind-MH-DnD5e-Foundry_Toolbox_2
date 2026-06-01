import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonsterList } from "@/features/monsters/components/MonsterList";
import { RuneList } from "@/features/runes/components/RuneList";
import { CookingPage } from "@/features/cooking/components/CookingPage";
import { ComboPage } from "@/features/combo/components/ComboPage";
import { ItemList } from "@/features/shops/components/ItemList";
import { ShopList } from "@/features/shops/components/ShopList";
import { WeaponList } from "@/features/weapons/components/WeaponList";
import { ResourcePage } from "@/features/resources/components/ResourcePage";
import { EnvironmentList } from "@/features/environments/components/EnvironmentList";
import { CartProvider } from "@/features/shops/context/CartContext";
import { RuneBuildProvider } from "@/features/runes/context/RuneBuildContext";
import { BuilderInventoryProvider } from "@/features/builder/context/BuilderInventoryContext";
import { BuilderPage } from "@/features/builder/components/BuilderPage";
import { SpeciesList } from "@/features/species/components/SpeciesList";
import { BackgroundList } from "@/features/backgrounds/components/BackgroundList";
import { NotFound } from "@/components/layout/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <RuneBuildProvider>
        <BuilderInventoryProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/monsters" replace />} />
            <Route path="monsters" element={<MonsterList />} />
            <Route path="runes" element={<RuneList />} />
            <Route path="cooking" element={<CookingPage />} />
            <Route path="combo" element={<ComboPage />} />
            <Route path="items" element={<ItemList />} />
            <Route path="shops" element={<ShopList />} />
            <Route path="weapons" element={<WeaponList />} />
            <Route path="resources" element={<ResourcePage />} />
            <Route path="environments" element={<EnvironmentList />} />
            <Route path="builder" element={<BuilderPage />} />
            <Route path="species" element={<SpeciesList />} />
            <Route path="backgrounds" element={<BackgroundList />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </BuilderInventoryProvider>
        </RuneBuildProvider>
      </CartProvider>
    </BrowserRouter>
  );
}
