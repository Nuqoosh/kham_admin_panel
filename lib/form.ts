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

export function getFormErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (error instanceof ApiClientError) return error.message || fallback;
  if (error instanceof Error) return error.message;
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
