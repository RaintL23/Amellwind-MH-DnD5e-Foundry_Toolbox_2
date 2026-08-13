import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function MonsterDetailNotFound() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <Link
          to="/monsters"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Monsters
        </Link>
        <h1 className="text-xl font-bold text-foreground">Monster not found</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The requested monster could not be loaded.
        </p>
      </div>
    </div>
  );
}
