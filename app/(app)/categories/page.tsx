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

function categoryDepth(row: Record<string, unknown>): number {
  if (row.parent_id == null) return 0;
  const parent =
    row.parent && typeof row.parent === "object"
      ? (row.parent as Record<string, unknown>)
      : null;
  if (!parent) return 1;
  return parent.parent_id != null ? 2 : 1;
}

export default function CategoriesPage() {
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
      catalogApi.categories({
        paginate: true,
        search: query || undefined,
        is_active: isActive === "" ? undefined : isActive === "true",
        page,
        per_page: PER_PAGE,
      }),
    [query, isActive, page],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Product taxonomy used across the storefront and admin."
        actions={
          <Link
            href="/categories/new"
            className="inline-flex h-11 items-center rounded-full border border-olive bg-olive px-6 text-xs uppercase tracking-[0.16em] text-cream hover:bg-olive-soft"
          >
            New category
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            onDebouncedChange={onDebouncedSearch}
            placeholder="Search name or slug"
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
            htmlFor="category-active-filter"
            className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
          >
            Status
          </label>
          <SelectNative
            id="category-active-filter"
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
            <TableHead>Parent</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Status</TableHead>
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
                No categories found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((c) => {
              const depth = categoryDepth(c);
              const parent =
                c.parent && typeof c.parent === "object"
                  ? (c.parent as Record<string, unknown>)
                  : null;
              return (
                <TableRow key={String(c.id)}>
                  <TableCell className="font-medium">
                    <span
                      style={{ paddingInlineStart: `${depth * 1.25}rem` }}
                      className="inline-block"
                    >
                      {depth > 0 ? "↳ " : ""}
                      {String(c.name ?? "—")}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {String(parent?.name ?? "—")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {String(c.slug ?? "—")}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {String(c.sort_order ?? "—")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {c.is_active === false ? "Inactive" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TableActions
                      editHref={`/categories/${c.id}/edit`}
                      editLabel="Edit"
                      confirmMessage={`Delete category "${String(c.name)}"?`}
                      onDelete={async () => {
                        await catalogApi.removeCategory(String(c.id));
                        reload();
                      }}
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
