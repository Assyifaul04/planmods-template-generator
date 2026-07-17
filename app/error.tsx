"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Terjadi kesalahan
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Dokumen gagal dimuat.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Sesuatu berjalan tidak semestinya di pihak kami. Coba muat ulang
        halaman ini.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Coba lagi
      </Button>
    </div>
  );
}
