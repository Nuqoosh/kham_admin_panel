"use client";

import { useState } from "react";
import {
  partnersApi,
  type PartnerApplicationStatus,
} from "@/lib/api";
import { getFormErrorMessage } from "@/lib/form";
import { parsePagination, unwrapList, useApi } from "@/lib/hooks/use-api";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
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
const STATUSES: PartnerApplicationStatus[] = [
  "pending",
  "in_review",
  "approved",
  "rejected",
];

export default function PartnersPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"" | PartnerApplicationStatus>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<PartnerApplicationStatus>("pending");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, meta, loading, error: loadError, reload } = useApi(
    () =>
      partnersApi.list({
        page,
        per_page: PER_PAGE,
        status: filter || undefined,
      }),
    [page, filter],
  );
  const items = unwrapList(data);
  const pagination = parsePagination(meta, data, PER_PAGE);

  function openRow(row: Record<string, unknown>) {
    setSelectedId(String(row.id));
    setStatus((String(row.status ?? "pending") as PartnerApplicationStatus) || "pending");
    setNotes(String(row.internal_notes ?? ""));
    setError(null);
  }

  async function save() {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      await partnersApi.update(selectedId, {
        status,
        internal_notes: notes.trim() || null,
      });
      setSelectedId(null);
      reload();
    } catch (err) {
      setError(getFormErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Partner applications"
        description="Review storefront partner applications."
        actions={
          <Button type="button" variant="outline" className="bg-paper" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Status</label>
        <SelectNative
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as "" | PartnerApplicationStatus);
            setPage(1);
          }}
          className="w-48"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </SelectNative>
      </div>

      {selectedId ? (
        <div className="space-y-3 rounded-xl bg-paper p-6 ring-1 ring-border">
          <h2 className="font-display text-2xl">Update application #{selectedId}</h2>
          <FormAlert error={error} />
          <label className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Status
            <SelectNative className="mt-2 w-56" value={status} onChange={(e) => setStatus(e.target.value as PartnerApplicationStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectNative>
          </label>
          <label className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Internal notes
            <Textarea className="mt-2 min-h-24 rounded-xl" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <Button type="button" onClick={() => void save()} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setSelectedId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                No applications.
              </TableCell>
            </TableRow>
          ) : (
            items.map((row) => (
              <TableRow key={String(row.id)}>
                <TableCell className="font-medium">{String(row.company_name ?? "—")}</TableCell>
                <TableCell>{String(row.contact_name ?? "—")}</TableCell>
                <TableCell>{String(row.partner_type ?? "—")}</TableCell>
                <TableCell>{String(row.email ?? "—")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{String(row.status ?? "—")}</Badge>
                </TableCell>
                <TableCell>
                  <Button type="button" size="sm" variant="outline" onClick={() => openRow(row)}>
                    Review
                  </Button>
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
