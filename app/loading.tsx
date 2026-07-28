import { RefreshCw } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <RefreshCw className="h-8 w-8 animate-spin" />

      <div className="flex items-center justify-center">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/40" />
          <span className="relative inline-flex size-1.5 rounded-full bg-foreground/70" />
        </span>
      </div>
    </div>
  );
}