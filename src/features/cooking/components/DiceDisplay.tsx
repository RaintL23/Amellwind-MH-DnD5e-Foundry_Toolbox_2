import { Dices } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export function DiceDisplay({ rolling }: { rolling: boolean }) {
  return (
    <Dices
      className={cn("h-6 w-6 transition-transform", rolling && "animate-spin")}
    />
  );
}
