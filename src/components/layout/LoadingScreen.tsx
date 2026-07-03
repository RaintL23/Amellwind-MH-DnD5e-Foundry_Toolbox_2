import { Shield } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = "Loading data...",
}: LoadingScreenProps) {
  return (
    <div className="flex h-full min-h-48 flex-1 items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Shield className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
