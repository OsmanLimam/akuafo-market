"use client";

import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAkuafo } from "../store";
import { AuthShell } from "./auth-shell";
import { CtaPrimary, Eyebrow } from "../ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordView() {
  const resetToken = useAkuafo((s) => s.resetToken);
  const setView = useAkuafo((s) => s.setView);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!resetToken) {
    return (
      <AuthShell
        image="/images/cassava.png"
        imageAlt="Freshly harvested cassava roots in wooden crates on a farm"
        quote={{ line: "Back to sourcing,", italic: "shortly." }}
      >
        <div className="flex flex-col gap-8">
          <button
            type="button"
            onClick={() => setView("signin")}
            className="ax-label inline-flex w-fit cursor-pointer items-center gap-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Back to sign in
          </button>
          <div>
            <Eyebrow>Password reset</Eyebrow>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-ink dark:text-cream">
              This reset link is invalid.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The link may have expired or been used already. Request a new one and it will stay
              valid for one hour.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <CtaPrimary onClick={() => setView("forgot")}>Request a new link</CtaPrimary>
            <button
              type="button"
              onClick={() => setView("signin")}
              className="ax-label w-fit cursor-pointer py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Couldn't reset your password. Try again.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't reset your password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      image="/images/cassava.png"
      imageAlt="Freshly harvested cassava roots in wooden crates on a farm"
      quote={{ line: "Back to sourcing,", italic: "shortly." }}
    >
      <div className="flex flex-col gap-8">
        <button
          type="button"
          onClick={() => setView("signin")}
          className="ax-label inline-flex w-fit cursor-pointer items-center gap-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          Back to sign in
        </button>

        {done ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 rounded-xl border border-forest/20 bg-forest/[0.04] p-6 dark:border-cream/15 dark:bg-cream/[0.04]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest/10 dark:bg-cream/10">
                <ShieldCheck className="h-5 w-5 text-forest dark:text-cream" strokeWidth={1.5} aria-hidden />
              </span>
              <h2 className="font-display text-2xl tracking-tight text-ink dark:text-cream">
                Password updated
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sign in with your new password.
              </p>
            </div>
            <CtaPrimary onClick={() => setView("signin")} className="w-full">
              Sign in
            </CtaPrimary>
          </div>
        ) : (
          <>
            <div>
              <Eyebrow>Password reset</Eyebrow>
              <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-ink dark:text-cream">
                Choose a new password.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Your reset link is valid. Set a new password for your account.
              </p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reset-password" className="ax-label text-muted-foreground">
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-11 rounded-lg bg-transparent pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">At least 8 characters</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="reset-confirm" className="ax-label text-muted-foreground">
                  Confirm password
                </Label>
                <Input
                  id="reset-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  aria-invalid={confirm.length > 0 && confirm !== password}
                  className="h-11 rounded-lg bg-transparent"
                />
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-xs text-destructive">Passwords don't match yet.</p>
                )}
              </div>

              {error && (
                <p id="reset-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <CtaPrimary type="submit" loading={loading} className="w-full">
                Reset password
              </CtaPrimary>
            </form>
          </>
        )}
      </div>
    </AuthShell>
  );
}
