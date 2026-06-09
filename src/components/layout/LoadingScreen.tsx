import { Shield } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = "Loading data...",
}: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Shield className="h-12 w-12 text-primary animate-pulse" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
