"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onUnauthorized } from "@/lib/api/token";
import { useAuthStore } from "@/lib/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const pathname = usePathname();
  const router = useRouter();
  const redirectingTo = useRef<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Keep Zustand in sync when API client forces logout on 401.
  useEffect(() => {
    return onUnauthorized(() => {
      useAuthStore.setState({ token: null, user: null });
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const isLogin = pathname === "/login";
    const target =
      !token && !isLogin ? "/login" : token && isLogin ? "/" : null;

    if (!target) {
      redirectingTo.current = null;
      return;
    }

    // Avoid repeated replace() calls that remount the tree and look like reloads.
    if (redirectingTo.current === target) return;
    redirectingTo.current = target;
    router.replace(target);
  }, [hydrated, token, pathname, router]);

  // Only block on first hydrate — don't unmount the app during login↔home redirects.
  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream text-muted-foreground">
        <p className="text-xs uppercase tracking-[0.2em]">Loading KHAM…</p>
      </div>
    );
  }

  if (!token && pathname !== "/login") {
    return (
      <div className="grid min-h-screen place-items-center bg-cream text-muted-foreground">
        <p className="text-xs uppercase tracking-[0.2em]">Loading KHAM…</p>
      </div>
    );
  }

  return <>{children}</>;
}
