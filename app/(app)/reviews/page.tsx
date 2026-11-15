"use client";

import { useState } from "react";
import { reviewsApi, type ProductReviewStatus } from "@/lib/api";
import { getFormErrorMessage } from "@/lib/form";
import { unwrapList, useApi } from "@/lib/hooks/use-api";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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

export default function ReviewsPage() {
  const [status, setStatus] = useState<"" | ProductReviewStatus>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, error: loadError, reload } = useApi(
    () =>
      reviewsApi.list({
        status: status || undefined,
      }),
    [status],
  );
  const items = unwrapList(data);

  async function moderate(id: string, next: "approved" | "rejected") {
    setBusyId(id);
    setError(null);
    try {
      await reviewsApi.moderate(id, { status: next });
      reload();
    } catch (err) {
      setError(getFormErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CMS"
        title="Reviews"
        description="Moderate product reviews from delivered orders."
        actions={
          <Button type="button" variant="outline" className="bg-paper" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Status
        </label>
        <SelectNative
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | ProductReviewStatus)}
          className="w-48"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </SelectNative>
      </div>

      <FormAlert error={error} />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Reviewer</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                No reviews.
              </TableCell>
            </TableRow>
          ) : (
            items.map((row) => {
              const product = row.product as Record<string, unknown> | undefined;
              const id = String(row.id);
              return (
                <TableRow key={id}>
                  <TableCell>
                    {String(product?.name ?? row.product_id ?? "—")}
                  </TableCell>
                  <TableCell className="tabular-nums">{String(row.rating ?? "—")}</TableCell>
                  <TableCell>{String(row.reviewer_name ?? "—")}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{String(row.title ?? "—")}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {String(row.body ?? "")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{String(row.status ?? "—")}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyId === id || row.status === "approved"}
                        onClick={() => void moderate(id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === id || row.status === "rejected"}
                        onClick={() => void moderate(id, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
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
