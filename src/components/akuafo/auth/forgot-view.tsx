"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useAkuafo } from "../store";
import { AuthShell } from "./auth-shell";
import { CtaPrimary, Eyebrow } from "../ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function ForgotPasswordView() {
  const setView = useAkuafo((s) => s.setView);
  const openReset = useAkuafo((s) => s.openReset);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // Clear the pending auto-navigation if the user leaves first
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; resetToken?: string; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong. Try again.");

      setSent(true);
      if (data?.resetToken) {
        // Account exists, the prototype returns the token directly.
        // Simulate clicking the emailed link, then continue to reset.
        setVerifiedEmail(email.trim());
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          openReset(data.resetToken!);
        }, 600);
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Something went wrong. Try again.");
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

        {!sent ? (
          <>
            <div>
              <Eyebrow>Password reset</Eyebrow>
              <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-ink dark:text-cream">
                Forgot your password?
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Enter the email you registered with and we&rsquo;ll send reset instructions.
              </p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="forgot-email" className="ax-label text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="h-11 rounded-lg bg-transparent"
                  aria-invalid={!!error}
                />
              </div>

              {error && (
                <p id="forgot-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <CtaPrimary type="submit" loading={loading} className="w-full">
                Send reset link
              </CtaPrimary>
            </form>
          </>
        ) : verifiedEmail ? (
          /* Reset link verified, continuing to the reset form */
          <div className="flex flex-col gap-4 rounded-xl border border-forest/20 bg-forest/[0.04] p-6 dark:border-cream/15 dark:bg-cream/[0.04]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest/10 dark:bg-cream/10">
              <MailCheck className="h-5 w-5 text-forest dark:text-cream" strokeWidth={1.5} aria-hidden />
            </span>
            <h2 className="font-display text-2xl tracking-tight text-ink dark:text-cream">
              Reset link verified
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Choose a new password for <span className="ax-data text-foreground">{verifiedEmail}</span>.
              Taking you there now…
            </p>
          </div>
        ) : (
          /* Unknown email, same generic message either way */
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-2xl tracking-tight text-ink dark:text-cream">
              Check your email
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If an account exists for that email, reset instructions have been sent.
            </p>
            <div className="pt-2">
              <CtaPrimary onClick={() => setView("signin")}>Back to sign in</CtaPrimary>
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
