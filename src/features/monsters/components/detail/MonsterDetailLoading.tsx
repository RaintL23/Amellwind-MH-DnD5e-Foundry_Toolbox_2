import { ListAreaLoading } from "@/shared/components/ListAreaLoading";

export function MonsterDetailLoading() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <ListAreaLoading variant="detail" />
    </div>
  );
}
