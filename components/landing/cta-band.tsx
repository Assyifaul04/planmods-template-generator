import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-center md:py-20">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Dokumen rencana kerja berikutnya, siap dalam 6 menit.
          </h2>
          <p className="mt-3 max-w-md text-sm text-primary-foreground/70 md:text-base">
            Tidak perlu kartu kredit. Coba template pertama Anda hari ini.
          </p>
        </div>
        <Button size="lg" variant="secondary" className="gap-2 shrink-0" asChild>
          <Link href="/pricing">
            Mulai Membuat
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
