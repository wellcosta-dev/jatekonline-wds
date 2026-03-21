import type { Product } from "@/types";

export interface ProductInternalLink {
  label: string;
  href: string;
}

export function getSeoProductLead(product: Product, categoryName?: string): string {
  const categoryPart = categoryName ? `${categoryName.toLowerCase()} kategóriában` : "webshopunkban";
  const stockPart = product.stock > 0 ? "raktárról elérhető" : "előrendelhető";
  const skuPart = product.sku ? ` (Cikkszám: ${product.sku})` : "";
  return `${product.name} ${categoryPart} ${stockPart} termék, részletes leírással és gyors kiszállítással.${skuPart}`;
}

export function getProductInternalLinks(product: Product, categorySlug?: string): ProductInternalLink[] {
  const links: ProductInternalLink[] = [
    { label: "Összes termék", href: "/termekek" },
    { label: "Akciós ajánlatok", href: "/akciok" },
    { label: "Vásárlási útmutatók", href: "/blog/temak/vasarlasi-utmutatok" },
  ];

  if (categorySlug) {
    links.unshift({ label: "Vissza a kategóriához", href: `/kategoriak/${categorySlug}` });
    links.unshift({ label: "Kategória tippek", href: `/kategoriak/${categorySlug}/tippek` });
  }

  if (product.stock <= 0) {
    links.push({ label: "Újdonságok", href: "/ujdonsagok" });
  }

  return links.slice(0, 4);
}
