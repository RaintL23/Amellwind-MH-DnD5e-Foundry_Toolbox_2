import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonsterList } from "@/features/monsters/components/MonsterList";
import { RuneList } from "@/features/runes/components/RuneList";
import { CookingPage } from "@/features/cooking/components/CookingPage";
import { NotFound } from "@/components/layout/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/monsters" replace />} />
          <Route path="monsters" element={<MonsterList />} />
          <Route path="runes" element={<RuneList />} />
          <Route path="cooking" element={<CookingPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
