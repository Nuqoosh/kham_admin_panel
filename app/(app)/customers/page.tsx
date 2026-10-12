"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { customersApi } from "@/lib/api";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { PageHeader } from "@/components/page-header";
import { TableActions } from "@/components/table-actions";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PER_PAGE = 20;

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const onDebouncedSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const { data, meta, loading, error, reload } = useApi(
    () =>
      customersApi.list({
        search: query || undefined,
        per_page: PER_PAGE,
        page,
      }),
    [query, page],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        actions={
          <Link
            href="/customers/new"
            className="inline-flex h-11 items-center rounded-full border border-olive bg-olive px-6 text-xs uppercase tracking-[0.16em] text-cream hover:bg-olive-soft"
          >
            New customer
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          onDebouncedChange={onDebouncedSearch}
          placeholder="Search name, email, phone"
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

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-muted-foreground"
              >
                No customers found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((c) => (
              <TableRow key={String(c.id)}>
                <TableCell className="font-medium">
                  <Link
                    href={`/customers/${c.id}`}
                    className="hover:underline"
                  >
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                      "—"}
                  </Link>
                </TableCell>
                <TableCell>{String(c.email ?? "—")}</TableCell>
                <TableCell>{String(c.phone ?? "—")}</TableCell>
                <TableCell>{String(c.status ?? "—")}</TableCell>
                <TableCell>
                  <TableActions
                    editHref={`/customers/${c.id}/edit`}
                    confirmMessage={`Delete customer "${[c.first_name, c.last_name].filter(Boolean).join(" ")}"?`}
                    onDelete={async () => {
                      await customersApi.remove(String(c.id));
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
