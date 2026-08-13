import { User } from "lucide-react";

export function ClassListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
      <User className="h-10 w-10 opacity-20" />
      <p className="text-sm">No classes loaded.</p>
    </div>
  );
}
