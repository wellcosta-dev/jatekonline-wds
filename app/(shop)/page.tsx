import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TrustBadges } from "@/components/home/TrustBadges";
import { BlogPreview } from "@/components/home/BlogPreview";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <div className="bg-neutral-pale">
        <CategoryGrid />
      </div>
      <div className="bg-white">
        <FeaturedProducts />
      </div>
      <TrustBadges />
      <BlogPreview />
      <NewsletterSignup />
    </>
  );
}
