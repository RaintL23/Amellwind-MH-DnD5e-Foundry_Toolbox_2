import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WeaponForgeFeatureDef } from "../types/weapon-forge.types";
import { createFeatureDef } from "../types/weapon-forge.types";
import { findFeatureDefById } from "../utils/weapon-forge-features.utils";

interface FeatureEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: WeaponForgeFeatureDef | null;
  title?: string;
  /** Features that can be selected as the upgrade source. */
  upgradeCandidates?: WeaponForgeFeatureDef[];
  onSave: (feature: WeaponForgeFeatureDef) => void;
}

export function FeatureEditDialog({
  open,
  onOpenChange,
  initial,
  title,
  upgradeCandidates = [],
  onSave,
}: FeatureEditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [upgradesFromId, setUpgradesFromId] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setUpgradesFromId(initial?.upgradesFromId ?? "");
  }, [open, initial]);

  const candidates = upgradeCandidates.filter((f) => f.id !== initial?.id);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(
      createFeatureDef({
        id: initial?.id,
        name: trimmed,
        description: description.trim(),
        upgradesFromId: upgradesFromId || undefined,
      }),
    );
    onOpenChange(false);
  }

  const selectedSource = upgradesFromId
    ? findFeatureDefById(upgradeCandidates, upgradesFromId)
    : undefined;

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

            {candidates.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="feat-upgrade">Upgrades feature (optional)</Label>
                <Select
                  id="feat-upgrade"
                  value={upgradesFromId}
                  onChange={(e) => setUpgradesFromId(e.target.value)}
                  className="h-9"
                >
                  <option value="">None — standalone feature</option>
                  {candidates.map((feat) => (
                    <option key={feat.id} value={feat.id}>
                      {feat.name}
                    </option>
                  ))}
                </Select>
                {selectedSource && (
                  <p className="text-xs text-muted-foreground">
                    This feature replaces or improves{" "}
                    <span className="font-medium text-foreground">
                      {selectedSource.name}
                    </span>{" "}
                    at this rarity. The display name can differ from the source.
                  </p>
                )}
              </div>
            )}

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
