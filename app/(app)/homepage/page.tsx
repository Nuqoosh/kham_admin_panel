"use client";

import { useState } from "react";
import {
  homepageApi,
  type HomepageSectionInput,
  type HomepageSectionType,
} from "@/lib/api";
import { getFieldErrors, getFormErrorMessage, slugify } from "@/lib/form";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { TableActions } from "@/components/table-actions";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
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
const TYPES: HomepageSectionType[] = [
  "hero",
  "banner",
  "featured",
  "promotion",
  "editorial",
  "custom",
];

const emptyForm = {
  key: "",
  type: "hero" as HomepageSectionType,
  title_en: "",
  title_ar: "",
  subtitle_en: "",
  image_url: "",
  link_url: "",
  sort_order: "0",
  is_published: true,
};

export default function HomepagePage() {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data, meta, loading, error: loadError, reload } = useApi(
    () => homepageApi.list({ page, per_page: PER_PAGE }),
    [page],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setFieldErrors({});
  }

  function startEdit(row: Record<string, unknown>) {
    setEditingId(String(row.id));
    setForm({
      key: String(row.key ?? ""),
      type: (String(row.type ?? "hero") as HomepageSectionType) || "hero",
      title_en: String(row.title_en ?? row.title ?? ""),
      title_ar: String(row.title_ar ?? ""),
      subtitle_en: String(row.subtitle_en ?? row.subtitle ?? ""),
      image_url: String(row.image_url ?? ""),
      link_url: String(row.link_url ?? ""),
      sort_order: String(row.sort_order ?? 0),
      is_published: Boolean(row.is_published),
    });
    setError(null);
    setFieldErrors({});
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const payload: HomepageSectionInput = {
      key: form.key.trim() || slugify(form.title_en),
      type: form.type,
      title_en: form.title_en.trim(),
      title_ar: form.title_ar.trim() || null,
      subtitle_en: form.subtitle_en.trim() || null,
      image_url: form.image_url.trim() || null,
      link_url: form.link_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_published: form.is_published,
    };
    try {
      if (editingId) await homepageApi.update(editingId, payload);
      else await homepageApi.create(payload);
      startCreate();
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
        title="Homepage"
        description="Published sections shown on the storefront homepage."
        actions={
          <Button type="button" variant="outline" className="bg-paper" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl">
            {editingId ? `Edit section #${editingId}` : "New section"}
          </h2>
          {editingId ? (
            <Button type="button" variant="outline" onClick={startCreate}>
              Cancel edit
            </Button>
          ) : null}
        </div>
        <FormAlert error={error} fieldErrors={fieldErrors} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Key">
            <Input
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              placeholder="hero-main"
              required={!editingId}
            />
          </Field>
          <Field label="Type">
            <SelectNative
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as HomepageSectionType,
                }))
              }
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectNative>
          </Field>
          <Field label="Sort order">
            <Input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: e.target.value }))
              }
            />
          </Field>
          <Field label="Title (EN)">
            <Input
              required
              value={form.title_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_en: e.target.value }))
              }
            />
          </Field>
          <Field label="Title (AR)">
            <Input
              value={form.title_ar}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_ar: e.target.value }))
              }
            />
          </Field>
          <Field label="Subtitle (EN)">
            <Input
              value={form.subtitle_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, subtitle_en: e.target.value }))
              }
            />
          </Field>
          <Field label="Image URL">
            <Input
              value={form.image_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, image_url: e.target.value }))
              }
            />
          </Field>
          <Field label="Link URL">
            <Input
              value={form.link_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, link_url: e.target.value }))
              }
              placeholder="/shop or https://..."
            />
          </Field>
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_published: e.target.checked }))
              }
            />
            Published
          </label>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : editingId ? "Update section" : "Create section"}
        </Button>
      </form>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                No homepage sections yet.
              </TableCell>
            </TableRow>
          ) : (
            items.map((row) => (
              <TableRow key={String(row.id)}>
                <TableCell className="font-medium">{String(row.key ?? "—")}</TableCell>
                <TableCell>{String(row.type ?? "—")}</TableCell>
                <TableCell>{String(row.title_en ?? row.title ?? "—")}</TableCell>
                <TableCell className="tabular-nums">{String(row.sort_order ?? 0)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {row.is_published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(row)}>
                      Edit
                    </Button>
                    <TableActions
                      confirmMessage={`Delete section "${String(row.key)}"?`}
                      onDelete={async () => {
                        await homepageApi.remove(String(row.id));
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
