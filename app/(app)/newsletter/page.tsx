"use client";

import { useState } from "react";
import {
  newsletterApi,
  type NewsletterSubscriberStatus,
} from "@/lib/api";
import { getFormErrorMessage } from "@/lib/form";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
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

export default function NewsletterPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | NewsletterSubscriberStatus>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, meta, loading, error: loadError, reload } = useApi(
    () =>
      newsletterApi.list({
        page,
        per_page: PER_PAGE,
        search: query || undefined,
        status: status || undefined,
      }),
    [page, query, status],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  async function setSubscriberStatus(
    id: string,
    next: NewsletterSubscriberStatus,
  ) {
    setBusyId(id);
    setError(null);
    try {
      await newsletterApi.update(id, { status: next });
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
        eyebrow="CRM"
        title="Newsletter"
        description="Manage storefront newsletter subscribers."
        actions={
          <Button type="button" variant="outline" className="bg-paper" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          onDebouncedChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search email"
          className="w-72 max-w-full"
        />
        <SelectNative
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | NewsletterSubscriberStatus);
            setPage(1);
          }}
          className="w-48"
        >
          <option value="">All statuses</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </SelectNative>
      </div>

      <FormAlert error={error} />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Subscribed</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                No subscribers.
              </TableCell>
            </TableRow>
          ) : (
            items.map((row) => {
              const id = String(row.id);
              const current = String(row.status ?? "");
              return (
                <TableRow key={id}>
                  <TableCell className="font-medium">{String(row.email ?? "—")}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{current || "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {String(row.subscribed_at ?? "—")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyId === id || current === "subscribed"}
                        onClick={() => void setSubscriberStatus(id, "subscribed")}
                      >
                        Subscribe
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === id || current === "unsubscribed"}
                        onClick={() => void setSubscriberStatus(id, "unsubscribed")}
                      >
                        Unsubscribe
                      </Button>
                    </div>
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
