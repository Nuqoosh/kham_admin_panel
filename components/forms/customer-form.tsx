"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customersApi, type CustomerRequest } from "@/lib/api";
import {
  emptyToNull,
  getFieldErrors,
  getFormErrorMessage,
} from "@/lib/form";
import { BackLink, PageHeader } from "@/components/page-header";
import { FormAlert, FieldHint } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectNative } from "@/components/ui/select-native";

export function CustomerForm({
  mode,
  customerId,
  initial,
}: {
  mode: "create" | "edit";
  customerId?: string;
  initial?: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initial) return;
    setFirstName(String(initial.first_name ?? ""));
    setLastName(String(initial.last_name ?? ""));
    setEmail(String(initial.email ?? ""));
    setPhone(String(initial.phone ?? ""));
    setStatus(String(initial.status ?? "active"));
    setNotes(String(initial.notes ?? ""));
    setTags(
      Array.isArray(initial.tags)
        ? (initial.tags as string[]).join(", ")
        : String(initial.tags ?? ""),
    );
    setMarketing(Boolean(initial.marketing_opt_in));
  }, [initial]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const payload: CustomerRequest = {
      first_name: firstName.trim(),
      last_name: emptyToNull(lastName),
      email: emptyToNull(email),
      phone: emptyToNull(phone),
      status: emptyToNull(status),
      notes: emptyToNull(notes),
      marketing_opt_in: marketing,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (mode === "create") {
        const res = await customersApi.create(payload);
        const id = (res.data as { id?: number })?.id;
        router.push(id ? `/customers/${id}` : "/customers");
      } else if (customerId) {
        await customersApi.update(customerId, payload);
        router.push(`/customers/${customerId}`);
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
      <BackLink
        href={customerId ? `/customers/${customerId}` : "/customers"}
        label="Customers"
      />
      <PageHeader
        eyebrow="CRM"
        title={mode === "create" ? "New customer" : "Edit customer"}
      />
      <FormAlert error={error} fieldErrors={fieldErrors} />

      <div className="space-y-4 rounded-xl bg-paper p-6 ring-1 ring-border">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" htmlFor="first_name">
            <Input
              id="first_name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <FieldHint error={fieldErrors.first_name} />
          </FormField>
          <FormField label="Last name" htmlFor="last_name">
            <Input
              id="last_name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FieldHint error={fieldErrors.email} />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Status" htmlFor="status">
          <SelectNative
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="blocked">blocked</option>
          </SelectNative>
        </FormField>

        <FormField label="Tags (comma separated)" htmlFor="tags">
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="vip, wholesale"
          />
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="size-4 accent-olive"
          />
          Marketing opt-in
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create customer" : "Save"}
        </Button>
        <Link
          href="/customers"
          className="inline-flex h-11 items-center rounded-full border border-olive/25 px-6 text-xs uppercase tracking-[0.16em] hover:bg-sand"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
