"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ordersApi,
  type OrderStatus,
} from "@/lib/api";
import { getFormErrorMessage } from "@/lib/form";
import { useApi } from "@/lib/hooks/use-api";
import { BackLink, PageHeader } from "@/components/page-header";
import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectNative } from "@/components/ui/select-native";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, loading, error, reload } = useApi(() => ordersApi.get(id), [id]);
  const order = (data ?? null) as Record<string, unknown> | null;
  const items = Array.isArray(order?.items)
    ? (order.items as Record<string, unknown>[])
    : [];

  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function updateStatus() {
    if (!status) return;
    setSaving(true);
    setStatusError(null);
    try {
      await ordersApi.updateStatus(id, { status: status as OrderStatus });
      setStatus("");
      reload();
    } catch (err) {
      setStatusError(getFormErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href="/orders" label="Orders" />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {order ? (
        <>
          <PageHeader
            eyebrow="Commerce"
            title={`Order ${String(order.order_number ?? `#${order.id}`)}`}
            description={`Payment: ${String(order.payment_status ?? "—")}`}
            actions={
              <Badge variant="secondary" className="uppercase tracking-[0.12em]">
                {String(order.status)}
              </Badge>
            }
          />

          <div className="grid gap-3 rounded-xl bg-paper p-6 text-sm ring-1 ring-border sm:grid-cols-3">
            <p>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Total
              </span>
              <br />
              <span className="font-display text-2xl tabular-nums">
                {String(order.grand_total ?? "—")}
              </span>
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Market
              </span>
              <br />
              {String(
                (order.market as Record<string, unknown> | undefined)?.name ??
                  order.market_id ??
                  "—",
              )}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Warehouse
              </span>
              <br />
              {String(
                (order.warehouse as Record<string, unknown> | undefined)
                  ?.name ??
                  order.warehouse_id ??
                  "—",
              )}
            </p>
          </div>

          <div className="space-y-3 rounded-xl bg-paper p-6 ring-1 ring-border">
            <h2 className="font-display text-2xl">Update status</h2>
            <FormAlert error={statusError} />
            <div className="flex flex-wrap gap-3">
              <SelectNative
                value={status || String(order.status ?? "")}
                onChange={(e) => setStatus(e.target.value)}
                className="w-56"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </SelectNative>
              <Button type="button" onClick={updateStatus} disabled={saving}>
                {saving ? "Updating…" : "Save status"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-xl">Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No items.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, i) => (
                    <TableRow key={String(item.id ?? i)}>
                      <TableCell>
                        {String(item.variant_id ?? item.sku ?? "—")}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {String(item.quantity ?? "—")}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {String(item.unit_price ?? "—")}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {String(item.line_total ?? "—")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}
    </div>
  );
}
