"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Visual group header — not a selectable value */
  isGroup?: boolean;
};

function collectOptions(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === "optgroup") {
      const props = child.props as React.OptgroupHTMLAttributes<HTMLOptGroupElement> & {
        children?: React.ReactNode;
        label?: string;
      };
      if (props.label) {
        options.push({
          value: `__group_${props.label}`,
          label: props.label,
          disabled: true,
          isGroup: true,
        });
      }
      options.push(...collectOptions(props.children));
      return;
    }

    if (child.type !== "option") return;

    const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement> & {
      children?: React.ReactNode;
    };

    options.push({
      value: props.value != null ? String(props.value) : String(props.children ?? ""),
      label: String(props.children ?? props.value ?? ""),
      disabled: Boolean(props.disabled),
    });
  });

  return options;
}

function SelectNative({
  className,
  children,
  value,
  defaultValue,
  onChange,
  id,
  name,
  required,
  disabled,
  ...props
}: React.ComponentProps<"select">) {
  const options = React.useMemo(() => collectOptions(children), [children]);
  const selectable = React.useMemo(
    () => options.filter((o) => !o.isGroup),
    [options],
  );
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(
    String(defaultValue ?? selectable[0]?.value ?? ""),
  );
  const selectedValue = String(isControlled ? (value ?? "") : internalValue);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [menuWidth, setMenuWidth] = React.useState<number | null>(null);

  const selected =
    selectable.find((o) => o.value === selectedValue) ?? null;

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
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", syncWidth);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function commit(next: string) {
    if (!isControlled) setInternalValue(next);

    if (onChange) {
      const synthetic = {
        target: { value: next, name: name ?? "", id: id ?? "" },
        currentTarget: { value: next, name: name ?? "", id: id ?? "" },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(synthetic);
    }

    setOpen(false);
  }

  const triggerLabel =
    selected?.label ||
    selectable.find((o) => o.value === "")?.label ||
    "Select";

  return (
    <div ref={rootRef} className={cn("relative w-full min-w-0", className)}>
      <select
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        value={selectedValue}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px opacity-0"
        onChange={() => {}}
        {...props}
      >
        {selectable.map((option) => (
          <option
            key={option.value || "__empty"}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      <button
        ref={triggerRef}
        type="button"
        id={id ? `${id}-trigger` : undefined}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id ? `${id}-listbox` : undefined}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-full border border-border bg-paper px-4 text-left text-sm text-ink outline-none transition-colors",
          "focus-visible:border-olive/40 focus-visible:ring-2 focus-visible:ring-olive/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-olive/40 ring-2 ring-olive/15",
          !selectedValue && "text-muted-foreground",
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={1.5}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          id={id ? `${id}-listbox` : undefined}
          aria-labelledby={id ? `${id}-trigger` : undefined}
          style={menuWidth ? { width: menuWidth } : undefined}
          className="absolute left-0 top-[calc(100%+0.35rem)] z-50 box-border max-h-60 overflow-auto rounded-[8px] border border-border bg-paper p-1 shadow-[0_12px_30px_rgba(28,25,22,0.12)]"
        >
          {options.map((option) => {
            if (option.isGroup) {
              return (
                <li
                  key={option.value}
                  role="presentation"
                  className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {option.label}
                </li>
              );
            }

            const isSelected = option.value === selectedValue;
            return (
              <li key={option.value || "__empty"} role="presentation" className="min-w-0">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) commit(option.value);
                  }}
                  className={cn(
                    "flex w-full min-w-0 items-center truncate rounded-[8px] px-3 py-2.5 text-left text-sm transition-colors",
                    option.disabled && "cursor-not-allowed opacity-40",
                    isSelected
                      ? "bg-sand text-ink"
                      : "text-ink hover:bg-sand/70",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export { SelectNative };
