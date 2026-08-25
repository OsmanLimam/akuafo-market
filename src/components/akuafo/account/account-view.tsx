"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeCheck, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/api-client";
import { formatCedis } from "@/lib/types";
import { AuthGate } from "../auth-gate";
import { useAuth, type AuthUser } from "../auth-store";
import { useSaved, type SavedSupplier, type SavedSupply } from "../saved-store";
import { useAkuafo } from "../store";
import { CtaPrimary, Eyebrow, EmptyState } from "../ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const INTERESTS = ["Vegetables", "Grains", "Tubers & Roots", "Fruits", "Legumes"];

const fieldLabel = "ax-label text-muted-foreground";
const inputCls = "h-11 rounded-lg bg-transparent";
const tabTriggerCls = "ax-label h-9 shrink-0 cursor-pointer rounded-md px-4 text-[10px] sm:px-5";

export function AccountView() {
  return (
    <AuthGate require="auth">
      <AccountInner />
    </AuthGate>
  );
}

function AccountInner() {
  const user = useAuth((s) => s.user)!;
  const firstName = user.name.split(" ")[0];

  return (
    <main id="main" className="pt-28">
      <div className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4">
          <Eyebrow>My account</Eyebrow>
          <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink dark:text-cream sm:text-5xl">
            Hello, {firstName}.
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.email} · {user.role === "BUYER" ? "Buyer" : "Supplier"} account
          </p>
        </header>

        <Tabs defaultValue="profile" className="mt-10 gap-8">
          <TabsList className="ax-scroll w-full overflow-x-auto rounded-lg p-1 sm:w-fit">
            <TabsTrigger value="profile" className={tabTriggerCls}>
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className={tabTriggerCls}>
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className={tabTriggerCls}>
              Notifications
            </TabsTrigger>
            <TabsTrigger value="saved" className={tabTriggerCls}>
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfilePanel />
          </TabsContent>
          <TabsContent value="security">
            <SecurityPanel />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsPanel />
          </TabsContent>
          <TabsContent value="saved">
            <SavedPanel />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

/* ── PROFILE ──────────────────────────────────────────────────────────── */

function ProfilePanel() {
  const user = useAuth((s) => s.user)!;
  const setUser = useAuth((s) => s.setUser);
  const { toast } = useToast();

  const [name, setName] = useState(user.name);
  const [businessName, setBusinessName] = useState(user.businessName);
  const [location, setLocation] = useState(user.location);
  const [phone, setPhone] = useState(user.phone);
  const [interests, setInterests] = useState(() =>
    user.interests
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (item: string) =>
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim(),
          location: location.trim(),
          phone: phone.trim(),
          interests: interests.join(","),
        }),
      });
      const data = (await res.json().catch(() => null)) as { user?: AuthUser; error?: string } | null;
      if (!res.ok || !data?.user) {
        throw new Error(data?.error ?? "Couldn't save your profile.");
      }
      setUser(data.user);
      toast({ title: "Profile saved" });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex max-w-xl flex-col gap-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-name" className={fieldLabel}>
            Full name
          </Label>
          <Input
            id="profile-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-business" className={fieldLabel}>
            Business name
          </Label>
          <Input
            id="profile-business"
            autoComplete="organization"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-location" className={fieldLabel}>
            Location
          </Label>
          <Input
            id="profile-location"
            autoComplete="address-level2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Accra, Greater Accra"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-phone" className={fieldLabel}>
            Phone
          </Label>
          <Input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +233 20 000 0000"
            className={inputCls}
          />
        </div>
      </div>

      {user.role === "BUYER" && (
        <fieldset className="flex flex-col gap-3">
          <legend className={fieldLabel}>What do you source?</legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Commodities you source">
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
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div>
        <CtaPrimary type="submit" loading={saving}>
          Save changes
        </CtaPrimary>
      </div>
    </form>
  );
}

/* ── SECURITY ─────────────────────────────────────────────────────────── */

