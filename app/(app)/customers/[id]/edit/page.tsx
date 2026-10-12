"use client";

import { useParams } from "next/navigation";
import { customersApi } from "@/lib/api";
import { useApi } from "@/lib/hooks/use-api";
import { CustomerForm } from "@/components/forms/customer-form";

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, loading, error } = useApi(() => customersApi.get(id), [id]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading customer…</p>;
  }
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <CustomerForm
      mode="edit"
      customerId={id}
      initial={(data ?? null) as Record<string, unknown> | null}
    />
  );
}
