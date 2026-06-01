import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { syncData } from "@/shared/db/sync.service";
import { clearMonsterCache } from "@/features/monsters/services/monster.service";
import { clearRuneCache } from "@/features/runes/services/rune.service";
import { clearSpeciesCache } from "@/features/species/services/species.service";
import { clearBackgroundCache } from "@/features/backgrounds/services/background.service";
import "./index.css";

async function bootstrap() {
  const root = ReactDOM.createRoot(document.getElementById("root")!);

  root.render(
    <React.StrictMode>
      <LoadingScreen message="Sincronizando datos de Amellwind…" />
    </React.StrictMode>
  );

  try {
    await syncData();
    clearMonsterCache();
    clearRuneCache();
    clearSpeciesCache();
    clearBackgroundCache();
  } catch (error) {
    console.warn("[Bootstrap] Sync failed, using cached data if available:", error);
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
