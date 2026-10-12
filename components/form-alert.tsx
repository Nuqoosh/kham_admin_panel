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
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {error ? <p>{error}</p> : null}
      {fieldErrors && Object.keys(fieldErrors).length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 ps-5">
          {Object.entries(fieldErrors).map(([field, message]) => (
            <li key={field}>
              <span className="font-medium">{field}</span>: {message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function FieldHint({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-destructive">{error}</p>;
}
