import { Check, ShoppingCart } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export function AddToCartIconButton({
  inCart,
  disabled,
  title,
  onClick,
}: {
  inCart: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled || inCart}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        disabled
          ? "text-muted-foreground/30 cursor-not-allowed"
          : inCart
            ? "text-green-400 bg-green-900/30 border border-green-700/50 cursor-default"
            : "text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/30",
      )}
      title={title}
    >
      {inCart ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <ShoppingCart className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
