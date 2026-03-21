"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { blogPosts } from "@/lib/mock-data";

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #4e0079 0%, #7B2FBE 50%, #0ebbe4 100%)",
  "linear-gradient(135deg, #0ebbe4 0%, #ff65c1 100%)",
  "linear-gradient(135deg, #ff65c1 0%, #ffcb00 100%)",
];


function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BlogPreview() {
  const posts = blogPosts.slice(0, 3);

  return (
    <section className="py-8 md:py-12 bg-neutral-pale">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          <h2 className="text-xl md:text-2xl font-bold text-neutral-dark tracking-tight">
            Blog & Tanácsok
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {posts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group"
            >
              <Link
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-xl shadow-soft overflow-hidden transition-all duration-300 hover:shadow-medium hover:-translate-y-1"
              >
                <div className="relative h-32 md:h-36 w-full overflow-hidden">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{ background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }}
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-neutral-dark mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-neutral-medium line-clamp-2 mb-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-medium">
                      {post.publishedAt ? formatDate(post.publishedAt) : ""}
                    </span>
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Tovább →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-right"
        >
          <Link
            href="/blog"
            className="focus-ring inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Összes cikk →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
