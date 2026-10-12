import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/shared/context/ThemeContext";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme();
  const sonnerTheme: ToasterProps["theme"] = theme === "light" ? "light" : "dark";

  return (
    <SonnerToaster
      theme={sonnerTheme}
      className="toaster group"
      // Clear bottom tab bars (e.g. the mobile Builder) on small screens.
      mobileOffset={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
