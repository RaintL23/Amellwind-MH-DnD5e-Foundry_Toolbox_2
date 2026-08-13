import { Outlet } from "react-router-dom";
import { RuneBuildProvider } from "@/features/amellwind/runes/context/RuneBuildContext";

/**
 * Shared rune-planner state for `/runes` and `/builder` only (not the whole
 * app). Wraps an `<Outlet />` so both routes share RuneBuildProvider.
 */
export function RuneBuildRouteLayout() {
  return (
    <RuneBuildProvider>
      <Outlet />
    </RuneBuildProvider>
  );
}
