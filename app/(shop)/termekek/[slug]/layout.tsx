import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getEffectiveCategories, getEffectiveProductBySlug } from "@/lib/server/products";
import { getSeoProductLead } from "@/lib/seo-product-copy";

type ProductLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getEffectiveProductBySlug(slug);

  if (!product) {
    return {
      title: "Termék nem található | BabyOnline.hu",
      description: "A keresett termék jelenleg nem érhető el.",
      robots: { index: false, follow: false },
    };
  }

  const categories = getEffectiveCategories();
  const category = categories.find((item) => item.id === product.categoryId);
  const canonical = absoluteUrl(`/termekek/${product.slug}`);
  const inStock = product.stock > 0;
  const title = `${product.name} | ${category?.name ?? "Termék"} | BabyOnline.hu`;
  const baseDescription =
    (product.shortDesc || product.description || getSeoProductLead(product, category?.name))
      .replace(/<[^>]*>/g, " ")
      .trim();
  const description = baseDescription.slice(0, 155);
  const image = absoluteUrl(product.images?.[0] || "/images/placeholder.jpg");

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: [{ url: image, alt: product.name }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    other: {
      "product:price:amount": String(product.salePrice ?? product.price),
      "product:price:currency": "HUF",
      "product:availability": inStock ? "in stock" : "out of stock",
    },
  };
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  return children;
}
