"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ordersApi } from "@/lib/api";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { PageHeader } from "@/components/page-header";
import { TableActions } from "@/components/table-actions";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { SelectNative } from "@/components/ui/select-native";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const PER_PAGE = 25;

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const onDebouncedSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  const { data, meta, loading, error, reload } = useApi(
    () =>
      ordersApi.list({
        search: query || undefined,
        status: status || undefined,
        per_page: PER_PAGE,
        page,
      }),
    [query, status, page],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Orders"
        actions={
          <Link
            href="/orders/new"
            className="inline-flex h-11 items-center rounded-full border border-olive bg-olive px-6 text-xs uppercase tracking-[0.16em] text-cream hover:bg-olive-soft"
          >
            New order
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            onDebouncedChange={onDebouncedSearch}
            placeholder="Search order number"
            className="w-72 max-w-full"
          />
          <Button
            type="button"
            variant="outline"
            className="bg-paper"
            onClick={reload}
          >
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="order-status-filter"
            className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
          >
            Status
          </label>
          <SelectNative
            id="order-status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-44 bg-paper"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectNative>
        </div>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Placed</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-muted-foreground"
              >
                No orders found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((o) => {
              const canCancel =
                o.status !== "cancelled" && o.status !== "delivered";
              return (
                <TableRow key={String(o.id)}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/orders/${o.id}`}
                      className="hover:underline"
                    >
                      {String(o.order_number ?? `#${o.id}`)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="uppercase tracking-[0.12em]"
                    >
                      {String(o.status ?? "—")}
                    </Badge>
                  </TableCell>
                  <TableCell>{String(o.payment_status ?? "—")}</TableCell>
                  <TableCell className="tabular-nums">
                    {String(o.grand_total ?? o.total ?? "—")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.placed_at
                      ? new Date(String(o.placed_at)).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <TableActions
                      editHref={`/orders/${o.id}`}
                      editLabel="View"
                      deleteLabel="Cancel"
                      confirmMessage={`Cancel order ${String(o.order_number ?? o.id)}?`}
                      onDelete={
                        canCancel
                          ? async () => {
                              await ordersApi.updateStatus(String(o.id), {
                                status: "cancelled",
                              });
                              reload();
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <TablePagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
