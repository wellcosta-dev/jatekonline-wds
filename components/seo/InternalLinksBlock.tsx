import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SeoInternalLink } from "@/lib/seo-content";

interface InternalLinksBlockProps {
  title: string;
  links: SeoInternalLink[];
  className?: string;
}

export function InternalLinksBlock({ title, links, className }: InternalLinksBlockProps) {
  if (links.length === 0) return null;

  return (
    <section className={className}>
      <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-neutral-dark mb-3">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={`${link.href}-${link.title}`}
            href={link.href}
            className="group rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <p className="text-sm font-bold text-neutral-dark tracking-tight mb-1">
              {link.title}
            </p>
            <p className="text-xs text-neutral-medium leading-relaxed mb-2">
              {link.description}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Megnézem
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
