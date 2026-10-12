"use client";

import { useMemo, type CSSProperties, type ComponentType } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  Clock3,
} from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { useApi } from "@/lib/hooks/use-api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "#b7ab98",
  confirmed: "#6f675c",
  processing: "#3d4639",
  packed: "#2a3128",
  shipped: "#4a5c48",
  delivered: "#1c1916",
  cancelled: "#b42318",
  returned: "#8a6a4a",
};

const PRODUCT_STATUS_COLORS: Record<string, string> = {
  active: "#2a3128",
  draft: "#b7ab98",
  archived: "#6f675c",
};

function money(value: unknown) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function num(value: unknown) {
  return Number(value ?? 0).toLocaleString();
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-olive px-3 py-2 text-xs text-cream shadow-lg">
      {label ? (
        <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-cream/60">
          {label}
        </p>
      ) : null}
      {payload.map((entry) => (
        <p key={String(entry.name)} className="tabular-nums">
          <span className="text-cream/70">{entry.name}: </span>
          {valueFormatter
            ? valueFormatter(Number(entry.value ?? 0))
            : num(entry.value)}
        </p>
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  href,
  delay,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  accent?: boolean;
  href?: string;
  delay: number;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "grid size-10 place-items-center rounded-full",
            accent ? "bg-cream/15 text-cream" : "bg-sand text-olive",
          )}
        >
          <Icon className="size-4" strokeWidth={1.5} />
        </div>
        {href ? (
          <ArrowUpRight
            className={cn(
              "size-4 opacity-50 transition-opacity group-hover:opacity-100",
              accent ? "text-cream" : "text-muted-foreground",
            )}
            strokeWidth={1.5}
          />
        ) : null}
      </div>
      <p
        className={cn(
          "mt-5 text-[10px] font-medium uppercase tracking-[0.18em]",
          accent ? "text-cream/65" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-3xl tabular-nums tracking-tight",
          accent ? "text-cream" : "text-ink",
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-2 text-xs",
          accent ? "text-cream/55" : "text-muted-foreground",
        )}
      >
        {hint}
      </p>
    </>
  );

  const className = cn(
    "group relative block overflow-hidden rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5",
    "animate-[dash-fade-up_0.55s_ease-out_both]",
    accent
      ? "bg-olive text-cream shadow-[0_18px_40px_-24px_rgba(42,49,40,0.8)]"
      : "bg-paper ring-1 ring-border",
  );

  const style = { animationDelay: `${delay}ms` } as CSSProperties;

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {inner}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, loading, error } = useApi(() => dashboardApi.get(), []);

  const sales = useMemo(
    () => data?.sales_last_7_days ?? [],
    [data?.sales_last_7_days],
  );

  const orderStatusData = useMemo(() => {
    return Object.entries(data?.orders_by_status ?? {}).map(
      ([status, total]) => ({
        name: titleCase(status),
        status,
        value: Number(total),
        fill: STATUS_COLORS[status] ?? "#6f675c",
      }),
    );
  }, [data?.orders_by_status]);

  const productStatusData = useMemo(() => {
    return Object.entries(data?.products_by_status ?? {}).map(
      ([status, total]) => ({
        name: titleCase(status),
        status,
        value: Number(total),
        fill: PRODUCT_STATUS_COLORS[status] ?? "#b7ab98",
      }),
    );
  }, [data?.products_by_status]);

  const totalOrders = orderStatusData.reduce((sum, row) => sum + row.value, 0);
  const weekRevenue = Number(data?.revenue_week ?? 0);
  const weekOrders = Number(data?.orders_week ?? 0);
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="space-y-8 pb-4">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-[dash-fade-up_0.45s_ease-out_both]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Overview · {today}
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-ink sm:text-5xl">
            {user?.name ? `Welcome, ${user.name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            A centralized commerce dashboard giving KHAM real-time insights into sales, revenue, catalog health, and inventory performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/orders/new"
            className="inline-flex h-11 items-center rounded-full border border-olive bg-olive px-5 text-[11px] uppercase tracking-[0.16em] text-cream transition-colors hover:bg-olive-soft"
          >
            New order
          </Link>
          <Link
            href="/products/new"
            className="inline-flex h-11 items-center rounded-full border border-border bg-paper px-5 text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand"
          >
            New product
          </Link>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Orders today"
              value={num(data.orders_today)}
              hint={`${weekOrders} this week`}
              icon={ShoppingBag}
              href="/orders"
              delay={40}
            />
            <KpiCard
              label="Revenue today"
              value={money(data.revenue_today)}
              hint={`${money(weekRevenue)} this week`}
              icon={Wallet}
              accent
              delay={80}
            />
            <KpiCard
              label="Customers"
              value={num(data.customers_total)}
              hint="Total registered"
              icon={Users}
              href="/customers"
              delay={120}
            />
            <KpiCard
              label="Active products"
              value={num(data.active_products)}
              hint="Live in catalog"
              icon={Package}
              href="/products"
              delay={160}
            />
            <KpiCard
              label="Low stock SKUs"
              value={num(data.low_stock_skus)}
              hint={
                Number(data.low_stock_skus) > 0
                  ? "Needs attention"
                  : "All healthy"
              }
              icon={AlertTriangle}
              href="/inventory"
              delay={200}
              accent={Number(data.low_stock_skus) > 0}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <div
              className="rounded-2xl bg-paper p-5 ring-1 ring-border sm:p-6 animate-[dash-fade-up_0.55s_ease-out_both]"
              style={{ animationDelay: "220ms" }}
            >
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Last 7 days
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-ink">
                    Revenue trend
                  </h2>
                </div>
                <p className="font-display text-2xl tabular-nums text-olive">
                  {money(weekRevenue)}
                </p>
              </div>
              <div className="h-64 w-full">
                {sales.length === 0 ? (
                  <EmptyChart label="No revenue data yet" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={sales}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="revenueFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#2a3128"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="#2a3128"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="#e4dcd0"
                        strokeDasharray="4 6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6f675c", fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={48}
                        tick={{ fill: "#6f675c", fontSize: 11 }}
                        tickFormatter={(v) =>
                          Number(v) >= 1000
                            ? `${Math.round(Number(v) / 1000)}k`
                            : String(v)
                        }
                      />
                      <Tooltip
                        content={
                          <ChartTooltip
                            valueFormatter={money}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#2a3128"
                        strokeWidth={2.25}
                        fill="url(#revenueFill)"
                        animationDuration={900}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div
              className="rounded-2xl bg-paper p-5 ring-1 ring-border sm:p-6 animate-[dash-fade-up_0.55s_ease-out_both]"
              style={{ animationDelay: "280ms" }}
            >
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Distribution
                </p>
                <h2 className="mt-1 font-display text-2xl text-ink">
                  Orders by status
                </h2>
              </div>
              <div className="flex h-64 items-center gap-4">
                {orderStatusData.length === 0 ? (
                  <EmptyChart label="No orders yet" />
                ) : (
                  <>
                    <div className="relative h-full min-w-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="58%"
                            outerRadius="82%"
                            paddingAngle={3}
                            strokeWidth={0}
                            animationDuration={900}
                          >
                            {orderStatusData.map((entry) => (
                              <Cell key={entry.status} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 grid place-items-center">
                        <div className="text-center">
                          <p className="font-display text-3xl tabular-nums text-ink">
                            {totalOrders}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            Orders
                          </p>
                        </div>
                      </div>
                    </div>
                    <ul className="hidden w-36 shrink-0 space-y-2 sm:block">
                      {orderStatusData.map((row) => (
                        <li
                          key={row.status}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span
                              className="size-2 rounded-full"
                              style={{ background: row.fill }}
                            />
                            {row.name}
                          </span>
                          <span className="tabular-nums text-ink">
                            {row.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div
              className="rounded-2xl bg-paper p-5 ring-1 ring-border sm:p-6 animate-[dash-fade-up_0.55s_ease-out_both]"
              style={{ animationDelay: "320ms" }}
            >
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Last 7 days
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-ink">
                    Daily orders
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {weekOrders} total
                </p>
              </div>
              <div className="h-56 w-full">
                {sales.length === 0 ? (
                  <EmptyChart label="No order activity yet" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sales}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#e4dcd0"
                        strokeDasharray="4 6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6f675c", fontSize: 11 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={32}
                        tick={{ fill: "#6f675c", fontSize: 11 }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey="orders"
                        name="Orders"
                        fill="#3d4639"
                        radius={[8, 8, 0, 0]}
                        animationDuration={900}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div
              className="rounded-2xl bg-paper p-5 ring-1 ring-border sm:p-6 animate-[dash-fade-up_0.55s_ease-out_both]"
              style={{ animationDelay: "360ms" }}
            >
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Catalog
                </p>
                <h2 className="mt-1 font-display text-2xl text-ink">
                  Products by status
                </h2>
              </div>
              <div className="h-56 w-full">
                {productStatusData.length === 0 ? (
                  <EmptyChart label="No products yet" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={productStatusData}
                      margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#e4dcd0"
                        strokeDasharray="4 6"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6f675c", fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={72}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6f675c", fontSize: 11 }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey="value"
                        name="Products"
                        radius={[0, 8, 8, 0]}
                        animationDuration={900}
                      >
                        {productStatusData.map((entry) => (
                          <Cell key={entry.status} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>

          <section
            className="grid gap-4 md:grid-cols-3 animate-[dash-fade-up_0.55s_ease-out_both]"
            style={{ animationDelay: "400ms" }}
          >
            <AttentionCard
              icon={Clock3}
              title="Pending orders"
              value={num(data.pending_orders ?? data.orders_by_status?.pending ?? 0)}
              description="Waiting for confirmation"
              href="/orders"
            />
            <AttentionCard
              icon={AlertTriangle}
              title="Stock alerts"
              value={num(data.low_stock_skus)}
              description="SKUs at or below reorder level"
              href="/inventory"
              warn={Number(data.low_stock_skus) > 0}
            />
            <AttentionCard
              icon={Package}
              title="Catalog live"
              value={num(data.active_products)}
              description="Active products ready to sell"
              href="/products"
            />
          </section>
        </>
      ) : null}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="grid h-full w-full place-items-center rounded-xl bg-sand/40 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function AttentionCard({
  icon: Icon,
  title,
  value,
  description,
  href,
  warn,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  value: string;
  description: string;
  href: string;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-4 rounded-2xl p-5 ring-1 transition-colors",
        warn
          ? "bg-olive text-cream ring-olive hover:bg-olive-soft"
          : "bg-paper ring-border hover:bg-sand/50",
      )}
    >
      <div
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full",
          warn ? "bg-cream/15 text-cream" : "bg-sand text-olive",
        )}
      >
        <Icon className="size-4" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-[10px] uppercase tracking-[0.16em]",
              warn ? "text-cream/65" : "text-muted-foreground",
            )}
          >
            {title}
          </p>
          <ArrowUpRight
            className={cn(
              "size-4 opacity-50 transition-opacity group-hover:opacity-100",
              warn ? "text-cream" : "text-muted-foreground",
            )}
          />
        </div>
        <p
          className={cn(
            "mt-1 font-display text-3xl tabular-nums",
            warn ? "text-cream" : "text-ink",
          )}
        >
          {value}
        </p>
        <p
          className={cn(
            "mt-1 text-xs",
            warn ? "text-cream/60" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}
