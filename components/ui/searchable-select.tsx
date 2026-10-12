"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  value: string;
  label: string;
  keywords?: string;
};

type SearchableSelectProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Optional async search — called when the query changes */
  onSearch?: (query: string) => void;
  searching?: boolean;
};

export function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches.",
  required,
  disabled,
  className,
  onSearch,
  searching,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [menuWidth, setMenuWidth] = React.useState<number | null>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || onSearch) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.keywords ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query, onSearch]);

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

  const onSearchRef = React.useRef(onSearch);
  onSearchRef.current = onSearch;
  const skipNextSearchRef = React.useRef(true);

  React.useEffect(() => {
    // Only search when the user types — not on mount or when opening the menu
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (!onSearchRef.current) return;

    const t = window.setTimeout(() => {
      onSearchRef.current?.(query);
    }, 250);
    return () => window.clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    if (!open) {
      // Reset so reopening with empty query does not auto-search
      skipNextSearchRef.current = true;
    }
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative w-full min-w-0", className)}>
      <input
        type="text"
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        value={value}
        required={required}
        onChange={() => {}}
        className="pointer-events-none absolute h-px w-px opacity-0"
      />

      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          if (!open) setQuery("");
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-full border border-border bg-paper px-4 text-left text-sm text-ink outline-none transition-colors",
          "focus-visible:border-olive/40 focus-visible:ring-2 focus-visible:ring-olive/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-olive/40 ring-2 ring-olive/15",
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label || placeholder}
        </span>
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
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-[8px] border border-border bg-cream pe-3 ps-9 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-olive/40"
              />
            </label>
          </div>

          <ul
            role="listbox"
            className="max-h-56 overflow-auto p-1"
          >
            {searching ? (
              <li className="px-3 py-3 text-sm text-muted-foreground">
                Searching…
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                        setQuery("");
                      }}
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
