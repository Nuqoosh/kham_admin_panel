"use client";

import { useState } from "react";
import { catalogApi, shippingApi } from "@/lib/api";
import { getFieldErrors, getFormErrorMessage } from "@/lib/form";
import { unwrapList, useApi } from "@/lib/hooks/use-api";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
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

export default function ShippingPage() {
  const markets = useApi(() => catalogApi.markets(), []);
  const marketItems = unwrapList(markets.data);
  const [marketId, setMarketId] = useState("");
  const [city, setCity] = useState("");
  const [fee, setFee] = useState("");
  const [threshold, setThreshold] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data, loading, error: loadError, reload } = useApi(
    () =>
      shippingApi.list({
        market_id: marketId ? Number(marketId) : undefined,
      }),
    [marketId],
  );
  const items = unwrapList(data);

  function resetCreate() {
    setEditingId(null);
    setCity("");
    setFee("");
    setThreshold("");
    setIsActive(true);
    setError(null);
    setFieldErrors({});
  }

  function startEdit(row: Record<string, unknown>) {
    setEditingId(String(row.id));
    setFee(String(row.shipping_fee ?? ""));
    setThreshold(
      row.free_shipping_threshold == null
        ? ""
        : String(row.free_shipping_threshold),
    );
    setIsActive(row.is_active !== false);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      if (editingId) {
        await shippingApi.update(editingId, {
          shipping_fee: Number(fee),
          free_shipping_threshold:
            threshold.trim() === "" ? null : Number(threshold),
          is_active: isActive,
        });
      } else {
        await shippingApi.create({
          market_id: Number(marketId),
          city: city.trim(),
          shipping_fee: Number(fee),
          free_shipping_threshold:
            threshold.trim() === "" ? null : Number(threshold),
          is_active: isActive,
        });
      }
      resetCreate();
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
        eyebrow="Settings"
        title="Shipping rules"
        description="Per-market city fees. Use city * for a market default."
        actions={
          <Button type="button" variant="outline" className="bg-paper" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">
          {editingId ? `Edit rule #${editingId}` : "New shipping rule"}
        </h2>
        <FormAlert error={error} fieldErrors={fieldErrors} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!editingId ? (
            <>
              <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Market
                <SelectNative
                  className="mt-2"
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
              </label>
              <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                City
                <Input
                  className="mt-2"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cairo or *"
                />
              </label>
            </>
          ) : (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Market and city cannot be changed after create.
            </p>
          )}
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Shipping fee
            <Input className="mt-2" required type="number" min={0} step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Free shipping threshold
            <Input className="mt-2" type="number" min={0} step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : editingId ? "Update" : "Create"}</Button>
          {editingId ? <Button type="button" variant="outline" onClick={resetCreate}>Cancel</Button> : null}
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Filter market</label>
        <SelectNative className="w-56" value={marketId} onChange={(e) => setMarketId(e.target.value)}>
          <option value="">All markets</option>
          {marketItems.map((m) => (
            <option key={String(m.id)} value={String(m.id)}>
              {String(m.name ?? m.code ?? m.id)}
            </option>
          ))}
        </SelectNative>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Market</TableHead>
            <TableHead>City key</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Free from</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No shipping rules.</TableCell>
            </TableRow>
          ) : (
            items.map((row) => {
              const market = row.market as Record<string, unknown> | undefined;
              return (
                <TableRow key={String(row.id)}>
                  <TableCell>{String(market?.name ?? row.market_id ?? "—")}</TableCell>
                  <TableCell className="font-medium">{String(row.city_key ?? "—")}</TableCell>
                  <TableCell className="tabular-nums">{String(row.shipping_fee ?? "—")}</TableCell>
                  <TableCell className="tabular-nums">{String(row.free_shipping_threshold ?? "—")}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button type="button" size="sm" variant="outline" onClick={() => startEdit(row)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
