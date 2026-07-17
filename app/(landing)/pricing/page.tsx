import type { Metadata } from "next";

import { PricingTable } from "@/components/landing/pricing-table";
import { Faq } from "@/components/landing/faq";
import { CtaBand } from "@/components/landing/cta-band";

export const metadata: Metadata = {
  title: "Harga — PlanMod",
  description: "Paket harga PlanMod untuk individu, tim, dan perusahaan.",
};

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-16 text-center md:pt-24">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Harga
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
          Investasi kecil, jam kerja yang kembali ke tim Anda.
        </h1>
      </section>

      <PricingTable />
      <Faq />
      <CtaBand />
    </>
  );
}
