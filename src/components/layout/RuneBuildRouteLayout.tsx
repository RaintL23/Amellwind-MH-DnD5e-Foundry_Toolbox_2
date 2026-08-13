import { Outlet } from "react-router-dom";
import { RuneBuildProvider } from "@/features/amellwind/runes/context/RuneBuildContext";

/** Shared rune build state for /runes and /builder. */
export function RuneBuildRouteLayout() {
  return (
    <RuneBuildProvider>
      <Outlet />
    </RuneBuildProvider>
  );
}
