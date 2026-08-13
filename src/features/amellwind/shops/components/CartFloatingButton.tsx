import { ShoppingCart } from "lucide-react";

export function CartFloatingButton({
  totalItems,
  onOpen,
}: {
  totalItems: number;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="text-sm font-semibold">{totalItems}</span>
      )}
    </button>
  );
}
