import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Gratis",
    price: "Rp0",
    period: "/selamanya",
    description: "Untuk mencoba PlanMod pada proyek pribadi.",
    features: [
      "3 dokumen aktif",
      "5 template dasar",
      "Ekspor PDF",
    ],
    cta: "Mulai Gratis",
    highlighted: false,
  },
  {
    name: "Tim",
    price: "Rp149rb",
    period: "/pengguna/bulan",
    description: "Untuk tim yang menyusun dokumen kerja setiap minggu.",
    features: [
      "Dokumen tanpa batas",
      "38 template lintas industri",
      "Ekspor PDF, Docx, Markdown",
      "Kolaborasi & riwayat versi",
    ],
    cta: "Coba 14 Hari",
    highlighted: true,
  },
  {
    name: "Perusahaan",
    price: "Khusus",
    period: "",
    description: "Untuk organisasi dengan kebutuhan keamanan & integrasi.",
    features: [
      "Semua fitur Tim",
      "SSO & kontrol akses",
      "Template khusus organisasi",
      "Dukungan prioritas",
    ],
    cta: "Hubungi Kami",
    highlighted: false,
  },
];

export function PricingTable() {
  return (
    <section id="harga" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-lg text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Harga
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Sederhana, sesuai ukuran tim Anda.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                "justify-between border-border/70",
                tier.highlighted && "border-foreground shadow-md md:-translate-y-2"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tier.name}</CardTitle>
                  {tier.highlighted && (
                    <Badge className="font-mono text-[10px]">POPULER</Badge>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {tier.period}
                  </span>
                </div>
                <CardDescription className="mt-2 leading-relaxed">
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="flex flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href="/pricing">{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
