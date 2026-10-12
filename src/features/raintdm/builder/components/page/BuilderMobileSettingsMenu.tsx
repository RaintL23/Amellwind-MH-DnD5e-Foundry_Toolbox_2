import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBuilderUiMode } from "../../context/BuilderUiModeContext";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { BuilderUiModeToggle } from "../shared/BuilderUiModeToggle";
import { HomebrewModeToggle } from "../shared/HomebrewModeToggle";
import { CharacterCreationTipsPanel } from "./CharacterCreationTipsPanel";

/** Homebrew changes catalogs and slots; keep its toggle visible while it is on. */
export function useShowHomebrewToggle(): boolean {
  const { isSimple } = useBuilderUiMode();
  const { useAmellwindHomebrew } = useCharacterBuilder();
  return !isSimple || useAmellwindHomebrew;
}

/** Mobile replacement for the page header controls, folded into one menu. */
export function BuilderMobileSettingsMenu() {
  const showHomebrewToggle = useShowHomebrewToggle();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 shrink-0 p-0"
          aria-label="Builder settings"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-64 flex-col gap-2 p-2">
        <BuilderUiModeToggle />
        {showHomebrewToggle && <HomebrewModeToggle />}
        <CharacterCreationTipsPanel showLabel />
      </PopoverContent>
    </Popover>
  );
}
