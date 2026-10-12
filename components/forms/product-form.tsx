"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  catalogApi,
  productsApi,
  type ProductMultipartInput,
  type ProductStatus,
  type ProductVariantInput,
} from "@/lib/api";
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
import { FormAlert, FieldHint } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectNative } from "@/components/ui/select-native";

type PriceRow = {
  market_id: string;
  currency_id: string;
  price: string;
  compare_at_price: string;
  is_active: boolean;
};

type StockRow = {
  warehouse_id: string;
  quantity: string;
  reorder_level: string;
};

type VariantRow = {
  id?: number;
  sku: string;
  title: string;
  barcode: string;
  cost_price: string;
  prices: PriceRow[];
  stocks: StockRow[];
};

type ImageDraft = {
  file: File;
  alt: string;
  preview: string;
};

const emptyPrice = (): PriceRow => ({
  market_id: "",
  currency_id: "",
  price: "",
  compare_at_price: "",
  is_active: true,
});

const emptyStock = (): StockRow => ({
  warehouse_id: "",
  quantity: "0",
  reorder_level: "10",
});

const emptyVariant = (): VariantRow => ({
  sku: "",
  title: "",
  barcode: "",
  cost_price: "",
  prices: [],
  stocks: [],
});

function mapVariant(v: Record<string, unknown>): VariantRow {
  const prices = Array.isArray(v.prices)
    ? (v.prices as Record<string, unknown>[])
    : [];
  const stocks = Array.isArray(v.stocks)
    ? (v.stocks as Record<string, unknown>[])
    : [];

  return {
    id: v.id != null ? Number(v.id) : undefined,
    sku: String(v.sku ?? ""),
    title: String(v.title ?? ""),
    barcode: String(v.barcode ?? ""),
    cost_price: v.cost_price != null ? String(v.cost_price) : "",
    prices: prices.map((p) => ({
      market_id: p.market_id != null ? String(p.market_id) : "",
      currency_id: p.currency_id != null ? String(p.currency_id) : "",
      price: p.price != null ? String(p.price) : "",
      compare_at_price:
        p.compare_at_price != null ? String(p.compare_at_price) : "",
      is_active: p.is_active !== false,
    })),
    stocks: stocks.map((s) => ({
      warehouse_id: s.warehouse_id != null ? String(s.warehouse_id) : "",
      quantity: s.on_hand != null ? String(s.on_hand) : String(s.quantity ?? "0"),
      reorder_level:
        s.reorder_level != null ? String(s.reorder_level) : "10",
    })),
  };
}

