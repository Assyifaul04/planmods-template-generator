import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Halaman ini belum tersusun.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Kami tidak menemukan halaman yang Anda cari. Mungkin sudah dipindah
        atau belum pernah ada.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
