"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, ShoppingBasket, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAkuafo, type View } from "../store";
import { useAuth, type AuthUser } from "../auth-store";
import { AuthShell } from "./auth-shell";
import { CtaOutline, CtaPrimary, Eyebrow } from "../ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const INTERESTS = ["Vegetables", "Grains", "Tubers & Roots", "Fruits", "Legumes"];

type Role = "BUYER" | "SUPPLIER";

const ROLE_OPTIONS: { value: Role; icon: typeof ShoppingBasket; title: string; desc: string }[] = [
  {
    value: "BUYER",
    icon: ShoppingBasket,
    title: "I buy produce",
    desc: "Source wholesale produce for your business",
  },
  {
    value: "SUPPLIER",
    icon: Sprout,
    title: "I supply produce",
    desc: "List and sell your harvest to verified buyers",
  },
];

const fieldLabel = "ax-label text-muted-foreground";
const inputCls = "h-11 rounded-lg bg-transparent";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function SignUpView() {
  const setView = useAkuafo((s) => s.setView);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirmMismatch = confirm.length > 0 && confirm !== password;

  const validate = (): string | null => {
    if (step === 1) {
      if (!role) return "Choose what you're here to do.";
    } else if (step === 2) {
      if (!name.trim()) return "Enter your full name.";
      if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
      if (password.length < 8) return "Password must be at least 8 characters.";
      if (password !== confirm) return "Passwords don't match.";
    } else {
      if (!businessName.trim())
        return role === "SUPPLIER" ? "Enter your farm or business name." : "Enter your business name.";
      if (!location.trim()) return "Enter your location.";
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(3, s + 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async () => {
    const err = validate();
    if (err || !role) {
      setError(err);
      return;
    }
    if (loading) return;
    setLoading(true);
    setError(null);
    setConflict(false);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: name.trim(),
          email: email.trim(),
          password,
          businessName: businessName.trim(),
          location: location.trim(),
          phone: phone.trim(),
          interests,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { user?: AuthUser; token?: string; error?: string }
        | null;
      if (!res.ok || !data?.user || !data.token) {
        if (res.status === 409) setConflict(true);
        throw new Error(data?.error ?? "Couldn't create your account. Try again.");
      }

      const user = data.user;
      useAuth.getState().signIn(user, data.token);
      queryClient.clear();
      toast({
        title: `Welcome to Akuafo Market, ${user.name.split(" ")[0]}.`,
        description:
          user.role === "BUYER" ? "Your buyer account is ready." : "Your supplier account is ready.",
      });

      const redirect = useAuth.getState().redirectAfterAuth;
      if (redirect) {
        useAuth.getState().setRedirectAfterAuth(null);
        setView(redirect as View);
      } else {
        setView(user.role === "BUYER" ? "buyer" : "supplier");
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message ? e.message : "Couldn't create your account. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (item: string) =>
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );

  const heading =
    step === 1
      ? "What are you here to do?"
      : step === 2
        ? "Create your account."
        : role === "SUPPLIER"
          ? "Tell us about your farm."
          : "Tell us about your business.";

  return (
    <AuthShell
      image={role === "SUPPLIER" ? "/images/cassava.png" : "/images/supplier-akwasi.png"}
      imageAlt={
        role === "SUPPLIER"
          ? "Freshly harvested cassava roots in wooden crates on a farm"
          : "Kwaku Akwasi, a tomato supplier, standing among crates of freshly harvested tomatoes"
      }
      quote={
        role === "SUPPLIER"
          ? { line: "Sell where the market", italic: "is looking." }
          : { line: "Find the produce", italic: "your business runs on." }
      }
    >
      <div className="flex flex-col gap-8">
        {/* Progress */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="ax-label text-muted-foreground">
              Step {step} of 3
            </p>
            {step > 1 && (
              <button
                type="button"
                onClick={back}
                className="ax-label inline-flex cursor-pointer items-center gap-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                Back
              </button>
            )}
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-forest dark:bg-cream" : "bg-forest/15 dark:bg-cream/15",
                )}
              />
            ))}
          </div>
        </div>

        <div key={step} className="ax-rise flex flex-col gap-8">
          <div>
            <Eyebrow>Create account</Eyebrow>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-ink dark:text-cream">
              {heading}
            </h1>
          </div>

          {/* STEP 1, role */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div role="radiogroup" aria-label="What are you here to do?" className="flex flex-col gap-4">
                {ROLE_OPTIONS.map((opt) => {
                  const selected = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setRole(opt.value);
                        setError(null);
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-5 rounded-xl border-2 p-5 text-left transition-colors",
                        selected
                          ? "border-forest bg-forest/[0.04]"
                          : "border-border hover:border-forest/40 dark:hover:border-cream/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors",
                          selected
                            ? "bg-forest text-cream dark:bg-cream dark:text-ink"
                            : "bg-forest/8 text-forest dark:bg-cream/10 dark:text-cream",
                        )}
                      >
                        <opt.icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className="ax-label text-[11px] text-ink dark:text-cream">
                          {opt.title}
                        </span>
                        <span className="text-sm text-muted-foreground">{opt.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <CtaPrimary onClick={next} className="w-full">
                Continue
              </CtaPrimary>
            </div>
          )}

          {/* STEP 2, account */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-name" className={fieldLabel}>
                    Full name
                  </Label>
                  <Input
                    id="signup-name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ama Mensah"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-email" className={fieldLabel}>
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-password" className={fieldLabel}>
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
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
                  <p className="text-xs text-muted-foreground">At least 8 characters</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-confirm" className={fieldLabel}>
                    Confirm password
                  </Label>
                  <Input
                    id="signup-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    aria-invalid={confirmMismatch}
                    className={inputCls}
                  />
                  {confirmMismatch && (
                    <p className="text-xs text-destructive">Passwords don't match yet.</p>
                  )}
                </div>
              </div>
              <CtaPrimary onClick={next} className="w-full">
                Continue
              </CtaPrimary>
            </div>
          )}

          {/* STEP 3, business details */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-business" className={fieldLabel}>
                    {role === "SUPPLIER" ? "Farm or business name" : "Business name"}
                  </Label>
                  <Input
                    id="signup-business"
                    autoComplete="organization"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={role === "SUPPLIER" ? "e.g. Akwasi Farms" : "e.g. Accra Fresh Mart"}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-location" className={fieldLabel}>
                    Location
                  </Label>
                  <Input
                    id="signup-location"
                    autoComplete="address-level2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Accra, Greater Accra"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-phone" className={fieldLabel}>
                    Phone <span className="font-normal normal-case tracking-normal">(optional)</span>
                  </Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +233 20 000 0000"
                    className={inputCls}
                  />
                </div>
                <fieldset className="flex flex-col gap-3">
                  <legend className={fieldLabel}>
                    {role === "SUPPLIER" ? "What do you supply?" : "What do you source?"}
                  </legend>
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label={role === "SUPPLIER" ? "Commodities you supply" : "Commodities you source"}
                  >
                    {INTERESTS.map((item) => {
                      const active = interests.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleInterest(item)}
                          className={cn(
                            "cursor-pointer rounded-lg border px-3.5 py-2 text-sm transition-colors",
                            active
                              ? "border-forest bg-forest text-cream dark:border-cream dark:bg-cream dark:text-ink"
                              : "border-border text-muted-foreground hover:border-forest/50 hover:text-foreground dark:hover:border-cream/50",
                          )}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
              <CtaPrimary onClick={submit} loading={loading} className="w-full">
                Create account
              </CtaPrimary>
            </div>
          )}

          {error && (
            <div id="signup-error" role="alert" className="flex flex-col gap-2">
              <p className="text-sm text-destructive">{error}</p>
              {conflict && (
                <button
                  type="button"
                  onClick={() => setView("signin")}
                  className="w-fit cursor-pointer text-sm font-medium text-forest underline-offset-4 transition-colors hover:underline dark:text-cream"
                >
                  Sign in instead
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => setView("signin")}
            className="cursor-pointer font-medium text-forest underline-offset-4 transition-colors hover:underline dark:text-cream"
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
