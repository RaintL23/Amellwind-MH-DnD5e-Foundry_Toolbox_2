import { ArrowLeft, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeaponForgeFormHeaderProps {
  isEdit: boolean;
  onBack: () => void;
}

export function WeaponForgeFormHeader({
  isEdit,
  onBack,
}: WeaponForgeFormHeaderProps) {
  return (
    <div className="shrink-0 border-b border-border px-6 py-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Hammer className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">
            {isEdit ? "Edit weapon" : "Create weapon"}
          </h1>
        </div>
      </div>
    </div>
  );
}
