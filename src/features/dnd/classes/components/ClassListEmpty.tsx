import { User } from "lucide-react";
import { ListEmptyState } from "@/shared/components/DeferredListResults";

export function ClassListEmpty() {
  return <ListEmptyState icon={User} message="No classes loaded." />;
}
