"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  catalogApi,
  customersApi,
  ordersApi,
  productsApi,
  type OrderRequest,
} from "@/lib/api";
import {
  emptyToNull,
  getFieldErrors,
  getFormErrorMessage,
} from "@/lib/form";
import { unwrapList, useApi } from "@/lib/hooks/use-api";
import { BackLink, PageHeader } from "@/components/page-header";
import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectNative } from "@/components/ui/select-native";
import { COUNTRIES } from "@/lib/countries";

type Line = { variant_id: string; quantity: string };

export default function NewOrderPage() {
  const router = useRouter();
  const markets = useApi(() => catalogApi.markets(), []);
  const warehouses = useApi(() => catalogApi.warehouses(), []);
  const customers = useApi(() => customersApi.list({ per_page: 100 }), []);
  const products = useApi(
    () => productsApi.list({ status: "active", per_page: 200 }),
    [],
  );

  const marketItems = unwrapList(markets.data);
  const warehouseItems = unwrapList(warehouses.data);
  const customerItems = unwrapList(customers.data);
  const productItems = unwrapList(products.data);

  const [customerId, setCustomerId] = useState("");
  const [marketId, setMarketId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [shippingTotal, setShippingTotal] = useState("0");
  const [taxTotal, setTaxTotal] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { variant_id: "", quantity: "1" },
  ]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("Cairo");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("EG");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const warehousesForMarket = useMemo(() => {
    if (!marketId) return warehouseItems;
    return warehouseItems.filter(
      (w) => String(w.market_id ?? "") === String(marketId),
    );
  }, [warehouseItems, marketId]);

  const marketCountryCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const m of marketItems) {
      const code = String(m.country_code ?? "")
        .trim()
        .toUpperCase();
      if (code.length === 2) codes.add(code);
    }
    return codes;
  }, [marketItems]);

  const countryOptions = useMemo(() => {
    const known = new Map(COUNTRIES.map((c) => [c.code, c.name]));
    for (const code of marketCountryCodes) {
      if (!known.has(code)) known.set(code, code);
    }
    const all = Array.from(known.entries()).map(([code, name]) => ({
      code,
      name,
    }));
    const fromMarkets = all.filter((c) => marketCountryCodes.has(c.code));
    const rest = all
      .filter((c) => !marketCountryCodes.has(c.code))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [...fromMarkets, ...rest];
  }, [marketCountryCodes]);

  const variantOptions = useMemo(() => {
    if (!marketId || !warehouseId) return [];

    const rows: Array<{ id: number; label: string; available: number }> = [];
    for (const p of productItems) {
      if (String(p.status ?? "") === "archived") continue;
      const variants = Array.isArray(p.variants)
        ? (p.variants as Record<string, unknown>[])
        : [];
      for (const v of variants) {
        const id = Number(v.id);
        if (!Number.isFinite(id)) continue;
        if (v.is_active === false || v.is_active === 0) continue;

        const prices = Array.isArray(v.prices)
          ? (v.prices as Record<string, unknown>[])
          : [];
        const hasPrice = prices.some((price) => {
          if (String(price.market_id ?? "") !== String(marketId)) return false;
          if (price.is_active === false || price.is_active === 0) return false;
          return price.price != null && Number.isFinite(Number(price.price));
        });
        if (!hasPrice) continue;

        const stocks = Array.isArray(v.stocks)
          ? (v.stocks as Record<string, unknown>[])
          : [];
        const stock = stocks.find(
          (s) => String(s.warehouse_id ?? "") === String(warehouseId),
        );
        if (!stock) continue;

        const available =
          stock.available != null
            ? Number(stock.available)
            : Math.max(
                0,
                Number(stock.on_hand ?? 0) -
                  Number(stock.reserved ?? 0) -
                  Number(stock.damaged ?? 0),
              );
        if (!Number.isFinite(available) || available < 1) continue;

        rows.push({
          id,
          available,
          label: `${String(p.name)} · ${String(v.sku ?? id)} · ${available} avail`,
        });
      }
    }
    return rows;
  }, [productItems, marketId, warehouseId]);

  const selectableVariantKey = useMemo(
    () => variantOptions.map((v) => v.id).join(","),
    [variantOptions],
  );

  // Keep shipping country in sync with the selected market.
  useEffect(() => {
    if (!marketId) return;
    const market = marketItems.find((m) => String(m.id) === String(marketId));
    const code = String(market?.country_code ?? "")
      .trim()
      .toUpperCase();
    if (code.length === 2) setCountryCode(code);
  }, [marketId, marketItems]);

  // Drop warehouse if it doesn't belong to the selected market.
  useEffect(() => {
    if (!warehouseId) return;
    const stillValid = warehousesForMarket.some(
      (w) => String(w.id) === String(warehouseId),
    );
    if (!stillValid) setWarehouseId("");
  }, [marketId, warehouseId, warehousesForMarket]);

  // Clear line variants that are not stocked/priced for the current market+warehouse.
  useEffect(() => {
    const allowed = new Set(
      selectableVariantKey
        ? selectableVariantKey.split(",").filter(Boolean)
        : [],
    );
    setLines((rows) => {
      let changed = false;
      const next = rows.map((row) => {
        if (row.variant_id && !allowed.has(row.variant_id)) {
          changed = true;
          return { ...row, variant_id: "" };
        }
        return row;
      });
      return changed ? next : rows;
    });
  }, [selectableVariantKey]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const items = lines
      .map((l) => ({
        variant_id: Number(l.variant_id),
        quantity: Number(l.quantity),
      }))
      .filter((l) => l.variant_id && l.quantity > 0);

    const payload: OrderRequest = {
      customer_id: customerId ? Number(customerId) : null,
      market_id: Number(marketId),
      warehouse_id: Number(warehouseId),
      coupon_code: emptyToNull(couponCode),
      shipping_total: Number(shippingTotal || 0),
      tax_total: Number(taxTotal || 0),
      notes: emptyToNull(notes),
      items,
      shipping_address: {
        first_name: firstName.trim(),
        last_name: emptyToNull(lastName),
        phone: emptyToNull(phone),
        email: emptyToNull(email),
        line1: line1.trim(),
        line2: emptyToNull(line2),
        city: city.trim(),
        state: emptyToNull(state),
        postal_code: emptyToNull(postalCode),
        country_code: countryCode.trim().toUpperCase(),
      },
    };

    try {
      const res = await ordersApi.create(payload);
      const id = (res.data as { id?: number })?.id;
      router.push(id ? `/orders/${id}` : "/orders");
    } catch (err) {
      setError(getFormErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5">
      <BackLink href="/orders" label="Orders" />
      <PageHeader
        eyebrow="Commerce"
        title="New order"
        description="Reserves stock from the selected warehouse. Products need inventory (and a price) for that market/warehouse — Egypt works if stock was only added there."
      />
      <FormAlert error={error} fieldErrors={fieldErrors} />

      <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">Order</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Market" htmlFor="market">
            <SelectNative
              id="market"
              required
              value={marketId}
              onChange={(e) => setMarketId(e.target.value)}
            >
              <option value="">Select market</option>
              {marketItems.map((m) => (
                <option key={String(m.id)} value={String(m.id)}>
                  {String(m.name ?? m.code ?? m.id)}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField label="Warehouse" htmlFor="warehouse">
            <SelectNative
              id="warehouse"
              required
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">
                {marketId ? "Select warehouse" : "Select market first"}
              </option>
              {warehousesForMarket.map((w) => (
                <option key={String(w.id)} value={String(w.id)}>
                  {String(w.name ?? w.code ?? w.id)}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>

        <FormField label="Customer (optional)" htmlFor="customer">
          <SelectNative
            id="customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Guest / none</option>
            {customerItems.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {[c.first_name, c.last_name].filter(Boolean).join(" ")}{" "}
                {c.email ? `(${String(c.email)})` : ""}
              </option>
            ))}
          </SelectNative>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Coupon code" htmlFor="coupon">
            <Input
              id="coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
          </FormField>
          <FormField label="Shipping" htmlFor="shipping">
            <Input
              id="shipping"
              type="number"
              min="0"
              step="0.01"
              value={shippingTotal}
              onChange={(e) => setShippingTotal(e.target.value)}
            />
          </FormField>
          <FormField label="Tax" htmlFor="tax">
            <Input
              id="tax"
              type="number"
              min="0"
              step="0.01"
              value={taxTotal}
              onChange={(e) => setTaxTotal(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>
      </div>

      <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Items</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setLines((rows) => [...rows, { variant_id: "", quantity: "1" }])
            }
          >
            Add line
          </Button>
        </div>
        {lines.map((line, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
            <FormField label="Variant" htmlFor={`variant-${index}`}>
              <SelectNative
                id={`variant-${index}`}
                required
                value={line.variant_id}
                onChange={(e) =>
                  setLines((rows) =>
                    rows.map((r, i) =>
                      i === index ? { ...r, variant_id: e.target.value } : r,
                    ),
                  )
                }
              >
                <option value="">
                  {!marketId || !warehouseId
                    ? "Select market & warehouse first"
                    : variantOptions.length === 0
                      ? "No variants available here"
                      : "Select variant"}
                </option>
                {variantOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </SelectNative>
            </FormField>
            <FormField label="Qty" htmlFor={`qty-${index}`}>
              <Input
                id={`qty-${index}`}
                type="number"
                min="1"
                required
                value={line.quantity}
                onChange={(e) =>
                  setLines((rows) =>
                    rows.map((r, i) =>
                      i === index ? { ...r, quantity: e.target.value } : r,
                    ),
                  )
                }
              />
            </FormField>
            {lines.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-end"
                onClick={() =>
                  setLines((rows) => rows.filter((_, i) => i !== index))
                }
              >
                Remove
              </Button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">Shipping address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" htmlFor="ship_first">
            <Input
              id="ship_first"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </FormField>
          <FormField label="Last name" htmlFor="ship_last">
            <Input
              id="ship_last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Phone" htmlFor="ship_phone">
            <Input
              id="ship_phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>
          <FormField label="Email" htmlFor="ship_email">
            <Input
              id="ship_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Address line 1" htmlFor="line1">
          <Input
            id="line1"
            required
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
          />
        </FormField>
        <FormField label="Address line 2" htmlFor="line2">
          <Input
            id="line2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="City" htmlFor="city">
            <Input
              id="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </FormField>
          <FormField label="State" htmlFor="state">
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </FormField>
          <FormField label="Postal code" htmlFor="postal">
            <Input
              id="postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </FormField>
          <FormField label="Country" htmlFor="country">
            <SelectNative
              id="country"
              required
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              <option value="">Select country</option>
              {marketCountryCodes.size > 0 ? (
                <optgroup label="Your markets">
                  {countryOptions
                    .filter((c) => marketCountryCodes.has(c.code))
                    .map((c) => (
                      <option key={`market-${c.code}`} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                </optgroup>
              ) : null}
              <optgroup label="All countries">
                {(marketCountryCodes.size > 0
                  ? countryOptions.filter((c) => !marketCountryCodes.has(c.code))
                  : countryOptions
                ).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </optgroup>
            </SelectNative>
          </FormField>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create order"}
        </Button>
        <Link
          href="/orders"
          className="inline-flex h-11 items-center rounded-full border border-olive/25 px-6 text-xs uppercase tracking-[0.16em] hover:bg-sand"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
