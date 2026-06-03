import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function BestiaryDetailLoading() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <Link
          to="/bestiary"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bestiary
        </Link>
      </div>
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm">Loading creature...</span>
        </div>
      </div>
    </div>
  );
}
