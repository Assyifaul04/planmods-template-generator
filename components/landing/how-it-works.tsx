const steps = [
  {
    id: "01",
    title: "Jawab beberapa pertanyaan",
    body: "Ceritakan jenis dokumen, ruang lingkup, dan audiens Anda. PlanMod menyesuaikan bagian yang relevan.",
  },
  {
    id: "02",
    title: "PlanMod merakit strukturnya",
    body: "Setiap bagian — ringkasan, jadwal, anggaran — disusun otomatis dengan format dan urutan yang konsisten.",
  },
  {
    id: "03",
    title: "Tinjau, sesuaikan, ekspor",
    body: "Edit langsung di editor, lalu ekspor ke PDF, Docx, atau Markdown untuk dibagikan ke tim.",
  },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="max-w-lg">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Cara kerja
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Tiga langkah dari ide ke dokumen jadi.
        </h2>
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            <span className="font-mono text-sm text-muted-foreground">
              {step.id}
            </span>
            <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
            {index < steps.length - 1 && (
              <div className="mt-8 hidden h-px w-full bg-border md:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
