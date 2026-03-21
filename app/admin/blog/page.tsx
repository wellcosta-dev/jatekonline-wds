"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Calendar,
  User,
  X,
  Save,
  Loader2,
  Bot,
} from "lucide-react";
import type { BlogPost } from "@/types";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/app/admin/_components/StatusChip";

const coverGradients = [
  "from-primary to-brand-cyan",
  "from-brand-pink to-secondary",
  "from-brand-cyan to-primary",
  "from-accent to-amber-400",
  "from-emerald-500 to-brand-cyan",
];

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    intent: "save" | "toggle" | "delete";
    post: BlogPost | null;
    toggleTo?: boolean;
  }>({
    open: false,
    title: "",
    message: "",
    intent: "save",
    post: null,
  });

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      setLoadingError("");
      try {
        const response = await fetch("/api/admin/blog-posts", { cache: "no-store" });
        const payload = (await response.json()) as { posts?: BlogPost[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Nem sikerült betölteni a cikkeket.");
        }
        setPosts(payload.posts ?? []);
      } catch (error) {
        setLoadingError(error instanceof Error ? error.message : "Betöltési hiba.");
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.author.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "published" && p.isPublished) ||
        (filter === "draft" && !p.isPublished);
      return matchSearch && matchFilter;
    });
  }, [posts, search, filter]);

  function openEditModal(post: BlogPost) {
    setEditingPost(post);
    setForm({ ...post });
    setActionError("");
    setActionSuccess("");
  }

  function closeEditModal() {
    setEditingPost(null);
    setForm(null);
    setActionError("");
    setActionSuccess("");
  }

  function askSaveConfirmation() {
    if (!editingPost || !form) return;
    setConfirmState({
      open: true,
      title: "Módosítás megerősítése",
      message: `Biztosan mented a(z) "${editingPost.title}" cikk módosításait?`,
      intent: "save",
      post: editingPost,
    });
  }

  function askToggleConfirmation(post: BlogPost, nextIsPublished: boolean) {
    setConfirmState({
      open: true,
      title: nextIsPublished ? "Közzététel megerősítése" : "Inaktiválás megerősítése",
      message: nextIsPublished
        ? `Biztosan közzéteszed a(z) "${post.title}" cikket?`
        : `Biztosan inaktiválod a(z) "${post.title}" cikket?`,
      intent: "toggle",
      post,
      toggleTo: nextIsPublished,
    });
  }

  function askDeleteConfirmation(post: BlogPost) {
    setConfirmState({
      open: true,
      title: "Törlés megerősítése",
      message: `Biztosan törlöd a(z) "${post.title}" cikket? Ez a művelet nem visszavonható.`,
      intent: "delete",
      post,
    });
  }

  async function executeSave(postId: string) {
    if (!form) return;
    setSaving(true);
    setActionError("");
    setActionSuccess("");
    try {
      const response = await fetch(`/api/admin/blog-posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          title: form.title,
          content: form.content,
          excerpt: form.excerpt,
          coverImage: form.coverImage,
          author: form.author,
          tags: form.tags,
          metaTitle: form.metaTitle,
          metaDescription: form.metaDescription,
          isPublished: form.isPublished,
        }),
      });
      const payload = (await response.json()) as { post?: BlogPost; error?: string };
      if (!response.ok || !payload.post) {
        throw new Error(payload.error ?? "Mentési hiba.");
      }
      setPosts((prev) => prev.map((entry) => (entry.id === payload.post!.id ? payload.post! : entry)));
      setEditingPost(payload.post);
      setForm({ ...payload.post });
      setActionSuccess("Cikk módosításai mentve.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Mentési hiba.");
    } finally {
      setSaving(false);
    }
  }

  async function executeToggle(post: BlogPost, nextIsPublished: boolean) {
    setSaving(true);
    setActionError("");
    setActionSuccess("");
    try {
      const response = await fetch(`/api/admin/blog-posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: nextIsPublished }),
      });
      const payload = (await response.json()) as { post?: BlogPost; error?: string };
      if (!response.ok || !payload.post) {
        throw new Error(payload.error ?? "Állapotmódosítási hiba.");
      }
      setPosts((prev) => prev.map((entry) => (entry.id === payload.post!.id ? payload.post! : entry)));
      setActionSuccess(nextIsPublished ? "Cikk közzétéve." : "Cikk inaktiválva.");
      if (editingPost?.id === payload.post.id) {
        setEditingPost(payload.post);
        setForm({ ...payload.post });
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Állapotmódosítási hiba.");
    } finally {
      setSaving(false);
    }
  }

  async function executeDelete(post: BlogPost) {
    setSaving(true);
    setActionError("");
    setActionSuccess("");
    try {
      const response = await fetch(`/api/admin/blog-posts/${post.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Törlési hiba.");
      }
      setPosts((prev) => prev.filter((entry) => entry.id !== post.id));
      setActionSuccess("Cikk törölve.");
      if (editingPost?.id === post.id) {
        closeEditModal();
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Törlési hiba.");
    } finally {
      setSaving(false);
    }
  }

  async function onConfirmAction() {
    const state = confirmState;
    setConfirmState((prev) => ({ ...prev, open: false }));
    if (!state.post) return;
    if (state.intent === "save") {
      await executeSave(state.post.id);
      return;
    }
    if (state.intent === "toggle") {
      await executeToggle(state.post, Boolean(state.toggleTo));
      return;
    }
    await executeDelete(state.post);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Blog kezelés</h1>
          <p className="text-sm text-neutral-medium">{filteredPosts.length} cikk</p>
        </div>
        <div className="text-xs text-neutral-medium rounded-xl border border-gray-200 bg-white px-3 py-2">
          Szerkesztés / inaktiválás / törlés elérhető
        </div>
      </div>

      {loadingError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadingError}
        </div>
      )}
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {!actionError && actionSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionSuccess}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-medium" />
          <input
            type="search"
            placeholder="Keresés cím vagy szerző alapján..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { id: "all" as const, label: "Összes" },
            { id: "published" as const, label: "Közzétéve" },
            { id: "draft" as const, label: "Piszkozat" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors",
                filter === tab.id
                  ? "bg-primary text-white shadow-sm shadow-primary/20"
                  : "bg-white border border-gray-200 text-neutral-medium hover:bg-gray-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-neutral-medium flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Cikkek betöltése...
        </div>
      )}

      {/* Posts grid */}
      {!loading && (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPosts.length === 0 && (
          <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-neutral-medium">
            Nincs megjeleníthető blog cikk.
          </div>
        )}
        {filteredPosts.map((post, i) => (
          <article key={post.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
            {/* Cover */}
            <div className={cn("h-32 bg-gradient-to-br relative overflow-hidden", coverGradients[i % coverGradients.length])}>
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute top-3 left-3 flex gap-1.5">
                <StatusChip
                  label={post.isPublished ? "Közzétéve" : "Piszkozat"}
                  tone={post.isPublished ? "success" : "neutral"}
                />
                {post.aiGenerated && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/20 text-white backdrop-blur-sm flex items-center gap-0.5">
                    <Bot className="size-2.5" /> AI
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-neutral-dark tracking-tight line-clamp-2">{post.title}</h3>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-neutral-medium">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-3 text-[10px] text-neutral-medium">
                <span className="flex items-center gap-1"><User className="size-3" /> {post.author}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" })
                    : new Date(post.createdAt).toLocaleDateString("hu-HU")}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => openEditModal(post)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-dark hover:bg-gray-50 transition-colors"
                  title="Szerkesztés"
                >
                  <Pencil className="size-3.5" />
                  Szerkesztés
                </button>
                <button
                  type="button"
                  onClick={() => askToggleConfirmation(post, !post.isPublished)}
                  className="p-1.5 text-neutral-medium hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title={post.isPublished ? "Inaktiválás" : "Közzététel"}
                >
                  {post.isPublished ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => askDeleteConfirmation(post)}
                  className="p-1.5 text-neutral-medium hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Törlés"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      )}

      {editingPost && form && (
        <div className="fixed inset-0 z-[95] bg-black/45 backdrop-blur-[1px] p-4 sm:p-6 grid place-items-center">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-base font-extrabold text-neutral-dark tracking-tight">Blog cikk szerkesztése</h2>
                <p className="text-xs text-neutral-medium">{editingPost.title}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-2 text-neutral-medium hover:bg-gray-100 hover:text-neutral-dark"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-132px)] overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input label="Cím" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
                <Input label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
                <Input label="Szerző" value={form.author} onChange={(value) => setForm({ ...form, author: value })} />
                <Input
                  label="Borítókép URL"
                  value={form.coverImage ?? ""}
                  onChange={(value) => setForm({ ...form, coverImage: value })}
                />
                <Input
                  label="Meta title"
                  value={form.metaTitle ?? ""}
                  onChange={(value) => setForm({ ...form, metaTitle: value })}
                />
                <Input
                  label="Címkék (vesszővel)"
                  value={form.tags.join(", ")}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      tags: value.split(",").map((entry) => entry.trim()).filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="mt-4 space-y-4">
                <TextArea
                  label="Kivonat"
                  value={form.excerpt ?? ""}
                  rows={3}
                  onChange={(value) => setForm({ ...form, excerpt: value })}
                />
                <TextArea
                  label="Meta description"
                  value={form.metaDescription ?? ""}
                  rows={3}
                  onChange={(value) => setForm({ ...form, metaDescription: value })}
                />
                <TextArea
                  label="Cikk tartalma"
                  value={form.content}
                  rows={14}
                  onChange={(value) => setForm({ ...form, content: value })}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-neutral-medium">
                Mentés előtt megerősítő ablak jelenik meg.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50"
                >
                  Bezárás
                </button>
                <button
                  type="button"
                  onClick={askSaveConfirmation}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Mentés
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmState.open && (
        <div className="fixed inset-0 z-[110] bg-black/40 grid place-items-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-extrabold text-neutral-dark tracking-tight">{confirmState.title}</h3>
            <p className="text-sm text-neutral-medium mt-2 leading-relaxed">{confirmState.message}</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmState((prev) => ({ ...prev, open: false }))}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={onConfirmAction}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Megerősítem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-neutral-dark">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-neutral-dark">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
