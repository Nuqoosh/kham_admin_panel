import type { ReactNode } from "react";
import { humanizeFieldKey } from "@/lib/form";

export function FormAlert({
  error,
  fieldErrors,
}: {
  error: string | null;
  fieldErrors?: Record<string, string>;
}) {
  if (!error && (!fieldErrors || Object.keys(fieldErrors).length === 0)) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {error ? <p className="font-medium leading-relaxed">{error}</p> : null}
      {fieldErrors && Object.keys(fieldErrors).length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 ps-5 text-destructive/90">
          {Object.entries(fieldErrors).map(([field, message]) => (
            <li key={field}>
              <span className="font-medium">{humanizeFieldKey(field)}</span>
              {": "}
              {message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function FieldHint({
  error,
  children,
}: {
  error?: string;
  children?: ReactNode;
}) {
  if (error) {
    return <p className="mt-1.5 text-xs text-destructive">{error}</p>;
  }
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-muted-brown">{children}</p>;
}
