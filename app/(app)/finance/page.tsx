"use client";

import { useState } from "react";
import { catalogApi, financeApi } from "@/lib/api";
import { getFieldErrors, getFormErrorMessage } from "@/lib/form";
import { unwrapList, useApi } from "@/lib/hooks/use-api";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function FinancePage() {
  const markets = useApi(() => catalogApi.markets(), []);
  const marketItems = unwrapList(markets.data);

  const [marketId, setMarketId] = useState("");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "custom">(
    "monthly",
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportBusy, setReportBusy] = useState(false);

  const expenses = useApi(
    () =>
      financeApi.listExpenses({
        market_id: marketId ? Number(marketId) : undefined,
      }),
    [marketId],
  );
  const expenseItems = unwrapList(expenses.data);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [incurredOn, setIncurredOn] = useState("");
  const [reference, setReference] = useState("");
  const [expenseBusy, setExpenseBusy] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function loadReport() {
    if (!marketId) {
      setReportError("Select a market.");
      return;
    }
    setReportBusy(true);
    setReportError(null);
    try {
      const res = await financeApi.report({
        market_id: Number(marketId),
        period,
        from: period === "custom" ? from : undefined,
        to: period === "custom" ? to : undefined,
      });
      setReport(res.data as Record<string, unknown>);
    } catch (err) {
      setReport(null);
      setReportError(getFormErrorMessage(err));
    } finally {
      setReportBusy(false);
    }
  }

  async function exportCsv() {
    if (!marketId) {
      setReportError("Select a market.");
      return;
    }
    try {
      const { blob, filename } = await financeApi.exportReportCsv({
        market_id: Number(marketId),
        period,
        from: period === "custom" ? from : undefined,
        to: period === "custom" ? to : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "kham-finance-report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setReportError(getFormErrorMessage(err));
    }
  }

  async function createExpense(e: React.FormEvent) {
    e.preventDefault();
    setExpenseBusy(true);
    setExpenseError(null);
    setFieldErrors({});
    try {
      await financeApi.createExpense({
        market_id: Number(marketId),
        category: category.trim(),
        description: description.trim(),
        amount: Number(amount),
        incurred_on: incurredOn,
        reference: reference.trim() || null,
      });
      setCategory("");
      setDescription("");
      setAmount("");
      setIncurredOn("");
      setReference("");
      expenses.reload();
    } catch (err) {
      setExpenseError(getFormErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setExpenseBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Finance"
        title="Finance"
        description="Market reports and operating expenses."
      />

      <section className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">Report</h2>
        <FormAlert error={reportError} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Market
            <SelectNative className="mt-2" value={marketId} onChange={(e) => setMarketId(e.target.value)}>
              <option value="">Select market</option>
              {marketItems.map((m) => (
                <option key={String(m.id)} value={String(m.id)}>
                  {String(m.name ?? m.code ?? m.id)}
                </option>
              ))}
            </SelectNative>
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Period
            <SelectNative
              className="mt-2"
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as "daily" | "weekly" | "monthly" | "custom")
              }
            >
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
              <option value="custom">custom</option>
            </SelectNative>
          </label>
          {period === "custom" ? (
            <>
              <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                From
                <Input className="mt-2" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                To
                <Input className="mt-2" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void loadReport()} disabled={reportBusy}>
            {reportBusy ? "Loading…" : "Run report"}
          </Button>
          <Button type="button" variant="outline" onClick={() => void exportCsv()}>
            Export CSV
          </Button>
        </div>
        {report ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {[
              ["Currency", report.currency_code],
              ["Delivered sales", report.delivered_sales],
              ["Paid delivered", report.paid_delivered_sales],
              ["Expenses", report.operating_expenses],
              ["Known COGS", report.known_cost_of_goods],
              ["Gross profit", report.gross_profit],
              ["Net profit", report.net_profit],
              ["Profit status", report.profit_status],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {String(label)}
                </p>
                <p className="mt-1 font-display text-xl tabular-nums">
                  {value == null ? "—" : String(value)}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Expenses</h2>
        <form onSubmit={createExpense} className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
          <FormAlert error={expenseError} fieldErrors={fieldErrors} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Category
              <Input className="mt-2" required value={category} onChange={(e) => setCategory(e.target.value)} />
            </label>
            <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Amount
              <Input className="mt-2" required type="number" min={0.01} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Incurred on
              <Input className="mt-2" required type="date" value={incurredOn} onChange={(e) => setIncurredOn(e.target.value)} />
            </label>
            <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground sm:col-span-2">
              Description
              <Input className="mt-2" required value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Reference
              <Input className="mt-2" value={reference} onChange={(e) => setReference(e.target.value)} />
            </label>
          </div>
          <Button type="submit" disabled={expenseBusy || !marketId}>
            {expenseBusy ? "Saving…" : "Add expense"}
          </Button>
          {!marketId ? (
            <p className="text-xs text-muted-foreground">Select a market above to add expenses.</p>
          ) : null}
        </form>

        {expenses.loading ? <p className="text-sm text-muted-foreground">Loading expenses…</p> : null}
        {expenses.error ? <p className="text-sm text-destructive">{expenses.error}</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenseItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No expenses.
                </TableCell>
              </TableRow>
            ) : (
              expenseItems.map((row) => (
                <TableRow key={String(row.id)}>
                  <TableCell>{String(row.incurred_on ?? "—")}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{String(row.category ?? "—")}</Badge>
                  </TableCell>
                  <TableCell>{String(row.description ?? "—")}</TableCell>
                  <TableCell className="tabular-nums">
                    {String(row.amount ?? "—")} {String(row.currency_code ?? "")}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await financeApi.removeExpense(String(row.id));
                        expenses.reload();
                      }}
                    >
                      Archive
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
