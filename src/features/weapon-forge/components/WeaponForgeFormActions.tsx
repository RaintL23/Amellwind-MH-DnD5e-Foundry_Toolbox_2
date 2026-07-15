import { Button } from "@/components/ui/button";

interface WeaponForgeFormActionsProps {
  isEdit: boolean;
  onCancel: () => void;
}

export function WeaponForgeFormActions({
  isEdit,
  onCancel,
}: WeaponForgeFormActionsProps) {
  return (
    <div className="sticky bottom-0 flex justify-end gap-2 py-4 border-t border-border bg-background/95 backdrop-blur-sm">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">
        {isEdit ? "Save changes" : "Create weapon"}
      </Button>
    </div>
  );
}
