import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { getBlogIntentLandingDefinitions } from "@/lib/seo-content";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog témák és útmutatók | BabyOnline.hu",
  description:
    "Intent alapú blog témák: vásárlási útmutatók, kismama tippek és babaápolási cikkek egy helyen.",
  alternates: {
    canonical: "/blog/temak",
  },
};

export default function BlogTopicsPage() {
  const intents = getBlogIntentLandingDefinitions();
  const collectionStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog témák és útmutatók",
    url: absoluteUrl("/blog/temak"),
  };

  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionStructuredData) }}
        />
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: "Témák" },
          ]}
          className="mb-6"
        />

        <header className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-6">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-3">
            <Layers3 className="size-3.5" />
            Programmatic blog-funnel
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-dark mb-2">
            Blog témák és cikkgyűjtemények
          </h1>
          <p className="text-sm md:text-base text-neutral-medium leading-relaxed">
            Válassz célzott témát, és nézd meg az oda illő, rendezett cikkeket egy oldalon.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {intents.map((intent) => (
            <Link
              key={intent.slug}
              href={`/blog/temak/${intent.slug}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <h2 className="text-base font-extrabold tracking-tight text-neutral-dark mb-2 group-hover:text-primary transition-colors">
                {intent.title}
              </h2>
              <p className="text-sm text-neutral-medium leading-relaxed mb-3">
                {intent.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Téma megnyitása
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