export function ProductForm({
  mode,
  productId,
  initial,
}: {
  mode: "create" | "edit";
  productId?: string;
  initial?: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const brands = useApi(() => catalogApi.brands({ per_page: 100 }), []);
  const categories = useApi(() => catalogApi.categories({ tree: true }), []);
  const markets = useApi(() => catalogApi.markets(), []);
  const currencies = useApi(() => catalogApi.currencies(), []);
  const warehouses = useApi(() => catalogApi.warehouses(), []);

  const brandItems = unwrapList(brands.data);
  const categoryItems = useMemo(
    () => flattenCategories(unwrapList(categories.data)),
    [categories.data],
  );
  const marketItems = unwrapList(markets.data);
  const currencyItems = unwrapList(currencies.data);
  const warehouseItems = unwrapList(warehouses.data);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<ProductStatus>("draft");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [usage, setUsage] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariant()]);
  const [imageDrafts, setImageDrafts] = useState<ImageDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initial) return;
    setName(String(initial.name ?? ""));
    setSlug(String(initial.slug ?? ""));
    setSlugTouched(true);
    setStatus((initial.status as ProductStatus) || "draft");
    setBrandId(initial.brand_id != null ? String(initial.brand_id) : "");
    setCategoryId(
      initial.category_id != null ? String(initial.category_id) : "",
    );
    setShortDescription(String(initial.short_description ?? ""));
    setDescription(String(initial.description ?? ""));
    setIngredients(String(initial.ingredients ?? ""));
    setUsage(String(initial.usage_instructions ?? ""));
    setTrackInventory(Boolean(initial.track_inventory ?? true));

    const existing = Array.isArray(initial.variants)
      ? (initial.variants as Record<string, unknown>[])
      : [];
    if (existing.length) {
      setVariants(existing.map(mapVariant));
    } else if (mode === "create") {
      setVariants([emptyVariant()]);
    }
  }, [initial, mode]);

  useEffect(() => {
    return () => {
      for (const draft of imageDrafts) URL.revokeObjectURL(draft.preview);
    };
  }, [imageDrafts]);

  function onMarketPick(
    variantIndex: number,
    priceIndex: number,
    marketId: string,
  ) {
    const market = marketItems.find((m) => String(m.id) === marketId);
    const currency =
      market?.currency && typeof market.currency === "object"
        ? (market.currency as Record<string, unknown>)
        : null;
    const currencyId =
      currency?.id != null
        ? String(currency.id)
        : market?.currency_id != null
          ? String(market.currency_id)
          : "";

    setVariants((rows) =>
      rows.map((row, i) => {
        if (i !== variantIndex) return row;
        return {
          ...row,
          prices: row.prices.map((p, pi) =>
            pi === priceIndex
              ? {
                  ...p,
                  market_id: marketId,
                  currency_id: currencyId || p.currency_id,
                }
              : p,
          ),
        };
      }),
    );
  }

  function onPickImages(files: FileList | null) {
    if (!files?.length) return;
    const next = Array.from(files).slice(0, 10).map((file) => ({
      file,
      alt: "",
      preview: URL.createObjectURL(file),
    }));
    setImageDrafts((prev) => [...prev, ...next].slice(0, 10));
  }

  function removeDraft(index: number) {
    setImageDrafts((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const cleanedVariants: ProductVariantInput[] = variants
      .map((v) => {
        const prices = v.prices
          .filter((p) => p.market_id && p.currency_id && p.price !== "")
          .map((p) => ({
            market_id: Number(p.market_id),
            currency_id: Number(p.currency_id),
            price: Number(p.price),
            compare_at_price: emptyToNull(p.compare_at_price)
              ? Number(p.compare_at_price)
              : null,
            is_active: p.is_active,
          }));

        const stocks = v.stocks
          .filter((s) => s.warehouse_id && s.quantity !== "")
          .map((s) => ({
            warehouse_id: Number(s.warehouse_id),
            quantity: Number(s.quantity),
            reorder_level: parseOptionalNumber(s.reorder_level),
          }));

        return {
          ...(v.id ? { id: v.id } : {}),
          sku: v.sku.trim(),
          title: emptyToNull(v.title),
          barcode: emptyToNull(v.barcode),
          cost_price: parseOptionalNumber(v.cost_price),
          ...(prices.length ? { prices } : {}),
          ...(stocks.length ? { stocks } : {}),
        };
      })
      .filter((v) => v.sku || v.id);

    const payload: ProductMultipartInput = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      status,
      brand_id: brandId ? Number(brandId) : null,
      category_id: categoryId ? Number(categoryId) : null,
      short_description: emptyToNull(shortDescription),
      description: emptyToNull(description),
      ingredients: emptyToNull(ingredients),
      usage_instructions: emptyToNull(usage),
      track_inventory: trackInventory,
      variants: cleanedVariants,
      images: imageDrafts.map((d) => d.file),
      image_alt_texts: imageDrafts.map((d) => emptyToNull(d.alt)),
    };

    try {
      if (mode === "create") {
        const res = await productsApi.create(payload);
        const id = (res.data as { id?: number })?.id;
        router.push(id ? `/products/${id}` : "/products");
      } else if (productId) {
        await productsApi.update(productId, payload);
        router.push(`/products/${productId}`);
      }
    } catch (err) {
      setError(getFormErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <BackLink href={productId ? `/products/${productId}` : "/products"} />
      </div>
      <PageHeader
        eyebrow="Catalog"
        title={mode === "create" ? "New product" : "Edit product"}
        description="Multipart create/update with images, market prices, and opening stock."
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
          <FieldHint error={fieldErrors.name} />
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
          <FieldHint error={fieldErrors.slug} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Status" htmlFor="status">
            <SelectNative
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </SelectNative>
          </FormField>

          <FormField label="Brand" htmlFor="brand">
            <SelectNative
              id="brand"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">None</option>
              {brandItems.map((b) => (
                <option key={String(b.id)} value={String(b.id)}>
                  {String(b.name)}
                </option>
              ))}
            </SelectNative>
          </FormField>

          <FormField label="Category" htmlFor="category">
            <SelectNative
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">None</option>
              {categoryItems.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>

        <FormField label="Short description" htmlFor="short">
          <Textarea
            id="short"
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
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

        <FormField label="Ingredients" htmlFor="ingredients">
          <Textarea
            id="ingredients"
            rows={3}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
        </FormField>

        <FormField label="Usage instructions" htmlFor="usage">
          <Textarea
            id="usage"
            rows={3}
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
          />
        </FormField>

        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={trackInventory}
            onChange={(e) => setTrackInventory(e.target.checked)}
            className="size-4 accent-olive"
          />
          Track inventory
        </label>
      </div>

      <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <div>
          <h2 className="font-display text-2xl">Images</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional jpg/png/webp uploads (max 10, 8&nbsp;MB each). Existing
            media can be managed on the product page.
          </p>
        </div>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            onPickImages(e.target.files);
            e.target.value = "";
          }}
        />
        {imageDrafts.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {imageDrafts.map((draft, index) => (
              <div
                key={draft.preview}
                className="flex gap-3 rounded-xl border border-border p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.preview}
                  alt=""
                  className="size-16 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-xs text-muted-foreground">
                    {draft.file.name}
                  </p>
                  <Input
                    placeholder="Alt text"
                    value={draft.alt}
                    onChange={(e) =>
                      setImageDrafts((rows) =>
                        rows.map((r, i) =>
                          i === index ? { ...r, alt: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDraft(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Variants</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each variant can include market prices and opening warehouse
              stock.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVariants((rows) => [...rows, emptyVariant()])}
          >
            Add variant
          </Button>
        </div>

        {variants.map((row, index) => (
          <div
            key={row.id ?? `new-${index}`}
            className="space-y-4 rounded-xl border border-border p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="SKU" htmlFor={`sku-${index}`}>
                <Input
                  id={`sku-${index}`}
                  value={row.sku}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, sku: e.target.value } : r,
                      ),
                    )
                  }
                  placeholder="KHAM-001"
                  required={!row.id}
                />
              </FormField>
              <FormField label="Title" htmlFor={`title-${index}`}>
                <Input
                  id={`title-${index}`}
                  value={row.title}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, title: e.target.value } : r,
                      ),
                    )
                  }
                />
              </FormField>
              <FormField label="Barcode" htmlFor={`barcode-${index}`}>
                <Input
                  id={`barcode-${index}`}
                  value={row.barcode}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, barcode: e.target.value } : r,
                      ),
                    )
                  }
                />
              </FormField>
              <FormField label="Cost price" htmlFor={`cost-${index}`}>
                <Input
                  id={`cost-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.cost_price}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, cost_price: e.target.value } : r,
                      ),
                    )
                  }
                />
              </FormField>
            </div>

            <div className="space-y-3 rounded-lg bg-cream/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-brown">
                  Market prices
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setVariants((rows) =>
                      rows.map((r, i) =>
                        i === index
                          ? { ...r, prices: [...r.prices, emptyPrice()] }
                          : r,
                      ),
                    )
                  }
                >
                  Add price
                </Button>
              </div>
              {row.prices.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No prices yet. Add one or use Pricing later.
                </p>
              ) : (
                row.prices.map((price, priceIndex) => (
                  <div
                    key={priceIndex}
                    className="grid gap-2 rounded-lg border border-border bg-paper p-3 sm:grid-cols-2 lg:grid-cols-5"
                  >
                    <FormField label="Market" htmlFor={`m-${index}-${priceIndex}`}>
                      <SelectNative
                        id={`m-${index}-${priceIndex}`}
                        value={price.market_id}
                        onChange={(e) =>
                          onMarketPick(index, priceIndex, e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        {marketItems.map((m) => (
                          <option key={String(m.id)} value={String(m.id)}>
                            {String(m.name ?? m.code ?? m.id)}
                          </option>
                        ))}
                      </SelectNative>
                    </FormField>
                    <FormField
                      label="Currency"
                      htmlFor={`c-${index}-${priceIndex}`}
                    >
                      <SelectNative
                        id={`c-${index}-${priceIndex}`}
                        value={price.currency_id}
                        onChange={(e) =>
                          setVariants((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    prices: r.prices.map((p, pi) =>
                                      pi === priceIndex
                                        ? {
                                            ...p,
                                            currency_id: e.target.value,
                                          }
                                        : p,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      >
                        <option value="">Select</option>
                        {currencyItems.map((c) => (
                          <option key={String(c.id)} value={String(c.id)}>
                            {String(c.code ?? c.id)}
                          </option>
                        ))}
                      </SelectNative>
                    </FormField>
                    <FormField label="Price" htmlFor={`p-${index}-${priceIndex}`}>
                      <Input
                        id={`p-${index}-${priceIndex}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={price.price}
                        onChange={(e) =>
                          setVariants((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    prices: r.prices.map((p, pi) =>
                                      pi === priceIndex
                                        ? { ...p, price: e.target.value }
                                        : p,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </FormField>
                    <FormField
                      label="Compare at"
                      htmlFor={`ca-${index}-${priceIndex}`}
                    >
                      <Input
                        id={`ca-${index}-${priceIndex}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={price.compare_at_price}
                        onChange={(e) =>
                          setVariants((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    prices: r.prices.map((p, pi) =>
                                      pi === priceIndex
                                        ? {
                                            ...p,
                                            compare_at_price: e.target.value,
                                          }
                                        : p,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </FormField>
                    <div className="flex items-end gap-2">
                      <label className="flex h-11 items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={price.is_active}
                          onChange={(e) =>
                            setVariants((rows) =>
                              rows.map((r, i) =>
                                i === index
                                  ? {
                                      ...r,
                                      prices: r.prices.map((p, pi) =>
                                        pi === priceIndex
                                          ? {
                                              ...p,
                                              is_active: e.target.checked,
                                            }
                                          : p,
                                      ),
                                    }
                                  : r,
                              ),
                            )
                          }
                          className="size-4 accent-olive"
                        />
                        Active
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setVariants((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    prices: r.prices.filter(
                                      (_, pi) => pi !== priceIndex,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 rounded-lg bg-cream/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-brown">
                  Opening stock
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setVariants((rows) =>
                      rows.map((r, i) =>
                        i === index
                          ? { ...r, stocks: [...r.stocks, emptyStock()] }
                          : r,
                      ),
                    )
                  }
                >
                  Add stock
                </Button>
              </div>
              {row.stocks.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No opening stock. Use Inventory adjust later if needed.
                </p>
              ) : (
                row.stocks.map((stock, stockIndex) => (
                  <div
                    key={stockIndex}
                    className="grid gap-2 rounded-lg border border-border bg-paper p-3 sm:grid-cols-4"
                  >
                    <FormField
                      label="Warehouse"
                      htmlFor={`w-${index}-${stockIndex}`}
                    >
                      <SelectNative
                        id={`w-${index}-${stockIndex}`}
                        value={stock.warehouse_id}
                        onChange={(e) =>
                          setVariants((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    stocks: r.stocks.map((s, si) =>
                                      si === stockIndex
                                        ? {
                                            ...s,
                                            warehouse_id: e.target.value,
                                          }
                                        : s,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      >
                        <option value="">Select</option>
                        {warehouseItems.map((w) => (
                          <option key={String(w.id)} value={String(w.id)}>
                            {String(w.name ?? w.id)}
                          </option>
                        ))}
                      </SelectNative>
                    </FormField>
                    <FormField
                      label="Quantity"
                      htmlFor={`q-${index}-${stockIndex}`}
                    >
                      <Input
                        id={`q-${index}-${stockIndex}`}
                        type="number"
                        min="0"
                        value={stock.quantity}
                        onChange={(e) =>
                          setVariants((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    stocks: r.stocks.map((s, si) =>
                                      si === stockIndex
                                        ? { ...s, quantity: e.target.value }
                                        : s,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </FormField>
                    <FormField
                      label="Reorder level"
                      htmlFor={`rl-${index}-${stockIndex}`}
                    >
                      <Input
                        id={`rl-${index}-${stockIndex}`}
                        type="number"
                        min="0"
                        value={stock.reorder_level}
                        onChange={(e) =>
                          setVariants((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    stocks: r.stocks.map((s, si) =>
                                      si === stockIndex
                                        ? {
                                            ...s,
                                            reorder_level: e.target.value,
                                          }
                                        : s,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </FormField>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setVariants((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    stocks: r.stocks.filter(
                                      (_, si) => si !== stockIndex,
                                    ),
                                  }
                                : r,
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {variants.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setVariants((rows) => rows.filter((_, i) => i !== index))
                }
              >
                Remove variant
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </Button>
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center rounded-full border border-olive/25 px-6 text-xs uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
