import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getCategorySeoContent } from "@/lib/seo-content";
import { getEffectiveCategories } from "@/lib/server/products";

type CategoryLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CategoryLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = getEffectiveCategories();
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    return {
      title: "Kategória nem található | BabyOnline.hu",
      robots: { index: false, follow: false },
    };
  }

  const seoContent = getCategorySeoContent(category.slug, category.name);
  const canonical = absoluteUrl(`/kategoriak/${category.slug}`);
  const title = `${category.name} termékek | BabyOnline.hu`;
  const description = (category.description || seoContent.intro).slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default function CategoryLayout({ children }: CategoryLayoutProps) {
  return children;
}
