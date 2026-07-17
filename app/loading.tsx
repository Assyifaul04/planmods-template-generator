export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/40" />
          <span className="relative inline-flex size-1.5 rounded-full bg-foreground/70" />
        </span>
        MEMUAT
      </div>
    </div>
  );
}
