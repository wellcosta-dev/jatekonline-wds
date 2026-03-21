import type { MetadataRoute } from "next";
import { getBlogIntentLandingDefinitions } from "@/lib/seo-content";
import { absoluteUrl } from "@/lib/seo";
import { getEffectiveCategories, getEffectiveProducts } from "@/lib/server/products";
import { getEffectiveBlogPosts } from "@/lib/server/blog-posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, blogPosts] = await Promise.all([
    Promise.resolve(getEffectiveCategories()),
    getEffectiveProducts(),
    getEffectiveBlogPosts(),
  ]);

  const staticRoutes = [
    "/",
    "/termekek",
    "/kategoriak",
    "/akciok",
    "/ujdonsagok",
    "/rolunk",
    "/blog",
    "/szallitas",
    "/visszakuldes",
    "/gyik",
    "/kapcsolat",
    "/adatvedelem",
    "/aszf",
    "/sutik",
    "/merettablazat",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/kategoriak/${category.slug}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryGuideEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/kategoriak/${category.slug}/tippek`),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((product) => product.isActive)
    .map((product) => ({
      url: absoluteUrl(`/termekek/${product.slug}`),
      lastModified: new Date(product.updatedAt ?? product.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts
    .filter((post) => post.isPublished)
    .map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt ?? post.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const blogTopicEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/blog/temak"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.55,
    },
    ...getBlogIntentLandingDefinitions().map((intent) => ({
      url: absoluteUrl(`/blog/temak/${intent.slug}`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
  ];

  return [
    ...staticEntries,
    ...categoryEntries,
    ...categoryGuideEntries,
    ...productEntries,
    ...blogTopicEntries,
    ...blogEntries,
  ];
}
