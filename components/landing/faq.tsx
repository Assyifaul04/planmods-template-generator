import { Plus } from "lucide-react";

const faqs = [
  {
    question: "Format apa saja yang bisa diekspor?",
    answer:
      "PlanMod mendukung ekspor ke PDF, Microsoft Word (.docx), dan Markdown. Semua bagian dan pemformatan tetap terjaga di setiap format.",
  },
  {
    question: "Apakah saya bisa mengubah struktur template?",
    answer:
      "Bisa. Anda dapat menambah, menghapus, mengganti nama, atau menyusun ulang bagian mana pun sebelum atau setelah dokumen dibuat.",
  },
  {
    question: "Apakah data dokumen saya aman?",
    answer:
      "Setiap dokumen disimpan terenkripsi dan hanya dapat diakses oleh anggota tim yang Anda undang. Paket Perusahaan mendukung SSO dan kontrol akses tambahan.",
  },
  {
    question: "Bisakah saya membatalkan langganan kapan saja?",
    answer:
      "Ya, langganan paket Tim dapat dibatalkan kapan saja tanpa biaya tambahan. Dokumen Anda tetap dapat diekspor setelah pembatalan.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Pertanyaan umum
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Masih ada yang ingin ditanyakan?
        </h2>
      </div>

      <div className="mt-12 flex flex-col divide-y divide-border border-t border-b border-border">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium marker:content-none">
              {faq.question}
              <Plus className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
