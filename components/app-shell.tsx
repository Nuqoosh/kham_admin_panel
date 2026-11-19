"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Warehouse,
  TicketPercent,
  Leaf,
  FolderTree,
  Settings2,
  BadgeDollarSign,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelsTopLeft,
  Sparkles,
  HelpCircle,
  FlaskConical,
  Star,
  Handshake,
  Mail,
  Truck,
  Percent,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, permissions: [] as string[] },
  { href: "/products", label: "Products", icon: Package, permissions: ["products.view"] },
  { href: "/brands", label: "Brands", icon: Leaf, permissions: ["products.view"] },
  { href: "/categories", label: "Categories", icon: FolderTree, permissions: ["products.view"] },
  { href: "/orders", label: "Orders", icon: ShoppingBag, permissions: ["orders.view"] },
  { href: "/customers", label: "Customers", icon: Users, permissions: ["customers.view"] },
  { href: "/inventory", label: "Inventory", icon: Warehouse, permissions: ["inventory.view"] },
  { href: "/pricing", label: "Pricing", icon: BadgeDollarSign, permissions: ["products.view"] },
  { href: "/coupons", label: "Coupons", icon: TicketPercent, permissions: ["coupons.view", "products.view"] },
  { href: "/homepage", label: "Homepage", icon: PanelsTopLeft, permissions: ["products.view"] },
  { href: "/rituals", label: "Rituals", icon: Sparkles, permissions: ["products.view"] },
  { href: "/ritual-quiz", label: "Ritual quiz", icon: HelpCircle, permissions: ["products.view"] },
  { href: "/ingredients", label: "Ingredients", icon: FlaskConical, permissions: ["products.view"] },
  { href: "/reviews", label: "Reviews", icon: Star, permissions: ["products.view"] },
  { href: "/partners", label: "Partners", icon: Handshake, permissions: ["customers.view"] },
  { href: "/newsletter", label: "Newsletter", icon: Mail, permissions: ["customers.view"] },
  { href: "/shipping", label: "Shipping", icon: Truck, permissions: ["finance.view", "products.view"] },
  { href: "/tax", label: "Tax", icon: Percent, permissions: ["finance.view", "tax.approve"] },
  { href: "/finance", label: "Finance", icon: Landmark, permissions: ["finance.view"] },
  { href: "/catalog", label: "Settings", icon: Settings2, permissions: ["products.view"] },
];

const SIDEBAR_KEY = "kham_sidebar_open";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_KEY);
    if (stored === "0") setOpen(false);
    if (stored === "1") setOpen(true);
    setReady(true);
  }, []);

  function toggleSidebar() {
    setOpen((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col bg-olive text-cream transition-[width] duration-200 ease-out",
          open ? "w-64" : "w-[4.5rem]",
          !ready && "opacity-0",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 border-b border-cream/10 py-5",
            open ? "items-start justify-between gap-2 px-5" : "flex-col items-center gap-3 px-2",
          )}
        >
          <Link
            href="/"
            className={cn("leading-none", !open && "text-center")}
            title="KHAM Cairo"
          >
            <span
              className={cn(
                "font-display font-medium tracking-[0.18em]",
                open ? "text-2xl" : "text-lg",
              )}
            >
              {open ? (
                <>
                  KHAM
                  <sup className="ms-0.5 text-[0.55em] tracking-normal">®</sup>
                </>
              ) : (
                "K"
              )}
            </span>
            {open ? (
              <span className="mt-1 block text-[0.62rem] text-center font-medium tracking-[0.42em] text-cream/70">
                CAIRO
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-full text-cream/70 transition-colors hover:bg-cream/10 hover:text-cream"
          >
            {open ? (
              <ChevronLeft className="size-4" strokeWidth={1.5} />
            ) : (
              <ChevronRight className="size-4" strokeWidth={1.5} />
            )}
          </button>
        </div>

        <nav
          className={cn(
            "sidebar-nav-scroll flex flex-1 flex-col gap-1 py-4",
            open ? "px-3" : "items-center px-2",
          )}
        >
          {NAV.filter((item) => can(user, ...item.permissions)).map(
            ({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  "flex items-center rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-colors",
                  open ? "gap-3 px-4 py-2.5" : "size-10 justify-center",
                  active
                    ? "bg-cream/15 text-cream"
                    : "text-cream/65 hover:bg-cream/10 hover:text-cream",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.5} />
                {open ? <span className="truncate">{label}</span> : null}
              </Link>
            );
          },
          )}
        </nav>

        <div
          className={cn(
            "shrink-0 border-t border-cream/10 py-4",
            open ? "px-4" : "flex flex-col items-center px-2",
          )}
        >
          {open ? (
            <>
              <p className="truncate px-2 text-sm text-cream/80">
                {user?.name ?? "Admin"}
              </p>
              <p className="truncate px-2 text-xs text-cream/50">{user?.email}</p>
              <Button
                variant="invert"
                size="sm"
                className="mt-3 w-full"
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
              >
                <LogOut className="size-3.5" />
                Sign out
              </Button>
            </>
          ) : (
            <button
              type="button"
              title="Sign out"
              aria-label="Sign out"
              className="grid size-10 place-items-center rounded-full text-cream/70 transition-colors hover:bg-cream/10 hover:text-cream"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              <LogOut className="size-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 px-6 py-8 sm:px-10">{children}</div>
      </main>
    </div>
  );
}
