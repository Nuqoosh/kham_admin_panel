"use client";

import { useState } from "react";
import { catalogApi, taxApi } from "@/lib/api";
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

export default function TaxPage() {
  const markets = useApi(() => catalogApi.markets(), []);
  const marketItems = unwrapList(markets.data);
  const { data, loading, error: loadError, reload } = useApi(
    () => taxApi.list(),
    [],
  );
  const items = unwrapList(data);

  const [marketId, setMarketId] = useState("");
  const [rate, setRate] = useState("");
  const [method, setMethod] = useState<"exclusive" | "inclusive">("exclusive");
  const [taxShipping, setTaxShipping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [approveBusy, setApproveBusy] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      await taxApi.upsert(marketId, {
        rate_percent: Number(rate),
        calculation_method: method,
        tax_shipping: taxShipping,
      });
      reload();
    } catch (err) {
      setError(getFormErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setBusy(false);
    }
  }

  async function onApprove(id: string) {
    setApproveBusy(id);
    setError(null);
    try {
      await taxApi.approve(id, { confirm: true });
      reload();
    } catch (err) {
      setError(getFormErrorMessage(err));
    } finally {
      setApproveBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Market tax"
        description="Saving a changed policy clears approval until tax.approve confirms it."
        actions={
          <Button type="button" variant="outline" className="bg-paper" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <form onSubmit={onSave} className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">Upsert tax rule</h2>
        <FormAlert error={error} fieldErrors={fieldErrors} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Market
            <SelectNative className="mt-2" required value={marketId} onChange={(e) => setMarketId(e.target.value)}>
              <option value="">Select market</option>
              {marketItems.map((m) => (
                <option key={String(m.id)} value={String(m.id)}>
                  {String(m.name ?? m.code ?? m.id)}
                </option>
              ))}
            </SelectNative>
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Rate %
            <Input className="mt-2" required type="number" min={0} max={100} step="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Method
            <SelectNative className="mt-2" value={method} onChange={(e) => setMethod(e.target.value as "exclusive" | "inclusive")}>
              <option value="exclusive">exclusive</option>
              <option value="inclusive">inclusive</option>
            </SelectNative>
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" checked={taxShipping} onChange={(e) => setTaxShipping(e.target.checked)} />
            Tax shipping
          </label>
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save tax rule"}</Button>
      </form>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Market</TableHead>
            <TableHead>Rate %</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Tax shipping</TableHead>
            <TableHead>Approved</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No tax rules.</TableCell>
            </TableRow>
          ) : (
            items.map((row) => {
              const market = row.market as Record<string, unknown> | undefined;
              const mid = String(row.market_id ?? market?.id ?? "");
              return (
                <TableRow key={String(row.id ?? mid)}>
                  <TableCell>{String((market?.name ?? mid) || "—")}</TableCell>
                  <TableCell className="tabular-nums">{String(row.rate_percent ?? "—")}</TableCell>
                  <TableCell>{String(row.calculation_method ?? "—")}</TableCell>
                  <TableCell>{row.tax_shipping ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {row.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!mid || Boolean(row.is_approved) || approveBusy === mid}
                      onClick={() => void onApprove(mid)}
                    >
                      {approveBusy === mid ? "Approving…" : "Approve"}
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
