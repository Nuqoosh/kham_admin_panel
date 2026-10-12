"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationState } from "@/lib/hooks/use-api";
import { cn } from "@/lib/utils";

function pageWindow(current: number, last: number): Array<number | "…"> {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, last, current]);
  for (let i = current - 1; i <= current + 1; i += 1) {
    if (i >= 1 && i <= last) pages.add(i);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= last - 2) {
    pages.add(last - 1);
    pages.add(last - 2);
    pages.add(last - 3);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i]!;
    if (i > 0 && page - sorted[i - 1]! > 1) out.push("…");
    out.push(page);
  }
  return out;
}

export function TablePagination({
  pagination,
  onPageChange,
  className,
}: {
  pagination: PaginationState | null;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (!pagination || pagination.total === 0) return null;

  const { current_page, last_page, per_page, total } = pagination;
  const from = Math.min(total, (current_page - 1) * per_page + 1);
  const to = Math.min(total, current_page * per_page);
  const pages = pageWindow(current_page, last_page);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-paper px-4 py-3 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="tabular-nums text-ink">
          {from}–{to}
        </span>{" "}
        of <span className="tabular-nums text-ink">{total}</span>
      </p>

      {last_page > 1 ? (
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={current_page <= 1}
            onClick={() => onPageChange(current_page - 1)}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sand hover:text-ink disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </button>

          {pages.map((page, index) =>
            page === "…" ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex size-9 items-center justify-center text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                aria-label={`Page ${page}`}
                aria-current={page === current_page ? "page" : undefined}
                onClick={() => onPageChange(page)}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors",
                  page === current_page
                    ? "bg-olive text-cream"
                    : "text-muted-foreground hover:bg-sand hover:text-ink",
                )}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            aria-label="Next page"
            disabled={current_page >= last_page}
            onClick={() => onPageChange(current_page + 1)}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sand hover:text-ink disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
