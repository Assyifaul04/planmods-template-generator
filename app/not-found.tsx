import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-6 text-center">
      {/* Container Gambar Logo */}
      <div className="relative mb-8 h-40 w-40 drop-shadow-2xl sm:h-52 sm:w-52">
        <Image
          src="/image/logo.gif"
          alt="404 Logo"
          fill
          className="object-contain"
          unoptimized // Penting agar animasi GIF tidak berhenti
        />
      </div>

      {/* Label 404 */}
      <p className="font-mono text-sm font-semibold uppercase tracking-widest text-primary/80">
        Error 404
      </p>

      {/* Judul Utama */}
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
        Halaman ini belum tersusun.
      </h1>

      {/* Deskripsi */}
      <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
        Kami tidak menemukan halaman yang Anda cari. Mungkin tautan sudah rusak,
        halaman telah dihapus, atau memang belum pernah ada.
      </p>

      {/* Tombol Aksi */}
      <Button 
        className="mt-8 h-12 rounded-full px-8 text-base shadow-lg transition-transform hover:scale-105" 
        asChild
      >
        <Link href="/">Kembali ke Beranda</Link>
      </Button>
    </div>
  );
}