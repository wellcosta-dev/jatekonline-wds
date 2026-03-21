"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-1 text-sm text-neutral-medium", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="inline-flex max-w-full items-center gap-1 min-w-0">
            {index > 0 && (
              <ChevronRight className="size-4 text-neutral-medium flex-shrink-0" />
            )}
            {isLast || !item.href ? (
              <span
                className={cn(
                  "font-medium min-w-0",
                  isLast && "whitespace-normal break-words leading-snug",
                  isLast ? "text-neutral-dark" : "text-neutral-medium"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
