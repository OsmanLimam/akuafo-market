"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { authFetch } from "@/lib/api-client";
import { useAkuafo } from "../store";
import { useAuth } from "../auth-store";
import { AuthGate } from "../auth-gate";
import { CtaPrimary, Eyebrow } from "../ui";
import {
  CATEGORY_LABEL,
  formatCedis,
  formatKg,
  GHANA_REGIONS,
  GRADE_LABEL,
  type SupplierProfile,
  type Supply,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/* ── Presets ─────────────────────────────────────────────────────────────── */

const COMMODITY_SUGGESTIONS = [
  "Tomatoes",
  "Scotch Bonnet Pepper",
  "Okra",
  "White Maize",
  "Soybeans",
  "Cassava",
  "Plantain",
  "Puna Yam",
  "Pineapple",
  "Mango",
  "Watermelon",
  "Red Onions",
];

const CATEGORIES = ["VEGETABLE", "GRAIN", "TUBER", "FRUIT", "LEGUME"] as const;
const GRADES = ["GRADE_A", "GRADE_B", "FIELD_RUN"] as const;

const PRESET_IMAGES = [
  { src: "/images/tomatoes.png", alt: "Freshly harvested red tomatoes in wooden field crates" },
  { src: "/images/pepper.png", alt: "Scotch bonnet peppers heaped in a woven basket" },
  { src: "/images/okra.png", alt: "Green okra pods piled in a woven basket" },
  { src: "/images/maize.png", alt: "Dried white maize kernels in open woven sacks" },
  { src: "/images/soybeans.png", alt: "Golden soybeans in an open woven sack" },
  { src: "/images/cassava.png", alt: "Freshly harvested cassava roots piled on dry earth" },
  { src: "/images/plantain.png", alt: "Green plantain bunches stacked at a collection point" },
  { src: "/images/yam.png", alt: "Cured yam tubers stacked in a pyramid at market" },
  { src: "/images/pineapple.png", alt: "Golden smooth cayenne pineapples arranged in crates" },
  { src: "/images/mango.png", alt: "Green-yellow keitt mangoes in a wooden crate" },
  { src: "/images/watermelon.png", alt: "Crimson sweet watermelons stacked in the field" },
  { src: "/images/onion.png", alt: "Field-cured red onions packed in mesh sacks" },
];

/* ── Form model ──────────────────────────────────────────────────────────── */

interface ListingForm {
  name: string;
  category: string;
  quantityKg: string;
  pricePerKg: string;
  grade: string;
  harvestStart: string;
  harvestEnd: string;
  town: string;
  region: string;
  description: string;
  minOrderKg: string;
  deliveryAvailable: boolean;
  imageUrl: string;
}

const INITIAL_FORM: ListingForm = {
  name: "",
  category: "VEGETABLE",
  quantityKg: "",
  pricePerKg: "",
  grade: "GRADE_A",
  harvestStart: "",
  harvestEnd: "",
  town: "",
  region: "",
  description: "",
  minOrderKg: "100",
  deliveryAvailable: true,
  imageUrl: PRESET_IMAGES[0].src,
};

type FieldErrors = Partial<Record<"name" | "quantityKg" | "pricePerKg", string>>;

interface CreateSupplyPayload {
  name: string;
  category: string;
  quantityKg: number;
  pricePerKg: number;
  grade: string;
  harvestStart: string | null;
  harvestEnd: string | null;
  description: string;
  imageUrl: string;
  minOrderKg: number;
  deliveryAvailable: boolean;
}

function validate(form: ListingForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "Commodity name is required.";
  const qty = Number(form.quantityKg);
  if (!form.quantityKg.trim() || !Number.isFinite(qty) || qty <= 0)
    errors.quantityKg = "Enter a quantity greater than zero.";
  const price = Number(form.pricePerKg);
  if (!form.pricePerKg.trim() || !Number.isFinite(price) || price <= 0)
    errors.pricePerKg = "Enter a price per kg greater than zero.";
  return errors;
}

function parsePositive(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function harvestWindowLabel(start: string, end: string): string {
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  const validS = s && !Number.isNaN(s.getTime());
  const validE = e && !Number.isNaN(e.getTime());
  if (validS && validE) return `Harvest window ${format(s!, "d MMM")} – ${format(e!, "d MMM yyyy")}`;
  if (validS) return `Harvest from ${format(s!, "d MMM yyyy")}`;
  return "Harvest window on request";
}

async function fetchSupplierProfile(code: string): Promise<SupplierProfile> {
  const res = await fetch(`/api/suppliers/${encodeURIComponent(code)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Failed to load supplier profile");
  return data.supplier as SupplierProfile;
}

/* ── Field chrome ────────────────────────────────────────────────────────── */

function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} className="ax-label text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const inputClass = "h-11 rounded-lg";
const triggerClass = "h-11 w-full rounded-lg";

/* ── View ────────────────────────────────────────────────────────────────── */

export function CreateListingView() {
  return (
    <AuthGate require="SUPPLIER">
      <CreateListing />
    </AuthGate>
  );
}

function CreateListing() {
  const user = useAuth((s) => s.user)!;
  const openSupply = useAkuafo((s) => s.openSupply);
  const setView = useAkuafo((s) => s.setView);
  const queryClient = useQueryClient();

  const supplierCode = user.supplierCode ?? null;
  const { data: supplier } = useQuery({
    queryKey: ["supplier", supplierCode],
    queryFn: () => fetchSupplierProfile(supplierCode!),
    enabled: !!supplierCode,
    staleTime: 60_000,
  });

  const [form, setForm] = useState<ListingForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  /* Tracks which supplier profile the location fields were prefilled from
     (React's adjust-state-during-render pattern, no effect needed). */
  const [prefillSource, setPrefillSource] = useState<string | null>(null);

  if (supplier && supplier.id !== prefillSource) {
    setPrefillSource(supplier.id);
    setForm((f) =>
      f.town === "" && f.region === ""
        ? { ...f, town: supplier.town, region: supplier.region }
        : f,
    );
  }

  const set = <K extends keyof ListingForm>(key: K, value: ListingForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (key in e ? { ...e, [key]: undefined } : e));
  };

  const publish = useMutation({
    mutationFn: async (payload: CreateSupplyPayload) => {
      const res = await authFetch("/api/supplies", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error ?? "Failed to publish listing") as Error & {
          status?: number;
        };
        err.status = res.status;
        throw err;
      }
      return data.supply as Supply;
    },
    onSuccess: (supply) => {
      toast.success("Listing published", {
        description: "Your lot is now live in the marketplace.",
      });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", supplierCode] });
      // Let the toast land before the view unmounts, then open the new lot.
      window.setTimeout(() => openSupply(supply.id), 900);
    },
    onError: (err) => {
      const status = (err as Error & { status?: number }).status;
      if (status === 401) {
        toast.error("Please sign in to list produce", {
          description: "Your supplier session has expired.",
        });
        setView("signin");
        return;
      }
      toast.error("Couldn't publish listing", { description: err.message });
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (errs.name || errs.quantityKg || errs.pricePerKg) return;
    publish.mutate({
      name: form.name.trim(),
      category: form.category,
      quantityKg: Number(form.quantityKg),
      pricePerKg: Number(form.pricePerKg),
      grade: form.grade,
      harvestStart: form.harvestStart || null,
      harvestEnd: form.harvestEnd || null,
      description: form.description.trim(),
      imageUrl: form.imageUrl,
      minOrderKg: Number(form.minOrderKg) || 100,
      deliveryAvailable: form.deliveryAvailable,
    });
  }

  const previewQty = parsePositive(form.quantityKg);
  const previewPrice = parsePositive(form.pricePerKg);
  const previewName = form.name.trim() || "Untitled lot";
  const previewTown = form.town.trim() || supplier?.town || "Town";
  const previewRegion = form.region || supplier?.region || "Region";
  const previewAlt =
    PRESET_IMAGES.find((i) => i.src === form.imageUrl)?.alt ?? `${previewName} photograph`;

  const submitting = publish.isPending || publish.isSuccess;

  return (
    <main id="main" className="min-h-[70vh] bg-background">
      <Toaster
        position="bottom-right"
        offset={88}
        toastOptions={{
          style: { borderRadius: "0.625rem", border: "1px solid var(--border)" },
          classNames: { title: "ax-label", description: "text-xs text-muted-foreground" },
        }}
      />
      <div className="mx-auto max-w-[1440px] px-4 pt-28 pb-24 sm:px-6 lg:px-10">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="pb-10 lg:pb-12">
          <Eyebrow>New listing</Eyebrow>
          <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight text-ink dark:text-cream sm:text-6xl">
            List your <span className="italic">produce.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Your lot goes live for verified buyers immediately.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* ── Form ─────────────────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-7 lg:pr-4"
            aria-label="Create listing"
          >
            {/* The lot */}
            <fieldset className="border-t border-border pt-8">
              <legend className="ax-label text-foreground">The lot</legend>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <Field
                  id="listing-name"
                  label="Commodity name"
                  error={errors.name}
                  hint="Start typing for common Ghanaian commodities."
                  className="sm:col-span-2"
                >
                  <Input
                    id="listing-name"
                    list="commodity-suggestions"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Tomatoes"
                    autoComplete="off"
                    aria-invalid={!!errors.name}
                    className={inputClass}
                  />
                  <datalist id="commodity-suggestions">
                    {COMMODITY_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </Field>

                <Field id="listing-category" label="Category">
                  <Select
                    value={form.category}
                    onValueChange={(v) => set("category", v)}
                  >
                    <SelectTrigger id="listing-category" className={triggerClass} aria-label="Category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_LABEL[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field id="listing-grade" label="Quality">
                  <Select value={form.grade} onValueChange={(v) => set("grade", v)}>
                    <SelectTrigger id="listing-grade" className={triggerClass} aria-label="Quality grade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {GRADE_LABEL[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </fieldset>

            {/* Quantity & pricing */}
            <fieldset className="border-t border-border pt-8">
              <legend className="ax-label text-foreground">Quantity &amp; pricing</legend>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <Field
                  id="listing-quantity"
                  label="Quantity available · kg"
                  error={errors.quantityKg}
                >
                  <Input
                    id="listing-quantity"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={form.quantityKg}
                    onChange={(e) => set("quantityKg", e.target.value)}
                    placeholder="e.g. 2800"
                    aria-invalid={!!errors.quantityKg}
                    className={inputClass}
                  />
                </Field>

                <Field id="listing-price" label="Price per kg · GH₵" error={errors.pricePerKg}>
                  <Input
                    id="listing-price"
                    type="number"
                    min={0}
                    step="0.1"
                    inputMode="decimal"
                    value={form.pricePerKg}
                    onChange={(e) => set("pricePerKg", e.target.value)}
                    placeholder="e.g. 8.40"
                    aria-invalid={!!errors.pricePerKg}
                    className={inputClass}
                  />
                </Field>

                <Field id="listing-min-order" label="Minimum order · kg" hint="Buyers must request at least this much.">
                  <Input
                    id="listing-min-order"
                    type="number"
                    min={50}
                    step={10}
                    inputMode="numeric"
                    value={form.minOrderKg}
                    onChange={(e) => set("minOrderKg", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="listing-delivery" className="ax-label text-muted-foreground">
                    Delivery available
                  </Label>
                  <div className="flex h-11 items-center justify-between rounded-lg border border-input px-3">
                    <span className="text-sm text-muted-foreground">
                      {form.deliveryAvailable ? "Deliver to buyer destinations" : "Farm-gate pickup only"}
                    </span>
                    <Switch
                      id="listing-delivery"
                      checked={form.deliveryAvailable}
                      onCheckedChange={(v) => set("deliveryAvailable", v)}
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Harvest & location */}
            <fieldset className="border-t border-border pt-8">
              <legend className="ax-label text-foreground">Harvest &amp; location</legend>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <Field id="listing-harvest-start" label="Harvest window start">
                  <Input
                    id="listing-harvest-start"
                    type="date"
                    value={form.harvestStart}
                    onChange={(e) => set("harvestStart", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field id="listing-harvest-end" label="Harvest window end">
                  <Input
                    id="listing-harvest-end"
                    type="date"
                    value={form.harvestEnd}
                    onChange={(e) => set("harvestEnd", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field
                  id="listing-town"
                  label="Town"
                  hint={supplier ? `Prefilled from ${supplier.name}.` : undefined}
                >
                  <Input
                    id="listing-town"
                    value={form.town}
                    onChange={(e) => set("town", e.target.value)}
                    placeholder="e.g. Akomadan"
                    autoComplete="off"
                    className={inputClass}
                  />
                </Field>

                <Field id="listing-region" label="Region">
                  <Select value={form.region} onValueChange={(v) => set("region", v)}>
                    <SelectTrigger id="listing-region" className={triggerClass} aria-label="Region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {GHANA_REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </fieldset>

            {/* Description */}
            <fieldset className="border-t border-border pt-8">
              <legend className="ax-label text-foreground">Description</legend>
              <div className="mt-6">
                <Field
                  id="listing-description"
                  label="Lot description"
                  hint="Variety, grading, packing. What buyers need to know."
                >
                  <Textarea
                    id="listing-description"
                    rows={4}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="e.g. Pectofix variety grown under irrigation, graded 60–80 g, packed in 20 kg crates…"
                    className="rounded-lg"
                  />
                </Field>
              </div>
            </fieldset>

            {/* Photograph */}
            <fieldset className="border-t border-border pt-8">
              <legend className="ax-label text-foreground">Photograph</legend>
              <p className="mt-3 text-xs text-muted-foreground">
                Choose the photograph that best represents this lot.
              </p>
              <div
                className="mt-5 grid grid-cols-4 gap-2"
                role="radiogroup"
                aria-label="Listing photograph"
              >
                {PRESET_IMAGES.map((img) => {
                  const selected = form.imageUrl === img.src;
                  return (
                    <button
                      key={img.src}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={img.alt}
                      onClick={() => set("imageUrl", img.src)}
                      className={cn(
                        "relative aspect-square cursor-pointer overflow-hidden rounded-lg transition-all active:scale-[0.98]",
                        selected
                          ? "ring-2 ring-forest dark:ring-cream"
                          : "ring-2 ring-transparent hover:ring-forest/40 dark:hover:ring-cream/40",
                      )}
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(min-width: 1024px) 9vw, 22vw"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Submit */}
            <div className="mt-10 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
              <CtaPrimary type="submit" loading={publish.isPending} disabled={submitting} className="w-full sm:w-auto">
                {publish.isSuccess ? "Published" : "Publish listing"}
              </CtaPrimary>
              <p className="text-xs text-muted-foreground">
                Listings publish under{" "}
                <span className="text-foreground">
                  {supplier?.name ?? user.businessName ?? "your supplier account"}
                </span>
                {supplier ? ` · ${supplier.town}` : ""}.
              </p>
            </div>
          </form>

          {/* ── Live preview ─────────────────────────────────────────────── */}
          <aside className="lg:col-span-5" aria-label="Live listing preview">
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">
              <p className="ax-label text-muted-foreground">Live preview</p>
              <div className="rounded-xl border border-border bg-card">
                <div className="relative aspect-[4/3] rounded-t-xl border-b border-border">
                  <Image
                    src={form.imageUrl}
                    alt={previewAlt}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="rounded-t-xl object-cover"
                  />
                  <span className="ax-data absolute right-3 top-3 rounded-md bg-ink/60 px-2 py-1 text-[10px] text-cream">
                    AKM-205xx
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <h2 className="font-display text-3xl leading-none tracking-tight text-ink dark:text-cream">
                      {previewName}
                    </h2>
                    <p className="ax-data text-lg text-ink dark:text-cream">
                      {formatCedis(previewPrice)}
                      <span className="text-xs text-muted-foreground"> /KG</span>
                    </p>
                  </div>
                  <p className="ax-data mt-3 text-xs font-medium text-forest dark:text-olive-light">
                    {formatKg(previewQty)} AVAILABLE
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {previewTown} · {previewRegion}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {GRADE_LABEL[form.grade]} · {harvestWindowLabel(form.harvestStart, form.harvestEnd)}
                  </p>
                  <p className="ax-data mt-4 border-t border-border pt-4 text-[11px] text-muted-foreground">
                    MIN ORDER {formatKg(Number(form.minOrderKg) || 0)} ·{" "}
                    {form.deliveryAvailable ? "DELIVERY AVAILABLE" : "PICKUP ONLY"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
