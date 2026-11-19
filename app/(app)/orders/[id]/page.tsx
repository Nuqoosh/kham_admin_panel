"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ordersApi,
  paymentsApi,
  refundsApi,
  type OrderStatus,
} from "@/lib/api";
import { getFormErrorMessage } from "@/lib/form";
import { unwrapList, useApi } from "@/lib/hooks/use-api";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";
import { BackLink, PageHeader } from "@/components/page-header";
import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, loading, error, reload } = useApi(() => ordersApi.get(id), [id]);
  const {
    data: refundsData,
    loading: refundsLoading,
    error: refundsError,
    reload: reloadRefunds,
  } = useApi(() => refundsApi.listForOrder(id), [id]);
  const order = (data ?? null) as Record<string, unknown> | null;
  const items = Array.isArray(order?.items)
    ? (order.items as Record<string, unknown>[])
    : [];
  const refunds = useMemo(() => unwrapList(refundsData), [refundsData]);

  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [refundReason, setRefundReason] = useState("");
  const [refundBusy, setRefundBusy] = useState(false);
  const [refundActionId, setRefundActionId] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [auditText, setAuditText] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const canApproveRefund = can(user, "refunds.approve");
  const canManageOrders = can(user, "orders.manage");
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payInfo, setPayInfo] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "KNET"
  >("CARD");
  const [enquiryPaymentId, setEnquiryPaymentId] = useState("");

  async function updateStatus() {
    if (!status) return;
    setSaving(true);
    setStatusError(null);
    try {
      await ordersApi.updateStatus(id, { status: status as OrderStatus });
      setStatus("");
      reload();
    } catch (err) {
      setStatusError(getFormErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function createRefund(e: React.FormEvent) {
    e.preventDefault();
    setRefundBusy(true);
    setRefundError(null);
    setAuditText(null);
    try {
      await refundsApi.create(id, { reason: refundReason.trim() });
      setRefundReason("");
      reloadRefunds();
    } catch (err) {
      setRefundError(getFormErrorMessage(err));
    } finally {
      setRefundBusy(false);
    }
  }

  async function approveRefund(refundId: string) {
    if (
      !confirm(
        "Approve this refund request? Requires refunds.approve permission.",
      )
    ) {
      return;
    }
    setRefundActionId(refundId);
    setRefundError(null);
    setAuditText(null);
    try {
      await refundsApi.approve(refundId, { confirm: true });
      reloadRefunds();
      reload();
    } catch (err) {
      setRefundError(getFormErrorMessage(err));
    } finally {
      setRefundActionId(null);
    }
  }

  async function rejectRefund(refundId: string) {
    const reason = window.prompt(
      "Reject reason (required, min 5 characters):",
      "Does not meet refund policy",
    );
    if (!reason || reason.trim().length < 5) return;
    if (!confirm("Reject this refund request? No provider refund will run.")) {
      return;
    }
    setRefundActionId(refundId);
    setRefundError(null);
    setAuditText(null);
    try {
      await refundsApi.reject(refundId, reason.trim());
      reloadRefunds();
      reload();
    } catch (err) {
      setRefundError(getFormErrorMessage(err));
    } finally {
      setRefundActionId(null);
    }
  }

  async function cancelRefund(refundId: string) {
    if (
      !confirm(
        "Cancel this refund request? Only the original requester can cancel.",
      )
    ) {
      return;
    }
    setRefundActionId(refundId);
    setRefundError(null);
    setAuditText(null);
    try {
      await refundsApi.cancel(refundId);
      reloadRefunds();
      reload();
    } catch (err) {
      setRefundError(getFormErrorMessage(err));
    } finally {
      setRefundActionId(null);
    }
  }

  async function startSandboxPayment() {
    setPayBusy(true);
    setPayError(null);
    setPayInfo(null);
    try {
      const key = `dash-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      const res = await paymentsApi.startMyFatoorahSandboxHosted(id, {
        idempotency_key: key,
        payment_method: paymentMethod,
      });
      const data = res.data as Record<string, unknown>;
      const url =
        typeof data.payment_url === "string"
          ? data.payment_url
          : typeof data.redirect_url === "string"
            ? data.redirect_url
            : null;
      setPayInfo(
        url
          ? `Sandbox payment initiated. Open: ${url}`
          : `Sandbox payment response: ${JSON.stringify(data)}`,
      );
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      reload();
    } catch (err) {
      setPayError(getFormErrorMessage(err));
    } finally {
      setPayBusy(false);
    }
  }

  async function checkSandboxStatus() {
    setPayBusy(true);
    setPayError(null);
    try {
      const res = await paymentsApi.myFatoorahSandboxStatus(id);
      setPayInfo(`Status: ${JSON.stringify(res.data)}`);
    } catch (err) {
      setPayError(getFormErrorMessage(err));
    } finally {
      setPayBusy(false);
    }
  }

  async function runProviderEnquiry() {
    if (!enquiryPaymentId.trim()) return;
    setPayBusy(true);
    setPayError(null);
    try {
      const res = await paymentsApi.myFatoorahProviderEnquiry(id, {
        payment_id: enquiryPaymentId.trim(),
      });
      setPayInfo(`Enquiry: ${JSON.stringify(res.data)}`);
    } catch (err) {
      setPayError(getFormErrorMessage(err));
    } finally {
      setPayBusy(false);
    }
  }

  async function viewAudit(refundId: string) {
    setRefundActionId(refundId);
    setRefundError(null);
    try {
      const rows = await refundsApi.audit(refundId);
      const list = unwrapList(rows);
      setAuditText(
        list.length === 0
          ? "No audit entries."
          : list
              .map((row) => {
                const action = String(row.action ?? row.event ?? "event");
                const by = String(
                  row.user_id ?? row.actor_id ?? row.created_by ?? "—",
                );
                const at = String(row.created_at ?? row.timestamp ?? "");
                return `${action} · by ${by}${at ? ` · ${at}` : ""}`;
              })
              .join("\n"),
      );
    } catch (err) {
      setRefundError(getFormErrorMessage(err));
    } finally {
      setRefundActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href="/orders" label="Orders" />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {order ? (
        <>
          <PageHeader
            eyebrow="Commerce"
            title={`Order ${String(order.order_number ?? `#${order.id}`)}`}
            description={`Payment: ${String(order.payment_status ?? "—")}`}
            actions={
              <Badge variant="secondary" className="uppercase tracking-[0.12em]">
                {String(order.status)}
              </Badge>
            }
          />

          <div className="grid gap-3 rounded-xl bg-paper p-6 text-sm ring-1 ring-border sm:grid-cols-3">
            <p>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Total
              </span>
              <br />
              <span className="font-display text-2xl tabular-nums">
                {String(order.grand_total ?? "—")}
              </span>
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Market
              </span>
              <br />
              {String(
                (order.market as Record<string, unknown> | undefined)?.name ??
                  order.market_id ??
                  "—",
              )}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Warehouse
              </span>
              <br />
              {String(
                (order.warehouse as Record<string, unknown> | undefined)
                  ?.name ??
                  order.warehouse_id ??
                  "—",
              )}
            </p>
          </div>

          <div className="space-y-3 rounded-xl bg-paper p-6 ring-1 ring-border">
            <h2 className="font-display text-2xl">Update status</h2>
            <FormAlert error={statusError} />
            <div className="flex flex-wrap gap-3">
              <SelectNative
                value={status || String(order.status ?? "")}
                onChange={(e) => setStatus(e.target.value)}
                className="w-56"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </SelectNative>
              <Button type="button" onClick={updateStatus} disabled={saving}>
                {saving ? "Updating…" : "Save status"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-xl">Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No items.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, i) => (
                    <TableRow key={String(item.id ?? i)}>
                      <TableCell>
                        {String(item.variant_id ?? item.sku ?? "—")}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {String(item.quantity ?? "—")}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {String(item.unit_price ?? "—")}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {String(item.line_total ?? "—")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {canManageOrders ? (
            <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
              <h2 className="font-display text-2xl">MyFatoorah sandbox</h2>
              <p className="text-xs text-muted-foreground">
                Local/testing only. Backend returns 404 unless sandbox flags and
                an HTTPS redirect URL are configured.
              </p>
              <FormAlert error={payError} />
              {payInfo ? (
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs">
                  {payInfo}
                </pre>
              ) : null}
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Method
                  <SelectNative
                    className="mt-2 w-44"
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value as
                          | "CARD"
                          | "APPLE_PAY"
                          | "GOOGLE_PAY"
                          | "KNET",
                      )
                    }
                  >
                    <option value="CARD">CARD</option>
                    <option value="APPLE_PAY">APPLE_PAY</option>
                    <option value="GOOGLE_PAY">GOOGLE_PAY</option>
                    <option value="KNET">KNET</option>
                  </SelectNative>
                </label>
                <Button
                  type="button"
                  disabled={payBusy}
                  onClick={() => void startSandboxPayment()}
                >
                  {payBusy ? "Working…" : "Start sandbox hosted"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-paper"
                  disabled={payBusy}
                  onClick={() => void checkSandboxStatus()}
                >
                  Check status
                </Button>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[220px] flex-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Provider payment id
                  <Input
                    className="mt-2"
                    value={enquiryPaymentId}
                    onChange={(e) => setEnquiryPaymentId(e.target.value)}
                    placeholder="MyFatoorah payment id"
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-paper"
                  disabled={payBusy || !enquiryPaymentId.trim()}
                  onClick={() => void runProviderEnquiry()}
                >
                  Provider enquiry
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Refunds</h2>
              <Button
                type="button"
                variant="outline"
                className="bg-paper"
                onClick={reloadRefunds}
              >
                Refresh
              </Button>
            </div>
            <FormAlert error={refundError} />
            {refundsError ? (
              <p className="text-sm text-destructive">{refundsError}</p>
            ) : null}

            <form
              onSubmit={createRefund}
              className="flex flex-wrap items-end gap-3"
            >
              <label className="min-w-[240px] flex-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Reason
                <Input
                  className="mt-2"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Customer requested refund…"
                />
              </label>
              <Button type="submit" disabled={refundBusy}>
                {refundBusy ? "Submitting…" : "Request refund"}
              </Button>
            </form>

            {auditText ? (
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs">
                {auditText}
              </pre>
            ) : null}

            {refundsLoading ? (
              <p className="text-sm text-muted-foreground">Loading refunds…</p>
            ) : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.length === 0 && !refundsLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No refund requests.
                    </TableCell>
                  </TableRow>
                ) : (
                  refunds.map((row) => {
                    const refundId = String(row.id);
                    const statusLabel = String(
                      row.status ?? row.state ?? "pending",
                    ).toLowerCase();
                    const pending =
                      statusLabel === "pending" ||
                      statusLabel === "requested" ||
                      statusLabel === "pending_approval";
                    const canApprove = canApproveRefund && pending;
                    const canReject = canApproveRefund && pending;
                    const canCancel = canManageOrders && pending;
                    return (
                      <TableRow key={refundId}>
                        <TableCell className="tabular-nums">{refundId}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {String(row.reason ?? "—")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{statusLabel}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={refundActionId === refundId}
                              onClick={() => viewAudit(refundId)}
                            >
                              Audit
                            </Button>
                            {canApprove ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled={refundActionId === refundId}
                                onClick={() => approveRefund(refundId)}
                              >
                                Approve
                              </Button>
                            ) : null}
                            {canReject ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={refundActionId === refundId}
                                onClick={() => rejectRefund(refundId)}
                              >
                                Reject
                              </Button>
                            ) : null}
                            {canCancel ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={refundActionId === refundId}
                                onClick={() => cancelRefund(refundId)}
                              >
                                Cancel
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}
    </div>
  );
}