function SecurityPanel() {
  const { toast } = useToast();

  const [current, setCurrent] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!current) {
      setError("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Couldn't change your password.");
      toast({ title: "Password changed" });
      setCurrent("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't change your password.");
    } finally {
      setLoading(false);
    }
  };

  const type = show ? "text" : "password";

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-6" noValidate>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="security-current" className={fieldLabel}>
            Current password
          </Label>
          <Input
            id="security-current"
            type={type}
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="security-new" className={fieldLabel}>
            New password
          </Label>
          <Input
            id="security-new"
            type={type}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={inputCls}
          />
          <p className="text-xs text-muted-foreground">At least 8 characters</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="security-confirm" className={fieldLabel}>
            Confirm new password
          </Label>
          <Input
            id="security-confirm"
            type={type}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={confirm.length > 0 && confirm !== newPassword}
            className={inputCls}
          />
          {confirm.length > 0 && confirm !== newPassword && (
            <p className="text-xs text-destructive">Passwords don't match yet.</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <CtaPrimary type="submit" loading={loading}>
          Change password
        </CtaPrimary>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="ax-label cursor-pointer text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? "Hide passwords" : "Show passwords"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

/* ── NOTIFICATIONS ────────────────────────────────────────────────────── */

const NOTIF_PREFS = [
  {
    key: "orderUpdates",
    label: "Order updates",
    desc: "Status changes on your active orders",
  },
  {
    key: "newRequests",
    label: "New requests",
    desc: "Buyers requesting from your listings",
  },
  {
    key: "priceChanges",
    label: "Price changes on saved produce",
    desc: "When a lot you saved changes price",
  },
  {
    key: "suggestions",
    label: "Product suggestions",
    desc: "New lots that match your sourcing interests",
  },
] as const;

type NotifKey = (typeof NOTIF_PREFS)[number]["key"];

const NOTIF_DEFAULTS: Record<NotifKey, boolean> = {
  orderUpdates: true,
  newRequests: true,
  priceChanges: false,
  suggestions: false,
};

const NOTIF_STORAGE_KEY = "akuafo-notifications";

function readNotifPrefs(): Record<NotifKey, boolean> {
  if (typeof window === "undefined") return { ...NOTIF_DEFAULTS };
  try {
    const raw = window.localStorage.getItem(NOTIF_STORAGE_KEY);
    if (!raw) return { ...NOTIF_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Record<NotifKey, boolean>>;
    return { ...NOTIF_DEFAULTS, ...parsed };
  } catch {
    return { ...NOTIF_DEFAULTS };
  }
}

function NotificationsPanel() {
  const [prefs, setPrefs] = useState<Record<NotifKey, boolean>>(readNotifPrefs);

  const toggle = (key: NotifKey, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      window.localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable, keep this session's state only
    }
  };

  return (
    <div className="max-w-xl">
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Choose what Akuafo Market tells you about. Preferences are saved to this browser.
      </p>
      <ul className="mt-6">
        {NOTIF_PREFS.map((p) => (
          <li
            key={p.key}
            className="flex items-center justify-between gap-6 border-b border-border py-5 first:border-t"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-ink dark:text-cream">{p.label}</span>
              <span className="text-xs text-muted-foreground">{p.desc}</span>
            </div>
            <Switch
              checked={prefs[p.key]}
              onCheckedChange={(v) => toggle(p.key, v)}
              aria-label={p.label}
              className="cursor-pointer data-[state=checked]:bg-forest dark:data-[state=checked]:bg-olive-light"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── SAVED ────────────────────────────────────────────────────────────── */

function SavedPanel() {
  const supplies = useSaved((s) => s.supplies);
  const suppliers = useSaved((s) => s.suppliers);
  const toggleSupply = useSaved((s) => s.toggleSupply);
  const toggleSupplier = useSaved((s) => s.toggleSupplier);
  const openSupply = useAkuafo((s) => s.openSupply);
  const openSupplier = useAkuafo((s) => s.openSupplier);
  const openMarket = useAkuafo((s) => s.openMarket);

  if (supplies.length === 0 && suppliers.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="Nothing saved yet."
        description="Browse the marketplace and save produce you're tracking."
        actionLabel="Explore produce"
        onAction={() => openMarket()}
      />
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-12">
      {supplies.length > 0 ? (
        <section aria-labelledby="saved-produce-heading">
          <h2 id="saved-produce-heading" className="ax-label text-muted-foreground">
            Saved produce ({supplies.length})
          </h2>
          <ul className="mt-2">
            {supplies.map((s) => (
              <SavedSupplyRow key={s.id} item={s} onOpen={() => openSupply(s.id)} onRemove={() => toggleSupply(s)} />
            ))}
          </ul>
        </section>
      ) : (
        <section aria-labelledby="saved-produce-heading">
          <h2 id="saved-produce-heading" className="ax-label text-muted-foreground">
            Saved produce
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">No produce saved yet.</p>
        </section>
      )}

      {suppliers.length > 0 ? (
        <section aria-labelledby="saved-suppliers-heading">
          <h2 id="saved-suppliers-heading" className="ax-label text-muted-foreground">
            Saved suppliers ({suppliers.length})
          </h2>
          <ul className="mt-2">
            {suppliers.map((s) => (
              <SavedSupplierRow key={s.id} item={s} onOpen={() => openSupplier(s.id)} onRemove={() => toggleSupplier(s)} />
            ))}
          </ul>
        </section>
      ) : (
        <section aria-labelledby="saved-suppliers-heading">
          <h2 id="saved-suppliers-heading" className="ax-label text-muted-foreground">
            Saved suppliers
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">No suppliers saved yet.</p>
        </section>
      )}
    </div>
  );
}

function SavedSupplyRow({
  item,
  onOpen,
  onRemove,
}: {
  item: SavedSupply;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-4 border-b border-border py-4 first:border-t">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 text-left"
        aria-label={`View ${item.name} supply`}
      >
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border">
          <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-display text-xl leading-none tracking-tight text-ink dark:text-cream">
            {item.name}
          </span>
          <span className="ax-data truncate text-xs text-muted-foreground">
            {item.quantityKg.toLocaleString()} KG · {formatCedis(item.pricePerKg)} /KG · {item.town}
          </span>
        </span>
      </button>
      <Button
        variant="ghost"
        onClick={onRemove}
        className="ax-label h-9 shrink-0 cursor-pointer rounded-lg px-3 text-[10px] text-muted-foreground hover:text-destructive dark:hover:text-destructive"
      >
        Remove
      </Button>
    </li>
  );
}

function SavedSupplierRow({
  item,
  onOpen,
  onRemove,
}: {
  item: SavedSupplier;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const initials = item.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <li className="flex items-center gap-4 border-b border-border py-4 first:border-t">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 text-left"
        aria-label={`View ${item.name} profile`}
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-border bg-forest/5 text-sm font-semibold text-forest dark:bg-cream/5 dark:text-cream">
          {initials}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xl leading-none tracking-tight text-ink dark:text-cream">
              {item.name}
            </span>
            {item.verified && (
              <span className="inline-flex items-center gap-1 rounded-md border border-gold/50 px-1.5 py-0.5">
                <BadgeCheck className="h-3 w-3 text-gold" strokeWidth={2} aria-hidden />
                <span className="ax-label text-[8px] text-terracotta-deep dark:text-gold">Verified</span>
              </span>
            )}
          </span>
          <span className="ax-data text-xs text-muted-foreground">
            {item.town} · {item.region}
          </span>
        </span>
      </button>
      <Button
        variant="ghost"
        onClick={onRemove}
        className="ax-label h-9 shrink-0 cursor-pointer rounded-lg px-3 text-[10px] text-muted-foreground hover:text-destructive dark:hover:text-destructive"
      >
        Remove
      </Button>
    </li>
  );
}
