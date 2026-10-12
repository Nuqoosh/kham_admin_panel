"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ImagePlus, Package } from "lucide-react";
import { productsApi } from "@/lib/api";
import { getFormErrorMessage } from "@/lib/form";
import { useApi } from "@/lib/hooks/use-api";
import { BackLink, PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, loading, error, reload } = useApi(
    () => productsApi.get(id),
    [id],
  );
  const product = (data ?? null) as Record<string, unknown> | null;
  const variants = Array.isArray(product?.variants)
    ? (product.variants as Record<string, unknown>[])
    : [];
  const media = Array.isArray(product?.media)
    ? (product.media as Record<string, unknown>[])
    : [];

  const [uploading, setUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteMediaId, setDeleteMediaId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isArchived = String(product?.status ?? "") === "archived";

  async function onArchive() {
    setActionError(null);
    try {
      await productsApi.patch(id, { status: "archived" });
      reload();
    } catch (err) {
      setActionError(getFormErrorMessage(err));
      throw err;
    }
  }

  async function onRestore() {
    setActionError(null);
    try {
      await productsApi.patch(id, { status: "active" });
      reload();
    } catch (err) {
      setActionError(getFormErrorMessage(err));
      throw err;
    }
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setMediaError(null);
    try {
      await productsApi.uploadImages(id, Array.from(files), {
        is_primary: media.length === 0,
      });
      reload();
    } catch (err) {
      setMediaError(getFormErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function onDeleteImage() {
    if (!deleteMediaId) return;
    setMediaError(null);
    try {
      await productsApi.deleteImage(id, deleteMediaId);
      reload();
    } catch (err) {
      setMediaError(getFormErrorMessage(err));
      throw err;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <BackLink href="/products" label="Products" />
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {product ? (
        <>
          <PageHeader
            eyebrow="Catalog"
            title={String(product.name ?? "Product")}
            description={String(product.short_description ?? product.slug ?? "")}
            actions={
              <>
                <Link
                  href={`/products/${id}/edit`}
                  className="inline-flex h-11 items-center rounded-full border border-olive bg-olive px-6 text-xs uppercase tracking-[0.16em] text-cream hover:bg-olive-soft"
                >
                  Edit
                </Link>
                {isArchived ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRestoreOpen(true)}
                  >
                    Restore
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setArchiveOpen(true)}
                  >
                    Archive
                  </Button>
                )}
              </>
            }
          />

          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="uppercase tracking-[0.12em]">
              {String(product.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              slug: {String(product.slug)}
            </span>
          </div>

          {actionError ? (
            <p className="text-sm text-destructive">{actionError}</p>
          ) : null}

          {product.description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-ink/80">
              {String(product.description)}
            </p>
          ) : null}

          <section className="space-y-4 rounded-2xl bg-paper p-5 ring-1 ring-border sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ImagePlus className="size-5 text-ink" strokeWidth={1.4} />
                <h2 className="font-display text-2xl text-ink">Images</h2>
              </div>
              <label className="inline-flex h-10 cursor-pointer items-center rounded-full border border-olive/25 bg-paper px-4 text-xs uppercase tracking-[0.14em] hover:bg-sand">
                {uploading ? "Uploading…" : "Upload images"}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    void onUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {mediaError ? (
              <p className="text-sm text-destructive">{mediaError}</p>
            ) : null}
            {media.length === 0 ? (
              <p className="text-sm text-muted-foreground">No images yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {media.map((item) => (
                  <div
                    key={String(item.id)}
                    className="overflow-hidden rounded-xl ring-1 ring-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={String(item.url ?? "")}
                      alt={String(item.alt_text ?? "")}
                      className="aspect-square w-full object-contain"
                    />
                    <div className="flex items-center justify-between gap-2 p-2">
                      <p className="truncate text-[11px] text-muted-foreground">
                        {String(item.alt_text || `Image #${item.id}`)}
                      </p>
                      <button
                        type="button"
                        className="text-[11px] uppercase tracking-[0.12em] text-destructive"
                        onClick={() => setDeleteMediaId(String(item.id))}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-paper p-5 ring-1 ring-border sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Package
                className="size-5 shrink-0 text-ink"
                strokeWidth={1.4}
              />
              <h2 className="font-display text-2xl text-ink">Variants</h2>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Prices</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No variants.
                    </TableCell>
                  </TableRow>
                ) : (
                  variants.map((v) => {
                    const prices = Array.isArray(v.prices)
                      ? (v.prices as Record<string, unknown>[])
                      : [];
                    const stocks = Array.isArray(v.stocks)
                      ? (v.stocks as Record<string, unknown>[])
                      : [];
                    return (
                      <TableRow key={String(v.id ?? v.sku)}>
                        <TableCell className="font-medium">
                          {String(v.sku ?? "—")}
                        </TableCell>
                        <TableCell>{String(v.title ?? "—")}</TableCell>
                        <TableCell className="tabular-nums">
                          {v.cost_price != null && v.cost_price !== ""
                            ? Number(v.cost_price).toFixed(2)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {prices.length
                            ? prices
                                .map((p) => {
                                  const market =
                                    p.market && typeof p.market === "object"
                                      ? (p.market as Record<string, unknown>)
                                      : null;
                                  return `${market?.code ?? market?.name ?? p.market_id}: ${p.price}`;
                                })
                                .join(" · ")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {stocks.length
                            ? stocks
                                .map((s) => {
                                  const wh =
                                    s.warehouse &&
                                    typeof s.warehouse === "object"
                                      ? (s.warehouse as Record<string, unknown>)
                                      : null;
                                  return `${wh?.name ?? s.warehouse_id}: ${s.on_hand ?? s.quantity ?? 0}`;
                                })
                                .join(" · ")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </section>

          <ConfirmDialog
            open={archiveOpen}
            onOpenChange={setArchiveOpen}
            title="Archive product?"
            description={`“${String(product.name ?? "This product")}” will be marked archived. Find it later under Products → Archived.`}
            confirmLabel="Archive"
            tone="danger"
            onConfirm={onArchive}
          />

          <ConfirmDialog
            open={restoreOpen}
            onOpenChange={setRestoreOpen}
            title="Restore product?"
            description={`“${String(product.name ?? "This product")}” will be set back to active.`}
            confirmLabel="Restore"
            onConfirm={onRestore}
          />

          <ConfirmDialog
            open={deleteMediaId != null}
            onOpenChange={(open) => {
              if (!open) setDeleteMediaId(null);
            }}
            title="Delete image?"
            description="This image will be permanently removed from the product gallery."
            confirmLabel="Delete"
            tone="danger"
            onConfirm={onDeleteImage}
          />
        </>
      ) : null}
    </div>
  );
}
