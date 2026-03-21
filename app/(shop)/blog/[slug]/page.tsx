import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Twitter,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Share2,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { InternalLinksBlock } from "@/components/seo/InternalLinksBlock";
import { getEffectiveBlogPosts } from "@/lib/server/blog-posts";
import { getBlogFunnelLinks } from "@/lib/seo-content";
import { cn } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";

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

const coverGradients = [
  "from-primary via-primary-light to-brand-cyan",
  "from-brand-pink via-secondary to-primary",
  "from-brand-cyan via-primary to-primary-light",
  "from-accent via-orange-400 to-brand-pink",
  "from-emerald-500 via-brand-cyan to-primary",
];

const tagColors: Record<string, string> = {
  pelenka: "bg-primary/10 text-primary",
  alvás: "bg-brand-cyan/10 text-brand-cyan",
  babakocsi: "bg-brand-pink/10 text-brand-pink",
  tippek: "bg-accent/15 text-amber-700",
  biztonság: "bg-emerald-100 text-emerald-700",
  csecsemő: "bg-secondary/10 text-secondary",
};

function getTagColor(tag: string): string {
  const key = Object.keys(tagColors).find((k) => tag.toLowerCase().includes(k));
  return key ? tagColors[key] : "bg-gray-100 text-neutral-dark/70";
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blogPosts = await getEffectiveBlogPosts();
  const post = blogPosts.find((entry) => entry.slug === slug);

  if (!post || !post.isPublished) {
    return {
      title: "Cikk nem található | BabyOnline.hu",
      robots: { index: false, follow: false },
    };
  }

  const title = post.metaTitle ?? `${post.title} | BabyOnline.hu`;
  const description = post.metaDescription ?? post.excerpt ?? post.content.slice(0, 155);
  const canonical = absoluteUrl(`/blog/${post.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      publishedTime: post.publishedAt ?? post.createdAt,
      modifiedTime: post.updatedAt,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const blogPosts = await getEffectiveBlogPosts();
  const post = blogPosts.find((entry) => entry.slug === slug);

  if (!post || !post.isPublished) {
    notFound();
  }

  const postIndex = blogPosts.findIndex((p) => p.id === post.id);
  const relatedPosts = blogPosts
    .filter((p) => p.id !== post.id && p.isPublished)
    .slice(0, 3);
  const funnelLinks = getBlogFunnelLinks({
    title: post.title,
    tags: post.tags,
    content: post.content.slice(0, 600),
  });

  const paragraphs = post.content.split("\n\n").filter(Boolean);
  const readTime = estimateReadTime(post.content);
  const canonicalUrl = absoluteUrl(`/blog/${post.slug}`);
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? post.content.slice(0, 155),
    image: absoluteUrl(post.coverImage || "/babyonline-logo.png"),
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "BabyOnline.hu",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/babyonline-logo.png"),
      },
    },
    mainEntityOfPage: canonicalUrl,
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Főoldal", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
        />
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
          className="mb-6"
        />

        <article>
          {/* Cover */}
          <div className={cn(
            "relative h-48 md:h-64 w-full rounded-2xl overflow-hidden bg-gradient-to-br mb-8",
            coverGradients[postIndex % coverGradients.length]
          )}>
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 opacity-15">
                <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/30" />
                <div className="absolute bottom-8 left-8 size-32 rounded-full bg-white/20" />
              </div>
            )}
            <div className="absolute bottom-4 left-4 flex gap-2">
              {post.aiGenerated && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold">
                  <Sparkles className="size-3" /> AI generált
                </span>
              )}
            </div>
          </div>

          {/* Content area */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 lg:p-10">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider", getTagColor(tag))}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-dark tracking-tight leading-tight mb-4">
                  {post.title}
                </h1>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                  <span className="flex items-center gap-1.5 text-sm text-neutral-medium">
                    <Image
                      src="/fav-babyonline.png"
                      alt="BabyOnline profil"
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-neutral-medium">
                    <Calendar className="size-4" />
                    <time dateTime={post.publishedAt ?? post.createdAt}>
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </time>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-neutral-medium">
                    <Clock className="size-4" />
                    {readTime} perc olvasás
                  </span>
                </div>

                {/* Body */}
                <div className="space-y-4 mb-8">
                  {paragraphs.map((para, i) => (
                    <p
                      key={i}
                      className={cn(
                        "text-neutral-dark leading-relaxed",
                        i === 0 && "text-base font-medium",
                        i > 0 && "text-sm"
                      )}
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Share */}
                <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-neutral-medium">
                    <Share2 className="size-4" />
                    <span className="font-semibold">Megosztás:</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="size-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      aria-label="Megosztás Facebookon"
                    >
                      <Facebook className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="size-9 flex items-center justify-center rounded-xl bg-sky-50 text-sky-500 hover:bg-sky-100 transition-colors"
                      aria-label="Megosztás X-en"
                    >
                      <Twitter className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Back link */}
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-neutral-medium hover:text-primary transition-colors"
              >
                <ArrowLeft className="size-4" />
                Vissza a bloghoz
              </Link>
            </div>

            {/* Sidebar */}
            <div className="lg:w-[320px] flex-shrink-0">
              <div className="lg:sticky lg:top-36 space-y-4">
                {/* About author */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Image
                      src="/fav-babyonline.png"
                      alt="BabyOnline profil"
                      width={40}
                      height={40}
                      className="rounded-xl"
                    />
                    <div>
                      <p className="text-sm font-bold text-neutral-dark tracking-tight">{post.author}</p>
                      <p className="text-xs text-neutral-medium">BabyOnline.hu</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-medium leading-relaxed">
                    Hasznos tippek és tanácsok szülőknek, a BabyOnline szerkesztőségtől.
                  </p>
                </div>

                {/* Related posts */}
                {relatedPosts.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="size-4 text-primary" />
                      <h3 className="text-sm font-bold text-neutral-dark tracking-tight">
                        Kapcsolódó cikkek
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {relatedPosts.map((related, i) => (
                        <Link
                          key={related.id}
                          href={`/blog/${related.slug}`}
                          className="group flex gap-3 items-start"
                        >
                          <div className="relative flex-shrink-0 size-12 rounded-xl overflow-hidden bg-gray-100">
                            {related.coverImage ? (
                              <Image
                                src={related.coverImage}
                                alt={related.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className={cn(
                                "w-full h-full bg-gradient-to-br",
                                coverGradients[(i + 2) % coverGradients.length]
                              )} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-neutral-dark tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
                              {related.title}
                            </h4>
                            <span className="text-[10px] text-neutral-medium mt-0.5 block">
                              {formatDate(related.publishedAt ?? related.createdAt)}
                            </span>
                          </div>
                          <ArrowRight className="size-3.5 text-gray-300 group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="bg-gradient-to-br from-primary to-brand-cyan rounded-2xl p-5 text-center">
                  <p className="text-sm font-bold text-white mb-2">
                    Keresed a legjobb termékeket?
                  </p>
                  <p className="text-xs text-white/80 mb-4">
                    Böngéssz kínálatunkban!
                  </p>
                  <Link
                    href="/termekek"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary font-bold text-xs hover:bg-gray-50 transition-colors"
                  >
                    Termékek
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <InternalLinksBlock
                    title="Ajánlott következő lépés"
                    links={funnelLinks}
                  />
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-bold text-amber-900 tracking-tight mb-1">
                    Heti baba-mama tippek emailben
                  </p>
                  <p className="text-xs text-amber-900/80 leading-relaxed mb-3">
                    Iratkozz fel a legújabb útmutatókért és szezonális ajánlatokért.
                  </p>
                  <Link
                    href="/kapcsolat"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950"
                  >
                    Feliratkozás kérése
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
