import { useState } from "react";
import { ImageIcon, Swords, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/shared/utils/cn";
import { WeaponIcon } from "@/features/amellwind/weapons/components/WeaponIcon";
import {
  MH_WEAPON_ICON_OPTIONS,
  normalizeMhIconPath,
} from "@/features/amellwind/weapons/utils/weapon-icon.utils";

interface WeaponIconPickerProps {
  value: string;
  weaponName: string;
  onChange: (path: string) => void;
}

export function WeaponIconPicker({
  value,
  weaponName,
  onChange,
}: WeaponIconPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedPath = normalizeMhIconPath(value);
  const selectedOption = MH_WEAPON_ICON_OPTIONS.find(
    (opt) => opt.path === selectedPath,
  );

  return (
    <div className="space-y-1.5">
      <Label>Icon</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full justify-start gap-3 px-3 py-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
              {selectedPath || weaponName.trim() ? (
                <WeaponIcon
                  weaponName={weaponName || "Weapon"}
                  img={selectedPath}
                  className="h-7 w-7"
                  fallbackClassName="h-5 w-5 text-muted-foreground"
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-medium text-foreground">
                {selectedOption?.label ??
                  (selectedPath ? "Custom icon" : "Auto from name")}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {selectedPath
                  ? selectedPath.replace(/^\/mh-icons\//, "")
                  : "Pick a weapon icon from mh-icons"}
              </span>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[22rem] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-foreground">
              Weapon icons
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
              Auto
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {MH_WEAPON_ICON_OPTIONS.map((opt) => {
              const isSelected = selectedPath === opt.path;
              return (
                <button
                  key={opt.file}
                  type="button"
                  title={opt.label}
                  aria-label={opt.label}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(opt.path);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md border p-1.5 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:border-border hover:bg-muted/50",
                  )}
                >
                  <img
                    src={opt.path}
                    alt=""
                    className="h-8 w-8 object-contain"
                  />
                  <span className="line-clamp-2 w-full text-center text-[9px] leading-tight text-muted-foreground">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Swords className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            Leave on Auto to match by weapon name (e.g. Greatsword →
            weapon_greatsword).
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
