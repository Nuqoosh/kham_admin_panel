"use client";

import { useParams } from "next/navigation";
import { couponsApi } from "@/lib/api";
import { useApi } from "@/lib/hooks/use-api";
import { CouponForm } from "@/components/forms/coupon-form";

export default function EditCouponPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, loading, error } = useApi(() => couponsApi.get(id), [id]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading coupon…</p>;
  }
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <CouponForm
      mode="edit"
      couponId={id}
      initial={(data ?? null) as Record<string, unknown> | null}
    />
  );
}
