"use client";

import { catalogApi } from "@/lib/api";
import { unwrapList, useApi } from "@/lib/hooks/use-api";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const markets = useApi(() => catalogApi.markets(), []);
  const warehouses = useApi(() => catalogApi.warehouses(), []);
  const currencies = useApi(() => catalogApi.currencies(), []);

  const marketItems = unwrapList(markets.data);
  const warehouseItems = unwrapList(warehouses.data);
  const currencyItems = unwrapList(currencies.data);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reference data"
        title="Settings"
        description="Markets, warehouses and currencies from the Commerce API."
        actions={
          <Button
            type="button"
            variant="outline"
            className="bg-paper"
            onClick={() => {
              markets.reload();
              warehouses.reload();
              currencies.reload();
            }}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <RefCard
          title="Markets"
          loading={markets.loading}
          error={markets.error}
          items={marketItems.map((m) => String(m.name ?? m.code ?? m.id))}
        />
        <RefCard
          title="Warehouses"
          loading={warehouses.loading}
          error={warehouses.error}
          items={warehouseItems.map((w) => String(w.name ?? w.code ?? w.id))}
        />
        <RefCard
          title="Currencies"
          loading={currencies.loading}
          error={currencies.error}
          items={currencyItems.map((c) => String(c.code ?? c.name ?? c.id))}
        />
      </div>
    </div>
  );
}

function RefCard({
  title,
  items,
  loading,
  error,
}: {
  title: string;
  items: string[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <Card className="bg-paper ring-border">
      <CardHeader>
        <CardTitle className="font-display text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items.</p>
        ) : null}
        <ul className="space-y-1 text-sm">
          {items.map((item) => (
            <li
              key={item}
              className="border-b border-border/70 py-1.5 last:border-0"
            >
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
