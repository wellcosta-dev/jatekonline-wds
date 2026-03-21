"use client";

import { useMemo, useState } from "react";
import { Copy, Megaphone, Search } from "lucide-react";
import { marketingPostIdeas, type ConversionGoal } from "@/lib/marketing-posts";
import { cn } from "@/lib/utils";

const goals: Array<ConversionGoal | "ALL"> = [
  "ALL",
  "Purchase",
  "Traffic",
  "Lead",
  "Retargeting",
  "Engagement",
];

const platforms = ["ALL", "Facebook", "Instagram"] as const;

export default function AdminMarketingPosztokPage() {
  const [query, setQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState<(typeof goals)[number]>("ALL");
  const [platformFilter, setPlatformFilter] = useState<(typeof platforms)[number]>("ALL");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return marketingPostIdeas.filter((post) => {
      const matchesGoal = goalFilter === "ALL" || post.goal === goalFilter;
      const matchesPlatform = platformFilter === "ALL" || post.platform === platformFilter;
      if (!matchesGoal || !matchesPlatform) return false;
      if (!q) return true;
      return (
        post.headline.toLowerCase().includes(q) ||
        post.caption.toLowerCase().includes(q) ||
        post.topic.toLowerCase().includes(q)
      );
    });
  }, [query, goalFilter, platformFilter]);

  const handleCopy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">
            Marketing posztok (100 db)
          </h1>
          <p className="text-sm text-neutral-medium mt-0.5">
            Konverziófókuszú Facebook és Instagram posztötletek.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
          <Megaphone className="size-4" />
          {filtered.length} poszt szűrés után
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="relative lg:col-span-1">
          <Search className="size-4 text-neutral-medium absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés cím vagy kulcsszó alapján..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex gap-2 lg:col-span-2">
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value as (typeof goals)[number])}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {goals.map((goal) => (
              <option key={goal} value={goal}>
                {goal === "ALL" ? "Minden cél" : goal}
              </option>
            ))}
          </select>

          <select
            value={platformFilter}
            onChange={(e) =>
              setPlatformFilter(e.target.value as (typeof platforms)[number])
            }
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform === "ALL" ? "Minden platform" : platform}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map((post) => {
          const fullText = `${post.headline}\n\n${post.caption}\n\nCTA: ${post.cta}\n\n${post.hashtags.join(
            " "
          )}`;
          return (
            <article
              key={post.id}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-neutral-dark">
                    #{post.id}
                  </span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {post.platform}
                  </span>
                  <span className="rounded-md bg-brand-cyan/10 px-2 py-0.5 text-[10px] font-bold text-brand-cyan">
                    {post.format}
                  </span>
                  <span className="rounded-md bg-brand-pink/10 px-2 py-0.5 text-[10px] font-bold text-brand-pink">
                    {post.goal}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(post.id, fullText)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    copiedId === post.id
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-neutral-dark hover:bg-gray-200"
                  )}
                >
                  <Copy className="size-3.5" />
                  {copiedId === post.id ? "Másolva" : "Másolás"}
                </button>
              </div>

              <h2 className="text-sm font-extrabold text-neutral-dark tracking-tight mb-2">
                {post.headline}
              </h2>
              <p className="text-xs leading-relaxed text-neutral-medium whitespace-pre-line mb-3">
                {post.caption}
              </p>

              <div className="rounded-xl bg-neutral-pale px-3 py-2 mb-2">
                <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-medium mb-1">
                  Kreatív brief
                </p>
                <p className="text-xs text-neutral-dark">{post.creativeBrief}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs">
                  <span className="font-bold text-neutral-dark">CTA:</span>{" "}
                  <span className="text-neutral-medium">{post.cta}</span>
                </p>
                <p className="text-xs text-neutral-medium">{post.hashtags.join(" ")}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
