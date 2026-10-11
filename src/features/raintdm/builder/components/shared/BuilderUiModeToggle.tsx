import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBuilderUiMode } from "../../context/BuilderUiModeContext";

/** Header switch between the beginner (Simple) and full (Advanced) builder. */
export function BuilderUiModeToggle() {
  const { isSimple, setMode } = useBuilderUiMode();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2">
      <Switch
        id="builder-simple-mode"
        checked={isSimple}
        onCheckedChange={(checked) => setMode(checked ? "simple" : "advanced")}
      />
      <Label
        htmlFor="builder-simple-mode"
        className="flex flex-1 cursor-pointer flex-col gap-0.5"
      >
        <span className="text-xs font-medium text-foreground">Simple mode</span>
        <span className="hidden text-[11px] font-normal text-muted-foreground sm:block">
          {isSimple
            ? "Essential options only — great for a first character"
            : "All options: multiclass, dice, sources, homebrew"}
        </span>
      </Label>
    </div>
  );
}
