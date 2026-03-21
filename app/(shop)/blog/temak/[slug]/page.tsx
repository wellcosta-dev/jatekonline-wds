import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { InternalLinksBlock } from "@/components/seo/InternalLinksBlock";
import { getEffectiveBlogPosts } from "@/lib/server/blog-posts";
import {
  getBlogIntentAutomationLinks,
  getBlogIntentLandingBySlug,
  getBlogIntentLandingDefinitions,
  getBlogPostsForIntent,
} from "@/lib/seo-content";
import { absoluteUrl } from "@/lib/seo";

interface BlogTopicPageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function generateMetadata({
  params,
}: BlogTopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const intent = getBlogIntentLandingBySlug(slug);

  if (!intent) {
    return {
      title: "Blog téma nem található | BabyOnline.hu",
      robots: { index: false, follow: false },
    };
  }

  const canonical = absoluteUrl(`/blog/temak/${intent.slug}`);
  return {
    title: `${intent.title} | BabyOnline.hu`,
    description: intent.description,
    alternates: { canonical },
    openGraph: {
      title: `${intent.title} | BabyOnline.hu`,
      description: intent.description,
      url: canonical,
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return getBlogIntentLandingDefinitions().map((intent) => ({ slug: intent.slug }));
}

export default async function BlogTopicPage({ params }: BlogTopicPageProps) {
  const { slug } = await params;
  const intent = getBlogIntentLandingBySlug(slug);
  if (!intent) notFound();

  const blogPosts = await getEffectiveBlogPosts();
  const published = blogPosts.filter((post) => post.isPublished);
  const matchedPosts = getBlogPostsForIntent(published, slug);
  const fallbackPosts = [...published].slice(0, 3);
  const postsToRender = matchedPosts.length > 0 ? matchedPosts : fallbackPosts;
  const nextStepLinks = getBlogIntentAutomationLinks(slug);

  const canonicalUrl = absoluteUrl(`/blog/temak/${intent.slug}`);
  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: intent.title,
    url: canonicalUrl,
    hasPart: postsToRender.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt ?? post.createdAt,
    })),
  };
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: intent.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: "Témák", href: "/blog/temak" },
            { label: intent.title },
          ]}
          className="mb-6"
        />

        <header className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-6">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-3">
            <BookOpen className="size-3.5" />
            Témagyűjtő oldal
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-dark mb-2">
            {intent.title}
          </h1>
          <p className="text-sm md:text-base text-neutral-medium leading-relaxed max-w-3xl">
            {intent.intro}
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-6">
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark mb-4">
            Gyakori kérdések a témában
          </h2>
          <div className="space-y-3">
            {intent.faqs.map((faq) => (
              <article key={faq.question} className="rounded-xl border border-gray-100 p-4">
                <h3 className="text-sm font-bold text-neutral-dark mb-1.5">{faq.question}</h3>
                <p className="text-sm text-neutral-medium leading-relaxed">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-6">
          <InternalLinksBlock title="Ajánlott következő lépések" links={nextStepLinks} />
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark">
              Kapcsolódó cikkek
            </h2>
            <Link
              href="/blog"
              className="text-sm font-semibold text-primary hover:text-primary-light"
            >
              Összes blogcikk
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {postsToRender.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-xl border border-gray-100 p-4 hover:border-primary/30 transition-colors"
              >
                <h3 className="text-sm font-bold text-neutral-dark tracking-tight mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-neutral-medium leading-relaxed mb-3 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-neutral-medium">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formatDate(post.publishedAt ?? post.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {estimateReadTime(post.content)} perc
                  </span>
                </div>
                <span className="inline-flex mt-2 items-center gap-1 text-xs font-semibold text-primary">
                  Cikk megnyitása
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
