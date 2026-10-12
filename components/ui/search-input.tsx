"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  debounceMs?: number;
  onDebouncedChange: (value: string) => void;
  onChange?: (value: string) => void;
};

export function SearchInput({
  value,
  defaultValue = "",
  placeholder = "Search…",
  className,
  inputClassName,
  debounceMs = 350,
  onDebouncedChange,
  onChange,
}: SearchInputProps) {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const current = isControlled ? value : inner;
  const lastEmitted = useRef<string | null>(null);
  const onDebouncedChangeRef = useRef(onDebouncedChange);
  onDebouncedChangeRef.current = onDebouncedChange;

  useEffect(() => {
    const trimmed = current.trim();
    // Skip the initial empty emit so list pages don't refetch on mount.
    if (lastEmitted.current === null && trimmed === "") {
      lastEmitted.current = "";
      return;
    }
    const timer = window.setTimeout(() => {
      if (lastEmitted.current === trimmed) return;
      lastEmitted.current = trimmed;
      onDebouncedChangeRef.current(trimmed);
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [current, debounceMs]);

  function update(next: string) {
    if (!isControlled) setInner(next);
    onChange?.(next);
  }

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
      <input
        type="search"
        value={current}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "h-11 w-full rounded-full border border-border bg-paper py-2 pr-10 pl-11 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-olive/40 focus-visible:ring-2 focus-visible:ring-olive/15 [&::-webkit-search-cancel-button]:hidden",
          inputClassName,
        )}
      />
      {current ? (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-ink"
          onClick={() => update("")}
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
