"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { productsApi } from "@/lib/api";
import { unwrapList } from "@/lib/hooks/use-api";
import {
  SearchableSelect,
  type SearchableOption,
} from "@/components/ui/searchable-select";
import { FormField } from "@/components/ui/field";

export function variantsFromProducts(
  products: Record<string, unknown>[],
): SearchableOption[] {
  const rows: SearchableOption[] = [];
  for (const p of products) {
    const variants = Array.isArray(p.variants)
      ? (p.variants as Record<string, unknown>[])
      : [];
    for (const v of variants) {
      const id = Number(v.id);
      if (!Number.isFinite(id)) continue;
      const sku = String(v.sku ?? id);
      const title = String(v.title ?? "");
      const name = String(p.name ?? "");
      rows.push({
        value: String(id),
        label: `${name} · ${sku}${title ? ` (${title})` : ""}`,
        keywords: `${name} ${sku} ${title} ${String(p.slug ?? "")}`,
      });
    }
  }
  return rows;
}

export function useVariantSearch() {
  const [variantOptions, setVariantOptions] = useState<SearchableOption[]>([]);
  const [searchingVariants, setSearchingVariants] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SearchableOption | null>(
    null,
  );
  const [variantId, setVariantId] = useState("");

  const loadVariants = useCallback(async (search = "") => {
    setSearchingVariants(true);
    try {
      const res = await productsApi.list({
        search: search.trim() || undefined,
        per_page: 50,
      });
      setVariantOptions(variantsFromProducts(unwrapList(res.data)));
    } catch {
      // keep previous options on transient search errors
    } finally {
      setSearchingVariants(false);
    }
  }, []);

  useEffect(() => {
    void loadVariants("");
  }, [loadVariants]);

  const optionsWithSelected = useMemo(() => {
    if (!selectedOption) return variantOptions;
    if (variantOptions.some((o) => o.value === selectedOption.value)) {
      return variantOptions;
    }
    return [selectedOption, ...variantOptions];
  }, [variantOptions, selectedOption]);

  function onVariantChange(next: string) {
    setVariantId(next);
    const opt = optionsWithSelected.find((o) => o.value === next) ?? null;
    setSelectedOption(opt);
  }

  return {
    variantId,
    setVariantId: onVariantChange,
    options: optionsWithSelected,
    searching: searchingVariants,
    loadVariants,
  };
}

export function VariantSearchField({
  id = "variant",
  label = "Variant",
  required,
  variantId,
  options,
  searching,
  onSearch,
  onChange,
}: {
  id?: string;
  label?: string;
  required?: boolean;
  variantId: string;
  options: SearchableOption[];
  searching?: boolean;
  onSearch: (query: string) => void;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label} htmlFor={id}>
      <SearchableSelect
        id={id}
        required={required}
        value={variantId}
        options={options}
        placeholder="Select variant"
        searchPlaceholder="Search product or SKU…"
        emptyMessage="No variants found."
        searching={searching}
        onSearch={onSearch}
        onChange={onChange}
      />
    </FormField>
  );
}
