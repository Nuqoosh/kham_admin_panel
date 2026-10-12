"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { catalogApi, inventoryApi } from "@/lib/api";
import { getFieldErrors, getFormErrorMessage } from "@/lib/form";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { PageHeader } from "@/components/page-header";
import { FormAlert } from "@/components/form-alert";
import { TablePagination } from "@/components/table-pagination";
import {
  useVariantSearch,
  VariantSearchField,
} from "@/components/variant-search";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const MOVEMENT_TYPES = [
  "purchase",
  "sale",
  "return",
  "adjustment",
  "transfer_in",
  "transfer_out",
  "damage",
  "reservation",
  "release",
] as const;

type Tab = "stocks" | "movements";

const PER_PAGE = 50;

function formatWhen(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>("stocks");
  const [lowStock, setLowStock] = useState(false);
  const [stockPage, setStockPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);

  useEffect(() => {
    setStockPage(1);
  }, [lowStock]);

  const stocks = useApi(
    () =>
      inventoryApi.list({
        low_stock: lowStock || undefined,
        per_page: PER_PAGE,
        page: stockPage,
      }),
    [lowStock, stockPage],
  );
  const stockItems = unwrapList(stocks.data);
  const stockPagination = parsePagination(stocks.meta, stocks.data, PER_PAGE);

  const warehouses = useApi(() => catalogApi.warehouses(), []);
  const warehouseItems = unwrapList(warehouses.data);

  const [movementWarehouseId, setMovementWarehouseId] = useState("");
  const [movementType, setMovementType] = useState("");
  const [movementVariantId, setMovementVariantId] = useState("");

  useEffect(() => {
    setMovementPage(1);
  }, [movementWarehouseId, movementType, movementVariantId]);

  const movements = useApi(
    () =>
      inventoryApi.movements({
        warehouse_id: movementWarehouseId
          ? Number(movementWarehouseId)
          : undefined,
        type: movementType || undefined,
        variant_id: movementVariantId ? Number(movementVariantId) : undefined,
        per_page: PER_PAGE,
        page: movementPage,
      }),
    [movementWarehouseId, movementType, movementVariantId, movementPage],
  );
  const movementItems = unwrapList(movements.data);
  const movementPagination = parsePagination(
    movements.meta,
    movements.data,
    PER_PAGE,
  );

  const variantSearch = useVariantSearch();
  const [warehouseId, setWarehouseId] = useState("");
  const [delta, setDelta] = useState("1");
  const [reason, setReason] = useState("Manual adjustment");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  async function onAdjust(e: React.FormEvent) {
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
      await inventoryApi.adjust({
        variant_id: Number(variantSearch.variantId),
        warehouse_id: Number(warehouseId),
        quantity_delta: Number(delta),
        reason: reason.trim(),
      });
      setSuccess("Inventory adjusted.");
      setDelta("1");
      stocks.reload();
      movements.reload();
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
        eyebrow="Stock"
        title="Inventory"
        description="On-hand balances, adjustments, and the full movement ledger."
        actions={
          <>
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-full border border-olive/25 bg-paper px-6 text-xs uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand"
            >
              Pricing
            </Link>
            {tab === "stocks" ? (
              <Button
                type="button"
                variant={lowStock ? "default" : "outline"}
                onClick={() => setLowStock((v) => !v)}
              >
                {lowStock ? "Showing low stock" : "Low stock only"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="bg-paper"
              onClick={() => {
                stocks.reload();
                movements.reload();
              }}
            >
              Refresh
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["stocks", "Stock levels"],
            ["movements", "Movement ledger"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors",
              tab === key
                ? "bg-olive text-cream"
                : "bg-paper text-muted-foreground ring-1 ring-border hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stocks" ? (
        <>
          <form
            onSubmit={onAdjust}
            className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border"
          >
            <h2 className="font-display text-2xl">Adjust stock</h2>
            <p className="text-sm text-muted-foreground">
              Search by product name or SKU, then choose the variant and
              warehouse.
            </p>
            <FormAlert error={formError} fieldErrors={fieldErrors} />
            {success ? <p className="text-sm text-olive">{success}</p> : null}
            <div className="grid gap-4 lg:grid-cols-4">
              <VariantSearchField
                required
                variantId={variantSearch.variantId}
                options={variantSearch.options}
                searching={variantSearch.searching}
                onSearch={variantSearch.loadVariants}
                onChange={variantSearch.setVariantId}
              />
              <FormField label="Warehouse" htmlFor="warehouse">
                <SelectNative
                  id="warehouse"
                  required
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                >
                  <option value="">Select warehouse</option>
                  {warehouseItems.map((w) => (
                    <option key={String(w.id)} value={String(w.id)}>
                      {String(w.name ?? w.id)}
                    </option>
                  ))}
                </SelectNative>
              </FormField>
              <FormField label="Quantity delta" htmlFor="delta">
                <Input
                  id="delta"
                  type="number"
                  required
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                />
              </FormField>
              <FormField label="Reason" htmlFor="reason">
                <Input
                  id="reason"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </FormField>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Adjusting…" : "Adjust inventory"}
            </Button>
          </form>

          {stocks.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {stocks.error ? (
            <p className="text-sm text-destructive">{stocks.error}</p>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>On hand</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockItems.length === 0 && !stocks.loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No inventory rows.
                  </TableCell>
                </TableRow>
              ) : (
                stockItems.map((row) => {
                  const onHand = Number(row.on_hand ?? 0);
                  const reserved = Number(row.reserved ?? 0);
                  const damaged = Number(row.damaged ?? 0);
                  const variant = row.variant as
                    | Record<string, unknown>
                    | undefined;
                  const warehouse = row.warehouse as
                    | Record<string, unknown>
                    | undefined;
                  return (
                    <TableRow key={String(row.id)}>
                      <TableCell className="font-medium">
                        {String(variant?.sku ?? row.variant_id ?? "—")}
                      </TableCell>
                      <TableCell>
                        {String(warehouse?.name ?? row.warehouse_id ?? "—")}
                      </TableCell>
                      <TableCell className="tabular-nums">{onHand}</TableCell>
                      <TableCell className="tabular-nums">{reserved}</TableCell>
                      <TableCell className="tabular-nums">
                        {onHand - reserved - damaged}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <TablePagination
            pagination={stockPagination}
            onPageChange={setStockPage}
          />
        </>
      ) : (
        <>
          <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
            <div>
              <h2 className="font-display text-2xl">Filters</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Narrow the ledger by warehouse, movement type, or variant ID.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Warehouse" htmlFor="m-warehouse">
                <SelectNative
                  id="m-warehouse"
                  value={movementWarehouseId}
                  onChange={(e) => setMovementWarehouseId(e.target.value)}
                >
                  <option value="">All warehouses</option>
                  {warehouseItems.map((w) => (
                    <option key={String(w.id)} value={String(w.id)}>
                      {String(w.name ?? w.id)}
                    </option>
                  ))}
                </SelectNative>
              </FormField>
              <FormField label="Type" htmlFor="m-type">
                <SelectNative
                  id="m-type"
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                >
                  <option value="">All types</option>
                  {MOVEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll("_", " ")}
                    </option>
                  ))}
                </SelectNative>
              </FormField>
              <FormField label="Variant ID" htmlFor="m-variant">
                <Input
                  id="m-variant"
                  type="number"
                  min="1"
                  value={movementVariantId}
                  onChange={(e) => setMovementVariantId(e.target.value)}
                  placeholder="Optional"
                />
              </FormField>
            </div>
          </div>

          {movements.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {movements.error ? (
            <p className="text-sm text-destructive">{movements.error}</p>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movementItems.length === 0 && !movements.loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No movements found.
                  </TableCell>
                </TableRow>
              ) : (
                movementItems.map((row) => {
                  const variant = row.variant as
                    | Record<string, unknown>
                    | undefined;
                  const warehouse = row.warehouse as
                    | Record<string, unknown>
                    | undefined;
                  const qty = Number(row.quantity ?? 0);
                  const type = String(row.type ?? "—");
                  return (
                    <TableRow key={String(row.id)}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatWhen(row.created_at)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-sand px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-ink/80">
                          {type.replaceAll("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {String(variant?.sku ?? row.variant_id ?? "—")}
                      </TableCell>
                      <TableCell>
                        {String(warehouse?.name ?? row.warehouse_id ?? "—")}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "tabular-nums font-medium",
                          qty > 0
                            ? "text-olive"
                            : qty < 0
                              ? "text-destructive"
                              : "",
                        )}
                      >
                        {qty > 0 ? `+${qty}` : qty}
                      </TableCell>
                      <TableCell className="max-w-[16rem] truncate text-sm text-muted-foreground">
                        {String(row.note ?? "—")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.reference_type
                          ? `${String(row.reference_type)} #${String(row.reference_id ?? "—")}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <TablePagination
            pagination={movementPagination}
            onPageChange={setMovementPage}
          />
        </>
      )}
    </div>
  );
}
