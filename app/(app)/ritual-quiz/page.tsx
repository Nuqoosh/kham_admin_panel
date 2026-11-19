"use client";

import { useMemo, useState } from "react";
import { ritualQuizApi } from "@/lib/api";
import { getFieldErrors, getFormErrorMessage } from "@/lib/form";
import { unwrapList, useApi } from "@/lib/hooks/use-api";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RitualQuizPage() {
  const { data, loading, error: loadError, reload } = useApi(
    () => ritualQuizApi.listQuestions(),
    [],
  );
  const questions = useMemo(() => unwrapList(data), [data]);

  const [question, setQuestion] = useState("");
  const [questionAr, setQuestionAr] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [optionQuestionId, setOptionQuestionId] = useState("");
  const [optionLabel, setOptionLabel] = useState("");
  const [optionLabelAr, setOptionLabelAr] = useState("");
  const [optionBusy, setOptionBusy] = useState(false);

  const [syncOptionId, setSyncOptionId] = useState("");
  const [syncProducts, setSyncProducts] = useState("");
  const [syncBusy, setSyncBusy] = useState(false);
  const [archiveBusyKey, setArchiveBusyKey] = useState<string | null>(null);

  async function createQuestion(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      await ritualQuizApi.createQuestion({
        question: question.trim(),
        question_ar: questionAr.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: true,
      });
      setQuestion("");
      setQuestionAr("");
      setSortOrder("0");
      reload();
    } catch (err) {
      setError(getFormErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setBusy(false);
    }
  }

  async function createOption(e: React.FormEvent) {
    e.preventDefault();
    setOptionBusy(true);
    setError(null);
    try {
      await ritualQuizApi.createOption(optionQuestionId, {
        label: optionLabel.trim(),
        label_ar: optionLabelAr.trim() || null,
        is_active: true,
      });
      setOptionLabel("");
      setOptionLabelAr("");
      reload();
    } catch (err) {
      setError(getFormErrorMessage(err));
    } finally {
      setOptionBusy(false);
    }
  }

  async function syncOptionProducts(e: React.FormEvent) {
    e.preventDefault();
    setSyncBusy(true);
    setError(null);
    try {
      const products = syncProducts
        .split(/[\n,]+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [idPart, weightPart] = line.split(":").map((s) => s.trim());
          return {
            product_id: Number(idPart),
            weight: Number(weightPart || 1),
          };
        });
      await ritualQuizApi.syncOptionProducts(syncOptionId, { products });
      setSyncProducts("");
      reload();
    } catch (err) {
      setError(getFormErrorMessage(err));
    } finally {
      setSyncBusy(false);
    }
  }

  async function archiveQuestion(row: Record<string, unknown>) {
    const id = String(row.id);
    if (row.is_active === false) return;
    if (
      !confirm(
        `Archive question #${id}? It will be hidden from the storefront quiz.`,
      )
    ) {
      return;
    }
    setArchiveBusyKey(`q-${id}`);
    setError(null);
    try {
      await ritualQuizApi.archiveQuestion(id);
      if (optionQuestionId === id) setOptionQuestionId("");
      reload();
    } catch (err) {
      setError(getFormErrorMessage(err));
    } finally {
      setArchiveBusyKey(null);
    }
  }

  async function archiveOption(row: Record<string, unknown>) {
    const id = String(row.id);
    if (row.is_active === false) return;
    if (
      !confirm(
        `Archive option #${id} (“${String(row.label ?? "")}”)? It will stop recommending products.`,
      )
    ) {
      return;
    }
    setArchiveBusyKey(`o-${id}`);
    setError(null);
    try {
      await ritualQuizApi.archiveOption(id);
      if (syncOptionId === id) setSyncOptionId("");
      reload();
    } catch (err) {
      setError(getFormErrorMessage(err));
    } finally {
      setArchiveBusyKey(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="CMS"
        title="Ritual quiz"
        description="Questions, options, and weighted product recommendations."
        actions={
          <Button type="button" variant="outline" className="bg-paper" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <FormAlert error={error} fieldErrors={fieldErrors} />

      <form onSubmit={createQuestion} className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">New question</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground sm:col-span-2">
            Question
            <Input className="mt-2" required value={question} onChange={(e) => setQuestion(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Sort
            <Input className="mt-2" type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground sm:col-span-3">
            Question (AR)
            <Input className="mt-2" value={questionAr} onChange={(e) => setQuestionAr(e.target.value)} />
          </label>
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create question"}</Button>
      </form>

      <form onSubmit={createOption} className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">Add option</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Question
            <select
              className="mt-2 h-11 w-full rounded-full border border-border bg-paper px-4 text-sm"
              required
              value={optionQuestionId}
              onChange={(e) => setOptionQuestionId(e.target.value)}
            >
              <option value="">Select question</option>
              {questions.map((q) => (
                <option key={String(q.id)} value={String(q.id)}>
                  #{String(q.id)} — {String(q.question ?? "")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Label
            <Input className="mt-2" required value={optionLabel} onChange={(e) => setOptionLabel(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Label (AR)
            <Input className="mt-2" value={optionLabelAr} onChange={(e) => setOptionLabelAr(e.target.value)} />
          </label>
        </div>
        <Button type="submit" disabled={optionBusy}>{optionBusy ? "Saving…" : "Create option"}</Button>
      </form>

      <form onSubmit={syncOptionProducts} className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl">Sync option products</h2>
        <p className="text-sm text-muted-foreground">
          Format: one `product_id:weight` per line (weight 1–100).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Option ID
            <Input className="mt-2" required value={syncOptionId} onChange={(e) => setSyncOptionId(e.target.value)} />
          </label>
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Products
            <textarea
              className="mt-2 min-h-24 w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm"
              required
              value={syncProducts}
              onChange={(e) => setSyncProducts(e.target.value)}
              placeholder={"12:3\n45:1"}
            />
          </label>
        </div>
        <Button type="submit" disabled={syncBusy}>{syncBusy ? "Saving…" : "Sync products"}</Button>
      </form>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Question</TableHead>
            <TableHead>Options</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                No quiz questions yet.
              </TableCell>
            </TableRow>
          ) : (
            questions.map((q) => {
              const qId = String(q.id);
              const options = Array.isArray(q.options)
                ? (q.options as Record<string, unknown>[])
                : [];
              return (
                <TableRow key={qId}>
                  <TableCell className="tabular-nums">{qId}</TableCell>
                  <TableCell className="font-medium">{String(q.question ?? "—")}</TableCell>
                  <TableCell>
                    <ul className="space-y-2 text-sm">
                      {options.map((o) => {
                        const oId = String(o.id);
                        const inactive = o.is_active === false;
                        return (
                          <li
                            key={oId}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <span className={inactive ? "text-muted-foreground" : undefined}>
                              #{oId} {String(o.label ?? "")}
                              {inactive ? " (archived)" : ""}
                            </span>
                            {!inactive ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={archiveBusyKey === `o-${oId}`}
                                onClick={() => void archiveOption(o)}
                              >
                                {archiveBusyKey === `o-${oId}`
                                  ? "Archiving…"
                                  : "Archive"}
                              </Button>
                            ) : null}
                          </li>
                        );
                      })}
                      {options.length === 0 ? (
                        <li className="text-muted-foreground">No options</li>
                      ) : null}
                    </ul>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {q.is_active === false ? "Inactive" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {q.is_active !== false ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={archiveBusyKey === `q-${qId}`}
                        onClick={() => void archiveQuestion(q)}
                      >
                        {archiveBusyKey === `q-${qId}`
                          ? "Archiving…"
                          : "Archive"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Archived</span>
                    )}
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
