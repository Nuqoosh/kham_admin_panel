"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, Pencil } from "lucide-react";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";

export function TableActions({
  editHref,
  editLabel = "Edit",
  onDelete,
  deleteLabel = "Delete",
  confirmMessage = "Delete this record? This cannot be undone.",
}: {
  editHref?: string;
  editLabel?: string;
  onDelete?: () => Promise<void> | void;
  deleteLabel?: string;
  confirmMessage?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm(confirmMessage)) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to delete record",
      );
    } finally {
      setBusy(false);
    }
  }

  const iconBtn =
    "inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-ink disabled:opacity-40";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {editHref ? (
          <Link
            href={editHref}
            aria-label={editLabel}
            title={editLabel}
            className={iconBtn}
          >
            <Pencil className="size-4" strokeWidth={1.5} />
          </Link>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            aria-label={deleteLabel}
            title={deleteLabel}
            disabled={busy}
            onClick={handleDelete}
            className={cn(iconBtn, "hover:text-destructive")}
          >
            <Archive className="size-4" strokeWidth={1.5} />
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="max-w-[220px] text-[11px] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
