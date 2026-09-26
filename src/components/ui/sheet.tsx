import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { clearStaleBodyPointerLock } from "@/shared/utils/clear-stale-body-pointer-lock";

/** Bottom-sheet style dialog for mobile play UI (Radix Dialog, no new deps). */
export const Sheet = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose = RadixDialog.Close;

export function SheetContent({
  className,
  children,
  side = "bottom",
  onCloseAutoFocus,
  ...props
}: RadixDialog.DialogContentProps & { side?: "bottom" | "right" }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <RadixDialog.Content
        className={cn(
          "fixed z-50 flex flex-col gap-0 overflow-hidden bg-card border border-border shadow-2xl duration-200",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
          side === "right" &&
            "inset-y-0 right-0 h-full w-full max-w-md data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          className,
        )}
        {...props}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e);
          e.preventDefault();
          clearStaleBodyPointerLock();
        }}
      >
        <div className="mx-auto mt-2 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30 md:hidden" />
        {children}
        <RadixDialog.Close className="absolute right-3 top-3 rounded-sm opacity-70 hover:opacity-100 z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex shrink-0 flex-col space-y-1.5 p-4 pb-2", className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: RadixDialog.DialogTitleProps) {
  return (
    <RadixDialog.Title
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function SheetBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8",
        className,
      )}
      {...props}
    />
  );
}
