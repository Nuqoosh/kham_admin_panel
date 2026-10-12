"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { catalogApi } from "@/lib/api";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { PageHeader } from "@/components/page-header";
import { TableActions } from "@/components/table-actions";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
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

const PER_PAGE = 20;

const ACTIVE_FILTERS: Array<{ value: ""; label: string } | { value: "true" | "false"; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

export default function BrandsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);

  const onDebouncedSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, isActive]);

  const { data, meta, loading, error, reload } = useApi(
    () =>
      catalogApi.brands({
        search: query || undefined,
        is_active: isActive === "" ? undefined : isActive === "true",
        per_page: PER_PAGE,
        page,
      }),
    [query, isActive, page],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Brands"
        description="Ateliers and labels linked to products."
        actions={
          <Link
            href="/brands/new"
            className="inline-flex h-11 items-center rounded-full border border-olive bg-olive px-6 text-xs uppercase tracking-[0.16em] text-cream hover:bg-olive-soft"
          >
            New brand
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            onDebouncedChange={onDebouncedSearch}
            placeholder="Search name, slug, origin"
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
            htmlFor="brand-active-filter"
            className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
          >
            Status
          </label>
          <SelectNative
            id="brand-active-filter"
            value={isActive}
            onChange={(e) =>
              setIsActive(e.target.value as "" | "true" | "false")
            }
            className="w-44 bg-paper"
          >
            {ACTIVE_FILTERS.map((filter) => (
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
            <TableHead>Origin</TableHead>
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
                No brands found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((b) => (
              <TableRow key={String(b.id)}>
                <TableCell className="font-medium">
                  {String(b.name ?? "—")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {String(b.slug ?? "—")}
                </TableCell>
                <TableCell>{String(b.origin_country ?? "—")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {b.is_active === false ? "Inactive" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TableActions
                    editHref={`/brands/${b.id}/edit`}
                    editLabel="Edit"
                    confirmMessage={`Delete brand "${String(b.name)}"?`}
                    onDelete={async () => {
                      await catalogApi.removeBrand(String(b.id));
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
