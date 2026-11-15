"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { catalogApi } from "@/lib/api";
import {
  emptyToNull,
  getFieldErrors,
  getFormErrorMessage,
  slugify,
} from "@/lib/form";
import { useApi } from "@/lib/hooks/use-api";
import { BackLink, PageHeader } from "@/components/page-header";
import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function BrandForm({
  mode,
  brandId,
  initial,
}: {
  mode: "create" | "edit";
  brandId?: string;
  initial?: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [origin, setOrigin] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initial) return;
    setName(String(initial.name ?? ""));
    setNameAr(String(initial.name_ar ?? ""));
    setSlug(String(initial.slug ?? ""));
    setSlugTouched(true);
    setOrigin(String(initial.origin_country ?? ""));
    setLogoUrl(String(initial.logo_url ?? ""));
    setDescription(String(initial.description ?? ""));
    setDescriptionAr(String(initial.description_ar ?? ""));
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
        await catalogApi.createBrand({
          name: name.trim(),
          name_ar: emptyToNull(nameAr),
          slug: slug.trim() || slugify(name),
          origin_country: emptyToNull(origin)?.toUpperCase() ?? null,
          logo_url: emptyToNull(logoUrl),
          description: emptyToNull(description),
          description_ar: emptyToNull(descriptionAr),
          is_active: isActive,
          image,
        });
      } else if (brandId) {
        await catalogApi.updateBrand(brandId, {
          name: name.trim(),
          name_ar: emptyToNull(nameAr),
          slug: slug.trim() || slugify(name),
          origin_country: emptyToNull(origin)?.toUpperCase() ?? null,
          logo_url: emptyToNull(logoUrl),
          description: emptyToNull(description),
          description_ar: emptyToNull(descriptionAr),
          is_active: isActive,
        });
        if (image) {
          await catalogApi.uploadBrandLogo(brandId, image);
        }
      }
      router.push("/brands");
    } catch (err) {
      setError(getFormErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeLogo() {
    if (!brandId) return;
    if (!confirm("Remove brand logo?")) return;
    setSaving(true);
    setError(null);
    try {
      await catalogApi.deleteBrandLogo(brandId);
      setLogoUrl("");
      setImage(null);
    } catch (err) {
      setError(getFormErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const currentLogo = preview || logoUrl || null;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5">
      <BackLink href="/brands" label="Brands" />
      <PageHeader
        eyebrow="Catalog"
        title={mode === "create" ? "New brand" : "Edit brand"}
        description={
          mode === "create"
            ? "Create a brand with an optional logo upload."
            : "Update brand details and manage the logo."
        }
      />
      <FormAlert error={error} fieldErrors={fieldErrors} />

      <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <div className="grid gap-4 sm:grid-cols-2">
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
          <FormField label="Name (AR)" htmlFor="name-ar">
            <Input
              id="name-ar"
              dir="rtl"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
            />
          </FormField>
        </div>
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
          <FormField label="Origin country (ISO2)" htmlFor="origin">
            <Input
              id="origin"
              maxLength={2}
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              placeholder="EG"
            />
          </FormField>
          <FormField label="External logo URL" htmlFor="logo">
            <Input
              id="logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Optional if uploading a file"
            />
          </FormField>
        </div>
        <FormField label="Description" htmlFor="description">
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <FormField label="Description (AR)" htmlFor="description-ar">
          <Textarea
            id="description-ar"
            dir="rtl"
            rows={4}
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
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
        <h2 className="font-display text-2xl">Logo</h2>
        {currentLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentLogo}
            alt=""
            className="h-24 w-24 rounded-xl object-cover ring-1 ring-border"
          />
        ) : (
          <p className="text-sm text-muted-foreground">No logo yet.</p>
        )}
        <FormField label="Upload logo" htmlFor="image">
          <Input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
        </FormField>
        {mode === "edit" && logoUrl ? (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={removeLogo}
          >
            Remove logo
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Create brand"
              : "Save changes"}
        </Button>
        <Link
          href="/brands"
          className="inline-flex h-11 items-center rounded-full border border-olive/25 px-6 text-xs uppercase tracking-[0.16em] hover:bg-sand"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function BrandEditLoader({ brandId }: { brandId: string }) {
  const { data, loading, error } = useApi(
    () => catalogApi.getBrand(brandId),
    [brandId],
  );
  const brand =
    data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : null;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading brand…</p>;
  }
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (!brand) {
    return <p className="text-sm text-destructive">Brand not found.</p>;
  }

  return <BrandForm mode="edit" brandId={brandId} initial={brand} />;
}
