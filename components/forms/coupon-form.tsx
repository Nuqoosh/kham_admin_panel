"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { couponsApi, type CouponRequest, type CouponType } from "@/lib/api";
import {
  emptyToNull,
  getFieldErrors,
  getFormErrorMessage,
  parseOptionalNumber,
} from "@/lib/form";
import { BackLink, PageHeader } from "@/components/page-header";
import { FormAlert, FieldHint } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";

export function CouponForm({
  mode,
  couponId,
  initial,
}: {
  mode: "create" | "edit";
  couponId?: string;
  initial?: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<CouponType>("percentage");
  const [value, setValue] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initial) return;
    setCode(String(initial.code ?? ""));
    setName(String(initial.name ?? ""));
    setType((initial.type as CouponType) || "percentage");
    setValue(initial.value != null ? String(initial.value) : "");
    setMinSpend(initial.min_spend != null ? String(initial.min_spend) : "");
    setMaxDiscount(
      initial.max_discount != null ? String(initial.max_discount) : "",
    );
    setMaxUses(initial.max_uses != null ? String(initial.max_uses) : "");
    setMaxUsesPerCustomer(
      initial.max_uses_per_customer != null
        ? String(initial.max_uses_per_customer)
        : "",
    );
    setStartsAt(
      initial.starts_at
        ? String(initial.starts_at).slice(0, 16)
        : "",
    );
    setEndsAt(initial.ends_at ? String(initial.ends_at).slice(0, 16) : "");
    setIsActive(Boolean(initial.is_active ?? true));
  }, [initial]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const payload: Partial<CouponRequest> = {
      name: name.trim(),
      type,
      value: Number(value),
      min_spend: parseOptionalNumber(minSpend),
      max_discount: parseOptionalNumber(maxDiscount),
      max_uses: parseOptionalNumber(maxUses),
      max_uses_per_customer: parseOptionalNumber(maxUsesPerCustomer),
      starts_at: emptyToNull(startsAt),
      ends_at: emptyToNull(endsAt),
      is_active: isActive,
    };

    try {
      if (mode === "create") {
        await couponsApi.create({
          ...(payload as CouponRequest),
          code: code.trim().toUpperCase(),
        });
        router.push("/coupons");
      } else if (couponId) {
        await couponsApi.update(couponId, payload);
        router.push("/coupons");
      }
    } catch (err) {
      setError(getFormErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5">
      <BackLink href="/coupons" label="Coupons" />
      <PageHeader
        eyebrow="Promotions"
        title={mode === "create" ? "New coupon" : "Edit coupon"}
      />
      <FormAlert error={error} fieldErrors={fieldErrors} />

      <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        {mode === "create" ? (
          <FormField label="Code" htmlFor="code">
            <Input
              id="code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
            />
            <FieldHint error={fieldErrors.code} />
          </FormField>
        ) : (
          <p className="text-sm text-muted-foreground">
            Code: <span className="font-medium text-ink">{code}</span>
          </p>
        )}

        <FormField label="Name" htmlFor="name">
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Type" htmlFor="type">
            <SelectNative
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as CouponType)}
            >
              <option value="percentage">percentage</option>
              <option value="fixed">fixed</option>
            </SelectNative>
          </FormField>
          <FormField label="Value" htmlFor="value">
            <Input
              id="value"
              required
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Min spend" htmlFor="min_spend">
            <Input
              id="min_spend"
              type="number"
              min="0"
              step="0.01"
              value={minSpend}
              onChange={(e) => setMinSpend(e.target.value)}
            />
          </FormField>
          <FormField label="Max discount" htmlFor="max_discount">
            <Input
              id="max_discount"
              type="number"
              min="0"
              step="0.01"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Max uses" htmlFor="max_uses">
            <Input
              id="max_uses"
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </FormField>
          <FormField label="Max uses / customer" htmlFor="max_uses_per_customer">
            <Input
              id="max_uses_per_customer"
              type="number"
              min="1"
              value={maxUsesPerCustomer}
              onChange={(e) => setMaxUsesPerCustomer(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Starts at" htmlFor="starts_at">
            <Input
              id="starts_at"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </FormField>
          <FormField label="Ends at" htmlFor="ends_at">
            <Input
              id="ends_at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </FormField>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 accent-olive"
          />
          Active
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create coupon" : "Save"}
        </Button>
        <Link
          href="/coupons"
          className="inline-flex h-11 items-center rounded-full border border-olive/25 px-6 text-xs uppercase tracking-[0.16em] hover:bg-sand"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
