"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { customersApi } from "@/lib/api";
import { useApi } from "@/lib/hooks/use-api";
import { BackLink, PageHeader } from "@/components/page-header";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, loading, error } = useApi(() => customersApi.get(id), [id]);
  const customer = (data ?? null) as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <BackLink href="/customers" label="Customers" />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {customer ? (
        <>
          <PageHeader
            eyebrow="CRM"
            title={[customer.first_name, customer.last_name]
              .filter(Boolean)
              .join(" ")}
            actions={
              <Link
                href={`/customers/${id}/edit`}
                className="inline-flex h-11 items-center rounded-full border border-olive bg-olive px-6 text-xs uppercase tracking-[0.16em] text-cream hover:bg-olive-soft"
              >
                Edit
              </Link>
            }
          />
          <div className="grid gap-3 rounded-xl bg-paper p-6 text-sm ring-1 ring-border sm:grid-cols-2">
            <p>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Email
              </span>
              <br />
              {String(customer.email ?? "—")}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Phone
              </span>
              <br />
              {String(customer.phone ?? "—")}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Status
              </span>
              <br />
              {String(customer.status ?? "—")}
            </p>
            <p>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Marketing
              </span>
              <br />
              {customer.marketing_opt_in ? "Opted in" : "No"}
            </p>
            {customer.notes ? (
              <p className="sm:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Notes
                </span>
                <br />
                {String(customer.notes)}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
