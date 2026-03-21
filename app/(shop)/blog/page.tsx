import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Calendar,
  BookOpen,
  Sparkles,
  Clock,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { getEffectiveBlogPosts } from "@/lib/server/blog-posts";
import { getBlogIntentLandingDefinitions } from "@/lib/seo-content";
import { cn } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog és Tanácsok | BabyOnline.hu",
  description:
    "Hasznos baba-mama tippek, vásárlási útmutatók és szakértői tanácsok a BabyOnline.hu blogján.",
  alternates: {
    canonical: "/blog",
  },
};

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
  "from-primary-light via-brand-pink to-secondary",
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

export default async function BlogPage() {
  const allPosts = await getEffectiveBlogPosts();
  const publishedPosts = allPosts.filter((p) => p.isPublished);
  const featuredPost = publishedPosts[0];
  const restPosts = publishedPosts.slice(1);
  const intentPages = getBlogIntentLandingDefinitions();
  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "BabyOnline.hu Blog",
    url: absoluteUrl("/blog"),
    blogPost: publishedPosts.slice(0, 12).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt ?? post.createdAt,
      dateModified: post.updatedAt,
      author: {
        "@type": "Person",
        name: post.author,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogStructuredData) }}
        />
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Blog" },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-dark tracking-tight">
                Blog & Tanácsok
              </h1>
              <p className="text-sm text-neutral-medium">
                Hasznos tippek és tanácsok szülőknek
              </p>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {intentPages.map((intent) => (
              <Link
                key={intent.slug}
                href={`/blog/temak/${intent.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-4 hover:border-primary/30 transition-colors"
              >
                <p className="text-sm font-bold text-neutral-dark tracking-tight mb-1 group-hover:text-primary transition-colors">
                  {intent.title}
                </p>
                <p className="text-xs text-neutral-medium leading-relaxed mb-2 line-clamp-2">
                  {intent.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Témagyűjtő megnyitása
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured post */}
        {featuredPost && (
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="group block mb-8 bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="flex flex-col lg:flex-row">
              <div className="relative lg:w-1/2 h-56 sm:h-64 lg:min-h-[320px] overflow-hidden">
                {featuredPost.coverImage ? (
                  <Image
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br",
                    coverGradients[0]
                  )}>
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/30" />
                      <div className="absolute bottom-10 left-10 size-24 rounded-full bg-white/20" />
                    </div>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold">
                    <Sparkles className="size-3" /> Kiemelt cikk
                  </span>
                </div>
              </div>
              <div className="lg:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                <div className="flex flex-wrap gap-2 mb-3">
                  {featuredPost.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider", getTagColor(tag))}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-neutral-dark tracking-tight mb-3 group-hover:text-primary transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-sm text-neutral-medium leading-relaxed mb-4 line-clamp-3">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-neutral-medium mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {formatDate(featuredPost.publishedAt ?? featuredPost.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Image
                      src="/fav-babyonline.png"
                      alt="BabyOnline profil"
                      width={14}
                      height={14}
                      className="rounded-full"
                    />
                    {featuredPost.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {estimateReadTime(featuredPost.content)} perc olvasás
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-primary font-bold text-sm group-hover:gap-2.5 transition-all">
                  Tovább olvasom
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Posts grid */}
        {restPosts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {restPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {/* Cover */}
                <div className="relative h-44 sm:h-48 overflow-hidden">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  ) : (
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br",
                      coverGradients[(index + 1) % coverGradients.length]
                    )}>
                      <div className="absolute inset-0 opacity-15">
                        <div className="absolute -top-8 -right-8 size-28 rounded-full bg-white/30" />
                      </div>
                    </div>
                  )}
                  {post.aiGenerated && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-white text-[9px] font-bold">
                        <Sparkles className="size-2.5" /> AI
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider", getTagColor(tag))}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-base font-bold text-neutral-dark tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-xs text-neutral-medium leading-relaxed mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-neutral-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(post.publishedAt ?? post.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {estimateReadTime(post.content)} perc
                      </span>
                    </div>
                    <ArrowRight className="size-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
