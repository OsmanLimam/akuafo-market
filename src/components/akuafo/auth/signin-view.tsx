"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useAkuafo, type View } from "../store";
import { useAuth, type AuthUser } from "../auth-store";
import { AuthShell } from "./auth-shell";
import { CtaOutline, CtaPrimary, Eyebrow } from "../ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const fieldLabel = "ax-label text-muted-foreground";
const inputCls = "h-11 rounded-lg bg-transparent";

export function SignInView() {
  const setView = useAkuafo((s) => s.setView);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json().catch(() => null)) as
        | { user?: AuthUser; token?: string; error?: string }
        | null;
      if (!res.ok || !data?.user || !data.token) {
        throw new Error(data?.error ?? "Couldn't sign you in. Try again.");
      }

      const user = data.user;
      useAuth.getState().signIn(user, data.token);
      // Fresh data for the new session, orders are session-scoped
      queryClient.clear();
      toast({
        title: `Welcome back, ${user.name.split(" ")[0]}.`,
        description: "You're signed in.",
      });

      const redirect = useAuth.getState().redirectAfterAuth;
      if (redirect) {
        useAuth.getState().setRedirectAfterAuth(null);
        setView(redirect as View);
      } else {
        setView(user.role === "BUYER" ? "buyer" : "supplier");
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message ? err.message : "Couldn't sign you in. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      image="/images/logistics.png"
      imageAlt="A loaded produce truck with wooden crates of vegetables at a Ghanaian farm collection point at dawn"
      quote={{ line: "Source produce", italic: "with confidence." }}
    >
      <div className="flex flex-col gap-8">
        <div>
          <Eyebrow>Welcome back</Eyebrow>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-ink dark:text-cream">
            Sign in to your account.
          </h1>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="signin-email" className={fieldLabel}>
              Email
            </Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              className={inputCls}
              aria-invalid={!!error}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="signin-password" className={fieldLabel}>
              Password
            </Label>
            <div className="relative">
              <Input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className={`${inputCls} pr-12`}
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
          </div>

          {error && (
            <p id="signin-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <CtaPrimary type="submit" loading={loading} className="w-full">
            Sign in
          </CtaPrimary>
        </form>

        <button
          type="button"
          onClick={() => setView("forgot")}
          className="w-fit cursor-pointer text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Forgot password?
        </button>

        <div className="flex flex-col gap-5">
          <Separator />
          <p className="text-sm text-muted-foreground">New to Akuafo Market?</p>
          <CtaOutline onClick={() => setView("signup")} className="w-full">
            Create account
          </CtaOutline>
        </div>
      </div>
    </AuthShell>
  );
}
