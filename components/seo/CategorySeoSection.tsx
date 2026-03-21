import { CheckCircle2 } from "lucide-react";
import type { CategorySeoContent } from "@/lib/seo-content";
import { InternalLinksBlock } from "@/components/seo/InternalLinksBlock";

interface CategorySeoSectionProps {
  categoryName: string;
  content: CategorySeoContent;
  className?: string;
}

export function CategorySeoSection({
  categoryName,
  content,
  className,
}: CategorySeoSectionProps) {
  return (
    <section className={className}>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-neutral-dark mb-3">
          Miért ezt a {categoryName.toLowerCase()} kategóriát válaszd?
        </h2>
        <p className="text-sm md:text-base text-neutral-medium leading-relaxed mb-4">
          {content.intro}
        </p>

        <div className="grid gap-2 sm:grid-cols-3">
          {content.tips.map((tip) => (
            <div
              key={tip}
              className="flex items-start gap-2 rounded-xl bg-neutral-pale px-3 py-2.5"
            >
              <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-xs md:text-sm text-neutral-dark leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <InternalLinksBlock
        title="Kapcsolódó kategóriák"
        links={content.internalLinks}
        className="mt-5"
      />

      {content.faqs && content.faqs.length > 0 && (
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-neutral-dark mb-3">
            Gyakori kérdések
          </h3>
          <div className="space-y-3">
            {content.faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl bg-neutral-pale px-4 py-3">
                <p className="text-sm font-bold text-neutral-dark">{faq.question}</p>
                <p className="mt-1 text-sm text-neutral-medium leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
