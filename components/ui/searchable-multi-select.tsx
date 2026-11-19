"use client";

import * as React from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchableOption } from "@/components/ui/searchable-select";

type SearchableMultiSelectProps = {
  id?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  /** Show “Add …” when the query matches no option */
  allowCreate?: boolean;
  createLabel?: (query: string) => string;
  onCreate?: (query: string) => void | Promise<void>;
  creating?: boolean;
};

export function SearchableMultiSelect({
  id,
  values,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches.",
  disabled,
  className,
  allowCreate = false,
  createLabel = (q) => `Add “${q}”`,
  onCreate,
  creating = false,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [menuWidth, setMenuWidth] = React.useState<number | null>(null);

  const selectedOptions = React.useMemo(
    () =>
      values
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is SearchableOption => Boolean(o)),
    [values, options],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.keywords ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  const exactMatch = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return options.some((o) => o.label.toLowerCase() === q);
  }, [options, query]);

  const canCreate =
    allowCreate &&
    Boolean(onCreate) &&
    query.trim().length > 0 &&
    !exactMatch;

  React.useEffect(() => {
    if (!open) return;

    function syncWidth() {
      if (triggerRef.current) {
        setMenuWidth(triggerRef.current.getBoundingClientRect().width);
      }
    }
    syncWidth();
    window.addEventListener("resize", syncWidth);

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", syncWidth);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 10);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  function remove(value: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(values.filter((v) => v !== value));
  }

  async function handleCreate() {
    const name = query.trim();
    if (!name || !onCreate || creating) return;
    await onCreate(name);
    setQuery("");
  }

  return (
    <div ref={rootRef} className={cn("relative w-full min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-multiselectable="true"
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          if (!open) setQuery("");
        }}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-3 rounded-full border border-border bg-paper px-3 py-2 text-left text-sm text-ink outline-none transition-colors",
          "focus-visible:border-olive/40 focus-visible:ring-2 focus-visible:ring-olive/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-olive/40 ring-2 ring-olive/15",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="px-1 text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs text-ink"
              >
                <span className="truncate">{opt.label}</span>
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${opt.label}`}
                  className="grid size-4 place-items-center rounded-full hover:bg-ink/10"
                  onClick={(e) => remove(opt.value, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      remove(opt.value, e as unknown as React.MouseEvent);
                    }
                  }}
                >
                  <X className="size-3" strokeWidth={1.75} />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={1.5}
        />
      </button>

      {open ? (
        <div
          style={menuWidth ? { width: menuWidth } : undefined}
          className="absolute left-0 top-[calc(100%+0.35rem)] z-50 box-border overflow-hidden rounded-[8px] border border-border bg-paper shadow-[0_12px_30px_rgba(28,25,22,0.12)]"
        >
          <div className="border-b border-border p-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canCreate) {
                    e.preventDefault();
                    void handleCreate();
                  }
                }}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-[8px] border border-border bg-cream pe-3 ps-9 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-olive/40"
              />
            </label>
          </div>

          <ul role="listbox" aria-multiselectable="true" className="max-h-56 overflow-auto p-1">
            {canCreate ? (
              <li role="presentation">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => void handleCreate()}
                  className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-sand/70 disabled:opacity-50"
                >
                  <Plus className="size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate">
                    {creating ? "Adding…" : createLabel(query.trim())}
                  </span>
                </button>
              </li>
            ) : null}

            {filtered.length === 0 && !canCreate ? (
              <li className="px-3 py-3 text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option) => {
                const isSelected = values.includes(option.value);
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggle(option.value)}
                      className={cn(
                        "flex w-full items-center gap-2 truncate rounded-[8px] px-3 py-2.5 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-sand text-ink"
                          : "text-ink hover:bg-sand/70",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                      {isSelected ? (
                        <Check className="size-3.5 shrink-0" strokeWidth={1.5} />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
