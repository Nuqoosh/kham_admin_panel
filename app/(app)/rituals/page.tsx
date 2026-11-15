"use client";

import { useState } from "react";
import { ritualsApi, type RitualInput } from "@/lib/api";
import { getFieldErrors, getFormErrorMessage, slugify } from "@/lib/form";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { TableActions } from "@/components/table-actions";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PER_PAGE = 20;

export default function RitualsPage() {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isPublished, setIsPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data, meta, loading, error: loadError, reload } = useApi(
    () => ritualsApi.list({ page, per_page: PER_PAGE }),
    [page],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setTitleAr("");
    setDescription("");
    setImageUrl("");
    setSortOrder("0");
    setIsPublished(false);
    setError(null);
    setFieldErrors({});
  }

  function startEdit(row: Record<string, unknown>) {
    setEditingId(String(row.id));
    setTitle(String(row.title ?? ""));
    setSlug(String(row.slug ?? ""));
    setTitleAr(String(row.title_ar ?? ""));
    setDescription(String(row.description ?? ""));
    setImageUrl(String(row.image_url ?? ""));
    setSortOrder(String(row.sort_order ?? 0));
    setIsPublished(Boolean(row.is_published));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const payload: RitualInput = {
      title: title.trim(),
      slug: (slug.trim() || slugify(title)).trim(),
      title_ar: titleAr.trim() || null,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      sort_order: Number(sortOrder) || 0,
      is_published: isPublished,
    };
    try {
      if (editingId) await ritualsApi.update(editingId, payload);
      else await ritualsApi.create(payload);
      resetForm();
      reload();
    } catch (err) {
      setError(getFormErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CMS"
        title="Rituals"
        description="Published ritual content for the storefront."
        actions={
          <Button type="button" variant="outline" className="bg-paper" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">{editingId ? `Edit #${editingId}` : "New ritual"}</h2>
        <FormAlert error={error} fieldErrors={fieldErrors} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Title
            <Input className="mt-2" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Slug
            <Input className="mt-2" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Title (AR)
            <Input className="mt-2" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Sort order
            <Input className="mt-2" type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground sm:col-span-2">
            Image URL
            <Input className="mt-2" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground sm:col-span-2">
            Description
            <Textarea className="mt-2 min-h-24 rounded-xl" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Published
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : editingId ? "Update" : "Create"}</Button>
          {editingId ? <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button> : null}
        </div>
      </form>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No rituals yet.</TableCell>
            </TableRow>
          ) : (
            items.map((row) => (
              <TableRow key={String(row.id)}>
                <TableCell className="font-medium">{String(row.title ?? "—")}</TableCell>
                <TableCell>{String(row.slug ?? "—")}</TableCell>
                <TableCell className="tabular-nums">{String(row.sort_order ?? 0)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.is_published ? "Published" : "Draft"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(row)}>Edit</Button>
                    <TableActions
                      confirmMessage={`Delete ritual "${String(row.title)}"?`}
                      onDelete={async () => {
                        await ritualsApi.remove(String(row.id));
                        reload();
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
