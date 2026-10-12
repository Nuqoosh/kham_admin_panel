"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { ApiClientError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REMEMBER_KEY = "kham_remember_email";

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      if (remember) {
        window.localStorage.setItem(REMEMBER_KEY, email);
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Unable to sign in",
      );
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4 py-10">
      <div className="grid w-full max-w-[920px] overflow-hidden rounded-[1.75rem] bg-paper shadow-[0_24px_60px_-28px_rgba(28,25,22,0.35)] ring-1 ring-border md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        {/* Brand panel */}
        <aside className="relative hidden min-h-[34rem] overflow-hidden bg-[#f3eee5] md:block">
          <Image
            src="/cairo-edit.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 45vw, 0px"
            className="object-cover object-center opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/30 to-ink/15" />

          <div className="relative z-10 flex h-full flex-col justify-end px-10 pb-12 pt-12">
            <div className="max-w-[16rem]">
              <p className="font-display text-[2.75rem] leading-none tracking-[0.14em] text-cream">
                KHAM
                <sup className="ms-0.5 text-[0.45em] tracking-normal">®</sup>
              </p>
              <p className="mt-3 text-[0.68rem] font-medium uppercase tracking-[0.42em] text-cream/75">
                Cairo · Admin
              </p>
              <div className="mt-6 h-px w-10 bg-cream/70" />
              <p className="mt-6 font-display text-xl leading-snug text-cream/90">
                Access your account to continue.
              </p>
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col justify-center bg-[#fcfaf6] px-7 py-10 sm:px-12 sm:py-14"
        >
          <div className="mb-8 md:hidden">
            <p className="font-display text-3xl tracking-[0.12em]">
              KHAM
              <sup className="ms-0.5 text-[0.5em]">®</sup>
            </p>
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.4em] text-muted-foreground">
              Cairo · Admin
            </p>
          </div>

          <div>
            <h1 className="font-display text-[2.35rem] leading-none tracking-tight text-ink">
              Welcome Back
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in to your account to access the admin panel.
            </p>
          </div>

          <div className="mt-9 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-brown"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="admin@example.com"
                  className="h-12 w-full rounded-xl border border-border bg-paper pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-olive/40 focus-visible:ring-2 focus-visible:ring-olive/15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-brown"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-border bg-paper py-2 pr-11 pl-11 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-olive/40 focus-visible:ring-2 focus-visible:ring-olive/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" strokeWidth={1.75} />
                  ) : (
                    <Eye className="size-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink/80">
              <span className="relative inline-flex size-[1.125rem] shrink-0">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "absolute inset-0 rounded-[4px] border transition-colors",
                    remember
                      ? "border-olive bg-olive"
                      : "border-border bg-paper",
                  )}
                />
                <svg
                  viewBox="0 0 12 12"
                  className={cn(
                    "absolute inset-0 m-auto size-2.5 text-cream transition-opacity",
                    remember ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden
                >
                  <path
                    d="M2 6.2 4.6 9 10 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Remember me
            </label>

            <button
              type="button"
              className="text-sm text-muted-brown transition-colors hover:text-ink"
              onClick={() =>
                setError("Password reset is not available in this admin yet.")
              }
            >
              Forgot password?
            </button>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="mt-8 w-full tracking-[0.2em]"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
            {!loading ? <ArrowRight className="size-4" strokeWidth={2} /> : null}
          </Button>
        </form>
      </div>
    </div>
  );
}
