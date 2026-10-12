"use client";

import { useMemo, useState } from "react";
import { catalogApi, pricingApi } from "@/lib/api";
import { emptyToNull, getFieldErrors, getFormErrorMessage } from "@/lib/form";
import { unwrapList, useApi } from "@/lib/hooks/use-api";
import { PageHeader } from "@/components/page-header";
import { FormAlert } from "@/components/form-alert";
import {
  useVariantSearch,
  VariantSearchField,
} from "@/components/variant-search";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";

function toApiDateTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export default function PricingPage() {
  const markets = useApi(() => catalogApi.markets(), []);
  const currencies = useApi(() => catalogApi.currencies(), []);
  const marketItems = unwrapList(markets.data);
  const currencyItems = unwrapList(currencies.data);

  const variantSearch = useVariantSearch();

  const [marketId, setMarketId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Record<string, unknown> | null>(
    null,
  );

  const selectedMarket = useMemo(
    () => marketItems.find((m) => String(m.id) === marketId) ?? null,
    [marketItems, marketId],
  );

  function onMarketChange(next: string) {
    setMarketId(next);
    const market = marketItems.find((m) => String(m.id) === next);
    const marketCurrency =
      market?.currency && typeof market.currency === "object"
        ? (market.currency as Record<string, unknown>)
        : null;
    const inferred =
      marketCurrency?.id != null
        ? String(marketCurrency.id)
        : market?.currency_id != null
          ? String(market.currency_id)
          : "";
    if (inferred) setCurrencyId(inferred);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!variantSearch.variantId) {
      setFormError("Please select a variant.");
      return;
    }
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    setSuccess(null);
    try {
      const res = await pricingApi.upsert({
        variant_id: Number(variantSearch.variantId),
        market_id: Number(marketId),
        currency_id: Number(currencyId),
        price: Number(price),
        compare_at_price: emptyToNull(compareAt)
          ? Number(compareAt)
          : null,
        starts_at: toApiDateTime(startsAt),
        ends_at: toApiDateTime(endsAt),
        is_active: isActive,
      });
      setLastSaved((res.data as Record<string, unknown>) ?? null);
      setSuccess("Market price saved.");
    } catch (err) {
      setFormError(getFormErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Pricing"
        description="Set or update a product variant’s market price via POST /prices/upsert."
        actions={
          <Button
            type="button"
            variant="outline"
            className="bg-paper"
            onClick={() => {
              markets.reload();
              currencies.reload();
            }}
          >
            Refresh catalogs
          </Button>
        }
      />

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl bg-paper p-6 ring-1 ring-border"
      >
        <div>
          <h2 className="font-display text-2xl">Upsert market price</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Prices are unique per variant + market. Saving again updates the
            existing row.
          </p>
        </div>

        <FormAlert error={formError} fieldErrors={fieldErrors} />
        {success ? <p className="text-sm text-olive">{success}</p> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <VariantSearchField
              required
              variantId={variantSearch.variantId}
              options={variantSearch.options}
              searching={variantSearch.searching}
              onSearch={variantSearch.loadVariants}
              onChange={variantSearch.setVariantId}
            />
          </div>

          <FormField
            label="Market"
            htmlFor="market"
            error={fieldErrors.market_id}
          >
            <SelectNative
              id="market"
              required
              value={marketId}
              onChange={(e) => onMarketChange(e.target.value)}
            >
              <option value="">Select market</option>
              {marketItems.map((m) => (
                <option key={String(m.id)} value={String(m.id)}>
                  {String(m.name ?? m.code ?? m.id)}
                </option>
              ))}
            </SelectNative>
          </FormField>

          <FormField
            label="Currency"
            htmlFor="currency"
            error={fieldErrors.currency_id}
            description={
              selectedMarket
                ? "Defaults from the selected market; change if needed."
                : undefined
            }
          >
            <SelectNative
              id="currency"
              required
              value={currencyId}
              onChange={(e) => setCurrencyId(e.target.value)}
            >
              <option value="">Select currency</option>
              {currencyItems.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {String(c.code ?? c.name ?? c.id)}
                  {c.name ? ` — ${String(c.name)}` : ""}
                </option>
              ))}
            </SelectNative>
          </FormField>

          <FormField label="Price" htmlFor="price" error={fieldErrors.price}>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </FormField>

          <FormField
            label="Compare at"
            htmlFor="compare_at"
            error={fieldErrors.compare_at_price}
            description="Optional. Must be greater than or equal to price."
          >
            <Input
              id="compare_at"
              type="number"
              min="0"
              step="0.01"
              value={compareAt}
              onChange={(e) => setCompareAt(e.target.value)}
              placeholder="Optional"
            />
          </FormField>

          <FormField
            label="Starts at"
            htmlFor="starts_at"
            error={fieldErrors.starts_at}
          >
            <Input
              id="starts_at"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </FormField>

          <FormField
            label="Ends at"
            htmlFor="ends_at"
            error={fieldErrors.ends_at}
          >
            <Input
              id="ends_at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </FormField>

          <FormField label="Status" htmlFor="is_active">
            <label className="flex h-11 cursor-pointer items-center gap-3 rounded-full border border-border bg-paper px-4 text-sm">
              <input
                id="is_active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 accent-olive"
              />
              Active price
            </label>
          </FormField>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save market price"}
        </Button>
      </form>

      {lastSaved ? (
        <div className="rounded-xl bg-paper p-6 ring-1 ring-border">
          <h2 className="font-display text-2xl">Last saved</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Price ID
              </dt>
              <dd className="mt-1 tabular-nums">{String(lastSaved.id ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Price
              </dt>
              <dd className="mt-1 tabular-nums">
                {String(lastSaved.price ?? "—")}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Market
              </dt>
              <dd className="mt-1">
                {String(
                  (lastSaved.market as Record<string, unknown> | undefined)
                    ?.name ??
                    lastSaved.market_id ??
                    "—",
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Variant
              </dt>
              <dd className="mt-1">
                {String(
                  (
                    (lastSaved.variant as Record<string, unknown> | undefined)
                      ?.sku
                  ) ??
                    lastSaved.variant_id ??
                    "—",
                )}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
