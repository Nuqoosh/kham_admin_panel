"use client";

import { useState } from "react";
import { ingredientsApi, type IngredientInput } from "@/lib/api";
import { getFieldErrors, getFormErrorMessage, slugify } from "@/lib/form";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
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

export default function IngredientsPage() {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data, meta, loading, error: loadError, reload } = useApi(
    () => ingredientsApi.list({ page, per_page: PER_PAGE }),
    [page],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setNameAr("");
    setDescription("");
    setIsActive(true);
    setError(null);
    setFieldErrors({});
  }

  function startEdit(row: Record<string, unknown>) {
    setEditingId(String(row.id));
    setName(String(row.name ?? ""));
    setSlug(String(row.slug ?? ""));
    setNameAr(String(row.name_ar ?? ""));
    setDescription(String(row.description ?? ""));
    setIsActive(row.is_active !== false);
    setError(null);
    setFieldErrors({});
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const payload: IngredientInput = {
      name: name.trim(),
      slug: (slug.trim() || slugify(name)).trim(),
      name_ar: nameAr.trim() || null,
      description: description.trim() || null,
      is_active: isActive,
    };
    try {
      if (editingId) await ingredientsApi.update(editingId, payload);
      else await ingredientsApi.create(payload);
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
        title="Ingredients"
        description="Active ingredients shown on the storefront."
        actions={
          <Button type="button" variant="outline" className="bg-paper" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">
          {editingId ? `Edit #${editingId}` : "New ingredient"}
        </h2>
        <FormAlert error={error} fieldErrors={fieldErrors} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Name
            <Input className="mt-2" required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Slug
            <Input className="mt-2" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from name" />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Name (AR)
            <Input className="mt-2" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground sm:col-span-2">
            Description
            <Textarea className="mt-2 min-h-24 rounded-xl" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Update" : "Create"}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                No ingredients yet.
              </TableCell>
            </TableRow>
          ) : (
            items.map((row) => (
              <TableRow key={String(row.id)}>
                <TableCell className="font-medium">{String(row.name ?? "—")}</TableCell>
                <TableCell>{String(row.slug ?? "—")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.is_active === false ? "Inactive" : "Active"}</Badge>
                </TableCell>
                <TableCell>
                  <Button type="button" variant="outline" size="sm" onClick={() => startEdit(row)}>
                    Edit
                  </Button>
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
