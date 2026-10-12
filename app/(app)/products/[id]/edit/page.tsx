"use client";

import { useParams } from "next/navigation";
import { productsApi } from "@/lib/api";
import { useApi } from "@/lib/hooks/use-api";
import { ProductForm } from "@/components/forms/product-form";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, loading, error } = useApi(() => productsApi.get(id), [id]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading product…</p>;
  }
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <ProductForm
      mode="edit"
      productId={id}
      initial={(data ?? null) as Record<string, unknown> | null}
    />
  );
}
