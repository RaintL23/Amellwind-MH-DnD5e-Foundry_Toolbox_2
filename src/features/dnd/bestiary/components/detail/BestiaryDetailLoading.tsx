import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";

export function BestiaryDetailLoading() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bestiary
        </button>
      </div>
      <ListAreaLoading variant="detail" />
    </div>
  );
}
