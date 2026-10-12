"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Archive, Pencil } from "lucide-react";
import { productsApi, type ProductStatus } from "@/lib/api";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { Badge } from "@/components/ui/badge";
import { SelectNative } from "@/components/ui/select-native";

const STATUS_FILTERS: Array<{ value: "" | ProductStatus; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const PER_PAGE = 20;

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | ProductStatus>("");
  const [page, setPage] = useState(1);
  const [archiveTarget, setArchiveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const onDebouncedSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  const { data, meta, loading, error, reload } = useApi(
    () =>
      productsApi.list({
        search: query || undefined,
        status: status || undefined,
        per_page: PER_PAGE,
        page,
      }),
    [query, status, page],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  async function onArchive() {
    if (!archiveTarget) return;
    await productsApi.patch(archiveTarget.id, { status: "archived" });
    reload();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Use the status filter to find archived products later."
        actions={
          <Link
            href="/products/new"
            className="inline-flex h-11 items-center rounded-full border border-olive bg-olive px-6 text-xs uppercase tracking-[0.16em] text-cream hover:bg-olive-soft"
          >
            New product
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            onDebouncedChange={onDebouncedSearch}
            placeholder="Search name or SKU"
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
            htmlFor="status-filter"
            className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
          >
            Status
          </label>
          <SelectNative
            id="status-filter"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "" | ProductStatus)
            }
            className="w-44 bg-paper"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.label} value={filter.value}>
                {filter.label}
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
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Variants</TableHead>
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
                {status === "archived"
                  ? "No archived products."
                  : "No products found."}
              </TableCell>
            </TableRow>
          ) : (
            items.map((p) => {
              const isArchived = String(p.status) === "archived";
              return (
                <TableRow key={String(p.id)}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/products/${p.id}`}
                      className="hover:underline"
                    >
                      {String(p.name ?? "—")}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {String(p.slug ?? "—")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="uppercase tracking-[0.12em]"
                    >
                      {String(p.status ?? "—")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(p.variants) ? p.variants.length : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/products/${p.id}/edit`}
                        aria-label="Edit"
                        title="Edit"
                        className="inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-ink"
                      >
                        <Pencil className="size-4" strokeWidth={1.5} />
                      </Link>
                      {!isArchived ? (
                        <button
                          type="button"
                          aria-label="Archive"
                          title="Archive"
                          className="inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
                          onClick={() =>
                            setArchiveTarget({
                              id: String(p.id),
                              name: String(p.name ?? "Product"),
                            })
                          }
                        >
                          <Archive className="size-4" strokeWidth={1.5} />
                        </button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <TablePagination pagination={pagination} onPageChange={setPage} />

      <ConfirmDialog
        open={archiveTarget != null}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title="Archive product?"
        description={`“${archiveTarget?.name ?? "This product"}” will be marked archived. Find it later under Products → Archived.`}
        confirmLabel="Archive"
        tone="danger"
        onConfirm={onArchive}
      />
    </div>
  );
}
