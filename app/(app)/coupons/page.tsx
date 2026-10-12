"use client";

import { useState } from "react";
import Link from "next/link";
import { couponsApi } from "@/lib/api";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { PageHeader } from "@/components/page-header";
import { TableActions } from "@/components/table-actions";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PER_PAGE = 30;

export default function CouponsPage() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useApi(
    () => couponsApi.list({ per_page: PER_PAGE, page }),
    [page],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotions"
        title="Coupons"
        actions={
          <>
            <Link
              href="/coupons/new"
              className="inline-flex h-11 items-center rounded-full border border-olive bg-olive px-6 text-xs uppercase tracking-[0.16em] text-cream hover:bg-olive-soft"
            >
              New coupon
            </Link>
            <Button
              type="button"
              variant="outline"
              className="bg-paper"
              onClick={reload}
            >
              Refresh
            </Button>
          </>
        }
      />

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Active</TableHead>
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
                No coupons yet.
              </TableCell>
            </TableRow>
          ) : (
            items.map((c) => (
              <TableRow key={String(c.id)}>
                <TableCell className="font-medium uppercase tracking-[0.08em]">
                  {String(c.code ?? "—")}
                </TableCell>
                <TableCell>{String(c.name ?? "—")}</TableCell>
                <TableCell>{String(c.type ?? "—")}</TableCell>
                <TableCell className="tabular-nums">
                  {String(c.value ?? "—")}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TableActions
                    editHref={`/coupons/${c.id}/edit`}
                    confirmMessage={`Delete coupon "${String(c.code)}"?`}
                    onDelete={async () => {
                      await couponsApi.remove(String(c.id));
                      reload();
                    }}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
