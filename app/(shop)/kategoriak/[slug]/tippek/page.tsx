import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { InternalLinksBlock } from "@/components/seo/InternalLinksBlock";
import { getCategoryBySlug, products } from "@/lib/mock-data";
import {
  getCategoryAutomationLinks,
  getCategoryTipsLandingContent,
} from "@/lib/seo-content";
import { absoluteUrl } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";

interface CategoryTipsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryTipsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Útmutató nem található | BabyOnline.hu",
      robots: { index: false, follow: false },
    };
  }

  const seoTitle = `${category.name} vásárlási útmutató 2026 | BabyOnline.hu`;
  const seoDescription = `${category.name} tippek, gyakori kérdések és választási szempontok egy helyen. Találd meg gyorsabban a megfelelő terméket a BabyOnline.hu kínálatában.`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: absoluteUrl(`/kategoriak/${category.slug}/tippek`),
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: "article",
      url: absoluteUrl(`/kategoriak/${category.slug}/tippek`),
    },
  };
}

export default async function CategoryTipsPage({ params }: CategoryTipsPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const tips = getCategoryTipsLandingContent(category.slug, category.name);
  const nextStepLinks = getCategoryAutomationLinks(category.slug);
  const categoryProducts = products.filter(
    (product) => product.categoryId === category.id && product.isActive
  );
  const recommendedProducts = [...categoryProducts]
    .sort((a, b) => {
      const scoreA = (a.isFeatured ? 2 : 0) + (a.rating ?? 0);
      const scoreB = (b.isFeatured ? 2 : 0) + (b.rating ?? 0);
      return scoreB - scoreA;
    })
    .slice(0, 4);

  const canonicalUrl = absoluteUrl(`/kategoriak/${category.slug}/tippek`);
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tips.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Főoldal", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Kategóriák", item: absoluteUrl("/kategoriak") },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: absoluteUrl(`/kategoriak/${category.slug}`),
      },
      { "@type": "ListItem", position: 4, name: "Tippek", item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
        />
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Kategóriák", href: "/kategoriak" },
            { label: category.name, href: `/kategoriak/${category.slug}` },
            { label: "Tippek" },
          ]}
          className="mb-6"
        />

        <header className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Programmatic SEO útmutató
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-dark mb-3">
            {tips.title}
          </h1>
          <p className="text-sm md:text-base text-neutral-medium leading-relaxed max-w-3xl">
            {tips.intro}
          </p>
          <Link
            href={`/kategoriak/${category.slug}`}
            className="inline-flex mt-4 items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-light"
          >
            Kategória megnyitása
            <ArrowRight className="size-4" />
          </Link>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-6">
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark mb-4">
            Választási szempontok
          </h2>
          <div className="space-y-4">
            {tips.sections.map((section) => (
              <article key={section.title} className="rounded-xl bg-neutral-pale px-4 py-3.5">
                <h3 className="text-sm md:text-base font-bold text-neutral-dark mb-1.5">
                  {section.title}
                </h3>
                <p className="text-sm text-neutral-medium leading-relaxed">{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-6">
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark mb-4">
            Gyakori kérdések
          </h2>
          <div className="space-y-3">
            {tips.faqs.map((faq) => (
              <article key={faq.question} className="rounded-xl border border-gray-100 p-4">
                <h3 className="flex items-start gap-2 text-sm font-bold text-neutral-dark mb-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{faq.question}</span>
                </h3>
                <p className="text-sm text-neutral-medium leading-relaxed">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-6">
          <InternalLinksBlock title="Ajánlott következő lépések" links={nextStepLinks} />
        </div>

        {recommendedProducts.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark">
                Ajánlott termékek ebből a kategóriából
              </h2>
              <Link
                href={`/kategoriak/${category.slug}`}
                className="text-sm font-semibold text-primary hover:text-primary-light"
              >
                Összes termék
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {recommendedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/termekek/${product.slug}`}
                  className="group rounded-xl border border-gray-100 p-4 hover:border-primary/30 transition-colors"
                >
                  <p className="text-sm font-bold text-neutral-dark tracking-tight mb-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </p>
                  <p className="text-xs text-neutral-medium mb-2 line-clamp-2">
                    {product.shortDesc ?? product.description}
                  </p>
                  <p className="text-sm font-extrabold text-neutral-dark">
                    {formatPrice(product.salePrice ?? product.price)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
