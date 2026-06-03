import { Outlet } from "react-router-dom";

export function MonstersOutlet() {
  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Outlet />
    </div>
  );
}
