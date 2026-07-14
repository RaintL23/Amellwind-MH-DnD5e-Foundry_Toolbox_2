import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WeaponForgeFeatureDef } from "../types/weapon-forge.types";
import { createFeatureDef } from "../types/weapon-forge.types";

interface FeatureEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: WeaponForgeFeatureDef | null;
  title?: string;
  onSave: (feature: WeaponForgeFeatureDef) => void;
}

export function FeatureEditDialog({
  open,
  onOpenChange,
  initial,
  title,
  onSave,
}: FeatureEditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
  }, [open, initial]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(
      createFeatureDef({
        id: initial?.id,
        name: trimmed,
        description: description.trim(),
        upgradesFromId: initial?.upgradesFromId,
      }),
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {title ?? (initial ? "Edit feature" : "Add feature")}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="feat-name">Feature name</Label>
              <Input
                id="feat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Charged Slash"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feat-desc">Description</Label>
              <Textarea
                id="feat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Rules text for this feature. Separate paragraphs with a blank line."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={!name.trim()}>
                Save feature
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
