"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { catalogApi } from "@/lib/api";
import {
  emptyToNull,
  flattenCategories,
  getFieldErrors,
  getFormErrorMessage,
  parseOptionalNumber,
  slugify,
} from "@/lib/form";
import { unwrapList, useApi } from "@/lib/hooks/use-api";
import { BackLink, PageHeader } from "@/components/page-header";
import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectNative } from "@/components/ui/select-native";

export function CategoryForm({
  mode,
  categoryId,
  initial,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  initial?: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const categories = useApi(() => catalogApi.categories({ tree: true }), []);
  const parentOptions = useMemo(
    () =>
      flattenCategories(unwrapList(categories.data)).filter(
        (c) => String(c.id) !== String(categoryId),
      ),
    [categories.data, categoryId],
  );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initial) return;
    setName(String(initial.name ?? ""));
    setSlug(String(initial.slug ?? ""));
    setSlugTouched(true);
    setParentId(initial.parent_id != null ? String(initial.parent_id) : "");
    setSortOrder(
      initial.sort_order != null ? String(initial.sort_order) : "0",
    );
    setImageUrl(String(initial.image_url ?? ""));
    setDescription(String(initial.description ?? ""));
    setIsActive(initial.is_active !== false);
  }, [initial]);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      if (mode === "create") {
        await catalogApi.createCategory({
          name: name.trim(),
          slug: slug.trim() || slugify(name),
          parent_id: parentId ? Number(parentId) : null,
          sort_order: parseOptionalNumber(sortOrder) ?? 0,
          image_url: emptyToNull(imageUrl),
          description: emptyToNull(description),
          is_active: isActive,
          image,
        });
      } else if (categoryId) {
        await catalogApi.updateCategory(categoryId, {
          name: name.trim(),
          slug: slug.trim() || slugify(name),
          parent_id: parentId ? Number(parentId) : null,
          sort_order: parseOptionalNumber(sortOrder) ?? 0,
          image_url: emptyToNull(imageUrl),
          description: emptyToNull(description),
          is_active: isActive,
        });
        if (image) {
          await catalogApi.uploadCategoryImage(categoryId, image);
        }
      }
      router.push("/categories");
    } catch (err) {
      setError(getFormErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeImage() {
    if (!categoryId) return;
    if (!confirm("Remove category image?")) return;
    setSaving(true);
    setError(null);
    try {
      await catalogApi.deleteCategoryImage(categoryId);
      setImageUrl("");
      setImage(null);
    } catch (err) {
      setError(getFormErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const currentImage = preview || imageUrl || null;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5">
      <BackLink href="/categories" label="Categories" />
      <PageHeader
        eyebrow="Catalog"
        title={mode === "create" ? "New category" : "Edit category"}
        description={
          mode === "create"
            ? "Create a category (max 3 levels) with an optional image."
            : "Update category details and manage the image."
        }
      />
      <FormAlert error={error} fieldErrors={fieldErrors} />

      <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <FormField label="Name" htmlFor="name">
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </FormField>
        <FormField label="Slug" htmlFor="slug">
          <Input
            id="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Parent category" htmlFor="parent">
            <SelectNative
              id="parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">None (root)</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField label="Sort order" htmlFor="sort">
            <Input
              id="sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="External image URL" htmlFor="image-url">
          <Input
            id="image-url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Optional if uploading a file"
          />
        </FormField>
        <FormField label="Description" htmlFor="description">
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 accent-olive"
          />
          Active
        </label>
      </div>

      <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">Image</h2>
        {currentImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImage}
            alt=""
            className="h-28 w-40 rounded-xl object-cover ring-1 ring-border"
          />
        ) : (
          <p className="text-sm text-muted-foreground">No image yet.</p>
        )}
        <FormField label="Upload image" htmlFor="image">
          <Input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
        </FormField>
        {mode === "edit" && imageUrl ? (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={removeImage}
          >
            Remove image
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Create category"
              : "Save changes"}
        </Button>
        <Link
          href="/categories"
          className="inline-flex h-11 items-center rounded-full border border-olive/25 px-6 text-xs uppercase tracking-[0.16em] hover:bg-sand"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function CategoryEditLoader({ categoryId }: { categoryId: string }) {
  const { data, loading, error } = useApi(
    () => catalogApi.getCategory(categoryId),
    [categoryId],
  );
  const category =
    data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : null;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading category…</p>;
  }
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (!category) {
    return <p className="text-sm text-destructive">Category not found.</p>;
  }

  return (
    <CategoryForm mode="edit" categoryId={categoryId} initial={category} />
  );
}
