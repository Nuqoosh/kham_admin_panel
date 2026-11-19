import { ApiClientError } from "@/lib/api";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Turn API field keys like variants.0.barcode into readable labels. */
export function humanizeFieldKey(field: string): string {
  return field
    .split(".")
    .map((part) => {
      if (/^\d+$/.test(part)) return `Item ${Number(part) + 1}`;
      return part
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    })
    .join(" · ");
}

function humanizeServerMessage(message: string): string {
  const msg = message.trim();
  if (!msg) return msg;

  if (/Duplicate entry/i.test(msg) && /barcode/i.test(msg)) {
    return "A variant barcode is already in use. Use a unique barcode or leave it blank.";
  }
  if (/Duplicate entry/i.test(msg) && /sku/i.test(msg)) {
    return "A variant SKU is already in use. Please choose a unique SKU.";
  }
  if (/Duplicate entry/i.test(msg) && /slug/i.test(msg)) {
    return "This slug is already in use. Please choose another.";
  }
  if (/SQLSTATE|Integrity constraint|QueryException/i.test(msg)) {
    return "Could not save because of a data conflict. Check unique fields (SKU, barcode, slug) and try again.";
  }

  return msg;
}

export function getFormErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiClientError) {
    const primary = humanizeServerMessage(error.message || "");
    if (primary) return primary;

    const firstField = Object.values(error.errors ?? {}).flat()[0];
    if (firstField) return firstField;

    return fallback;
  }
  if (error instanceof Error) {
    return humanizeServerMessage(error.message) || fallback;
  }
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiClientError)) return {};
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(error.errors ?? {})) {
    if (Array.isArray(messages) && messages[0]) out[key] = messages[0];
  }
  return out;
}

export function flattenCategories(
  tree: Record<string, unknown>[],
  parentPath: string[] = [],
): Array<{ id: number; label: string }> {
  const rows: Array<{ id: number; label: string }> = [];
  for (const node of tree) {
    const id = Number(node.id);
    const name = String(node.name ?? id);
    const path = [...parentPath, name];
    if (Number.isFinite(id)) {
      rows.push({ id, label: path.join(" / ") });
    }
    const children = Array.isArray(node.children)
      ? (node.children as Record<string, unknown>[])
      : [];
    if (children.length > 0) {
      rows.push(...flattenCategories(children, path));
    }
  }
  return rows;
}
