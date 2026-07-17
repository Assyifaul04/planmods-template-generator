const stats = [
  { value: "4.200+", label: "Dokumen dibuat" },
  { value: "38", label: "Template siap pakai" },
  { value: "6 menit", label: "Rata-rata waktu susun" },
  { value: "97%", label: "Dipakai kembali oleh tim" },
];

export function Stats() {
  return (
    <section className="border-y border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="font-mono text-2xl font-semibold tracking-tight md:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
