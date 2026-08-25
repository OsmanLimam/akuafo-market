"use client";

import { useMemo, useState } from "react";
import { Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Supply } from "@/lib/types";
import { formatCedis, formatKg } from "@/lib/types";

/* ────────────────────────────────────────────────────────────────────────
   GhanaMap, a recognisable, geographic map of Ghana.

   · Smoothed national boundary from real border coordinates
   · Volta Lake drawn from its actual spine
   · Neighbouring countries and the Gulf of Guinea labelled
   · Road-network graph routes orders along real corridors
   · Supplier markers, selection cards, and vehicle position
   ──────────────────────────────────────────────────────────────────────── */

const W = 500;
const H = 690;
const LON_MIN = -3.5;
const LON_MAX = 1.5;
const LAT_MIN = 4.5;
const LAT_MAX = 11.4;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
  return [x, y];
}

/* Ghana national boundary, approximate real border, clockwise from the
   western coast through the north, down the Togo border and along the
   Gulf of Guinea coast. */
const BOUNDARY: [number, number][] = [
  [-3.24, 5.09],
  [-2.95, 5.35],
  [-2.75, 5.6],
  [-2.85, 6.1],
  [-2.7, 6.6],
  [-2.8, 7.1],
  [-2.6, 7.6],
  [-2.75, 8.1],
  [-2.55, 8.6],
  [-2.75, 9.1],
  [-2.6, 9.6],
  [-2.75, 9.95],
  [-2.6, 10.35],
  [-2.75, 10.55],
  [-2.35, 10.95],
  [-1.8, 11.08],
  [-1.1, 11.0],
  [-0.55, 11.03],
  [-0.05, 11.09],
  [0.3, 11.0],
  [0.1, 10.6],
  [0.3, 10.2],
  [0.15, 9.9],
  [0.35, 9.5],
  [0.25, 9.2],
  [0.5, 9.0],
  [0.4, 8.7],
  [0.55, 8.3],
  [0.25, 8.0],
  [0.45, 7.7],
  [0.35, 7.4],
  [0.55, 7.0],
  [0.7, 6.6],
  [1.19, 6.1],
  [0.63, 5.78],
  [0.02, 5.63],
  [-0.19, 5.55],
  [-0.63, 5.35],
  [-1.25, 5.1],
  [-1.7, 4.94],
  [-1.75, 4.74],
  [-2.24, 4.87],
];

/* Volta Lake, the distinctive water spine of the east */
const LAKE_SOUTH: [number, number][] = [
  [0.04, 6.28],
  [0.12, 6.55],
  [0.35, 6.85],
  [0.2, 7.15],
  [0.42, 7.45],
];
const LAKE_NORTH: [number, number][] = [
  [0.42, 7.45],
  [0.25, 7.75],
  [0.45, 8.05],
  [0.38, 8.4],
  [0.55, 8.75],
  [0.45, 9.05],
  [0.6, 9.35],
];

/* Reference cities */
const CITIES: { name: string; lon: number; lat: number; capital?: boolean; anchor?: "start" | "end" }[] = [
  { name: "Accra", lon: -0.19, lat: 5.55, capital: true, anchor: "end" },
  { name: "Kumasi", lon: -1.62, lat: 6.69, anchor: "end" },
  { name: "Tamale", lon: -0.84, lat: 9.4, anchor: "end" },
  { name: "Takoradi", lon: -1.76, lat: 4.9, anchor: "end" },
];

/* Major road corridors for realistic routing (approximate junctions) */
const ROAD_NODES: Record<string, { lon: number; lat: number; roads: string[] }> = {
  accra: { lon: -0.19, lat: 5.56, roads: ["nsawam", "tema"] },
  tema: { lon: 0.02, lat: 5.66, roads: ["accra"] },
  nsawam: { lon: -0.23, lat: 5.81, roads: ["accra", "kumasi", "ho"] },
  ho: { lon: 0.47, lat: 6.6, roads: ["nsawam"] },
  kumasi: { lon: -1.62, lat: 6.69, roads: ["nsawam", "akomadan", "ejura", "sunyani"] },
  akomadan: { lon: -1.98, lat: 6.92, roads: ["kumasi"] },
  ejura: { lon: -1.37, lat: 7.38, roads: ["kumasi", "techiman"] },
  techiman: { lon: -1.85, lat: 7.59, roads: ["ejura", "kintampo", "sunyani"] },
  sunyani: { lon: -2.33, lat: 7.33, roads: ["kumasi", "techiman", "goaso"] },
  goaso: { lon: -2.93, lat: 6.8, roads: ["sunyani"] },
  kintampo: { lon: -1.75, lat: 8.05, roads: ["techiman", "tamale"] },
  tamale: { lon: -0.84, lat: 9.4, roads: ["kintampo", "yendi"] },
  yendi: { lon: -0.01, lat: 9.44, roads: ["tamale", "bawku"] },
  bawku: { lon: -0.35, lat: 11.05, roads: ["yendi"] },
};

function nearestNode(lon: number, lat: number): string {
  let best = "kumasi";
  let bestD = Infinity;
  for (const [id, n] of Object.entries(ROAD_NODES)) {
    const d = (n.lon - lon) ** 2 + (n.lat - lat) ** 2;
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

function bfsPath(from: string, to: string): string[] {
  if (from === to) return [from];
  const prev: Record<string, string> = {};
  const queue = [from];
  const seen = new Set([from]);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of ROAD_NODES[cur].roads) {
      if (seen.has(next)) continue;
      seen.add(next);
      prev[next] = cur;
      if (next === to) {
        const path = [to];
        let p = to;
        while (prev[p]) {
          p = prev[p];
          path.unshift(p);
        }
        return path;
      }
      queue.push(next);
    }
  }
  return [from];
}

/** Build a road-following polyline between two geographic points. */
export function buildRoutePath(
  from: { lon: number; lat: number },
  to: { lon: number; lat: number },
): [number, number][] {
  const start = nearestNode(from.lon, from.lat);
  const end = nearestNode(to.lon, to.lat);
  const nodePath = bfsPath(start, end);
  const pts: [number, number][] = [[from.lon, from.lat]];
  for (const id of nodePath) {
    const n = ROAD_NODES[id];
    pts.push([n.lon, n.lat]);
  }
  pts.push([to.lon, to.lat]);
  return pts;
}

/* Smooth open polyline (quadratic through midpoints) */
function smoothLine(lonLat: [number, number][]): string {
  const p = lonLat.map(([lon, lat]) => project(lon, lat));
  if (p.length < 3) return p.map((q, i) => `${i ? "L" : "M"}${q[0]},${q[1]}`).join(" ");
  let d = `M${p[0][0]},${p[0][1]}`;
  d += ` L${(p[0][0] + p[1][0]) / 2},${(p[0][1] + p[1][1]) / 2}`;
  for (let i = 1; i < p.length - 1; i++) {
    d += ` Q${p[i][0]},${p[i][1]} ${(p[i][0] + p[i + 1][0]) / 2},${(p[i][1] + p[i + 1][1]) / 2}`;
  }
  d += ` L${p[p.length - 1][0]},${p[p.length - 1][1]}`;
  return d;
}

/* Smooth closed boundary */
function smoothClosed(lonLat: [number, number][]): string {
  const p = lonLat.map(([lon, lat]) => project(lon, lat));
  const n = p.length;
  let d = `M${(p[0][0] + p[n - 1][0]) / 2},${(p[0][1] + p[n - 1][1]) / 2}`;
  for (let i = 0; i < n; i++) {
    const cur = p[i];
    const next = p[(i + 1) % n];
    d += ` Q${cur[0].toFixed(1)},${cur[1].toFixed(1)} ${((cur[0] + next[0]) / 2).toFixed(1)},${((cur[1] + next[1]) / 2).toFixed(1)}`;
  }
  return d + " Z";
}

/* Point at fraction t along a projected polyline (by arc length) */
function pointAlong(lonLat: [number, number][], t: number): { x: number; y: number; angle: number } {
  const p = lonLat.map(([lon, lat]) => project(lon, lat));
  const segs = p.slice(1).map((q, i) => Math.hypot(q[0] - p[i][0], q[1] - p[i][1]));
  const total = segs.reduce((s, x) => s + x, 0);
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const f = segs[i] === 0 ? 0 : target / segs[i];
      const a = p[i];
      const b = p[i + 1];
      return {
        x: a[0] + (b[0] - a[0]) * f,
        y: a[1] + (b[1] - a[1]) * f,
        angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
      };
    }
    target -= segs[i];
  }
  const last = p[p.length - 1];
  return { x: last[0], y: last[1], angle: 0 };
}

export interface MapRoute {
  from: { lat: number; lon: number; label: string };
  to: { lat: number; lon: number; label: string };
  label?: string;
  /** 0–1: position of the vehicle along the route (order tracking) */
  progress?: number;
}

export function GhanaMap({
  supplies = [],
  routes = [],
  selectedId,
  onSelectSupply,
  className,
}: {
  supplies?: Supply[];
  routes?: MapRoute[];
  selectedId?: string | null;
  onSelectSupply?: (s: Supply) => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState<Supply | null>(null);
  const [internalSelected, setInternalSelected] = useState<string | null>(null);

  const selected =
    supplies.find((s) => s.id === (selectedId ?? internalSelected)) ?? null;

  const boundaryPath = useMemo(() => smoothClosed(BOUNDARY), []);
  const lakeSouth = useMemo(() => smoothLine(LAKE_SOUTH), []);
  const lakeNorth = useMemo(() => smoothLine(LAKE_NORTH), []);

  const maxQty = supplies.length > 0 ? Math.max(1, ...supplies.map((s) => s.quantityKg)) : 1;

  const dots = supplies.map((s) => {
    const [x, y] = project(s.supplier.lon, s.supplier.lat);
    const r = 5 + (s.quantityKg / maxQty) * 6;
    return { s, x, y, r };
  });

  const routeEls = routes.map((r, i) => {
    const path = buildRoutePath(r.from, r.to);
    const d = smoothLine(path);
    const [ox, oy] = project(r.from.lon, r.from.lat);
    const [dx, dy] = project(r.to.lon, r.to.lat);
    const vehicle = r.progress != null ? pointAlong(path, r.progress) : null;
    // Anchor route labels so they never clip at the viewBox edges
    const labelEnd = dx > W * 0.62;
    const labelX = labelEnd ? dx - 10 : dx + 10;
    return { key: i, d, ox, oy, dx, dy, label: r.label, vehicle, labelX, labelEnd };
  });

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Map of Ghana showing supplier locations and supply routes"
      >
        <defs>
          {/* Subtle printed-map dot texture */}
          <pattern id="ax-dots" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" className="fill-forest" opacity="0.12" />
          </pattern>
          <clipPath id="ax-ghana">
            <path d={boundaryPath} />
          </clipPath>
        </defs>

        {/* Graticule (clipped to land) */}
        <g clipPath="url(#ax-ghana)" aria-hidden>
          {[-3, -1, 1].map((lon) => {
            const [x] = project(lon, 0);
            return <line key={lon} x1={x} y1={0} x2={x} y2={H} className="stroke-forest/10" strokeWidth="0.7" strokeDasharray="2 6" />;
          })}
          {[6, 8, 10].map((lat) => {
            const [, y] = project(0, lat);
            return <line key={lat} x1={0} y1={y} x2={W} y2={y} className="stroke-forest/10" strokeWidth="0.7" strokeDasharray="2 6" />;
          })}
        </g>

        {/* Land */}
        <path
          d={boundaryPath}
          className="fill-cream-dim stroke-forest/50 dark:fill-[#20291f] dark:stroke-cream/45"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <path d={boundaryPath} fill="url(#ax-dots)" aria-hidden />

        {/* Volta Lake */}
        <g aria-hidden>
          <path d={lakeSouth} fill="none" className="stroke-[#5f8391]" strokeWidth={9} strokeLinecap="round" opacity={0.65} />
          <path d={lakeNorth} fill="none" className="stroke-[#5f8391]" strokeWidth={5} strokeLinecap="round" opacity={0.65} />
        </g>

        {/* Neighbour labels + gulf */}
        <text x={58} y={330} transform="rotate(-90 58 330)" textAnchor="middle" className="ax-label fill-forest/35 text-[10px] dark:fill-cream/30" aria-hidden>
          CÔTE D'IVOIRE
        </text>
        <text x={250} y={34} textAnchor="middle" className="ax-label fill-forest/35 text-[10px] dark:fill-cream/30" aria-hidden>
          BURKINA FASO
        </text>
        <text x={452} y={300} transform="rotate(-90 452 300)" textAnchor="middle" className="ax-label fill-forest/35 text-[10px] dark:fill-cream/30" aria-hidden>
          TOGO
        </text>
        <text x={330} y={620} textAnchor="middle" className="font-display text-[13px] italic fill-forest/40 dark:fill-cream/35" aria-hidden>
          Gulf of Guinea
        </text>

        {/* Reference cities */}
        {CITIES.map((c) => {
          const [x, y] = project(c.lon, c.lat);
          return (
            <g key={c.name} aria-hidden>
              {c.capital ? (
                <>
                  <circle cx={x} cy={y} r={7} className="fill-none stroke-forest/70 dark:stroke-cream/70" strokeWidth={1.4} />
                  <circle cx={x} cy={y} r={3} className="fill-forest/80 dark:fill-cream/80" />
                </>
              ) : (
                <rect x={x - 2.6} y={y - 2.6} width={5.2} height={5.2} className="fill-forest/65 dark:fill-cream/65" />
              )}
              <text
                x={c.anchor === "end" ? x - 10 : x + 10}
                y={y + 3.5}
                textAnchor={c.anchor ?? "start"}
                className="fill-forest/75 text-[10px] font-semibold tracking-[0.1em] dark:fill-cream/75"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {c.name.toUpperCase()}
                {c.capital ? " ★" : ""}
              </text>
            </g>
          );
        })}

        {/* Routes */}
        {routeEls.map(({ key, d, ox, oy, dx, dy, label, vehicle, labelX, labelEnd }) => (
          <g key={key}>
            <path d={d} fill="none" className="stroke-terracotta/30 dark:stroke-terracotta/50" strokeWidth={3.4} strokeLinecap="round" />
            <path
              d={d}
              fill="none"
              className="ax-route stroke-terracotta dark:stroke-terracotta"
              strokeWidth={1.8}
              style={{ mixBlendMode: "normal" }}
              strokeDasharray="4 8"
              strokeLinecap="round"
            />
            {/* origin */}
            <circle cx={ox} cy={oy} r={5} className="fill-terracotta stroke-cream dark:stroke-[#20291f]" strokeWidth={2} />
            {/* destination */}
            <rect x={dx - 4.5} y={dy - 4.5} width={9} height={9} className="fill-terracotta stroke-cream dark:stroke-[#20291f]" strokeWidth={2} />
            {label && (
              <text
                x={labelX}
                y={dy + 3}
                textAnchor={labelEnd ? "end" : "start"}
                className="ax-data fill-terracotta-deep text-[10px] dark:fill-terracotta"
              >
                {label}
              </text>
            )}
            {vehicle && (
              <g transform={`translate(${vehicle.x},${vehicle.y})`}>
                <circle r={11} className="fill-cream dark:fill-[#20291f]" />
                <circle r={11} className="fill-none stroke-terracotta" strokeWidth={1.6} />
                <path
                  d="M-3.2 1.2 L-3.2 -2.4 L2.2 -2.4 L4 0 L4 1.2 Z M-3.2 1.2 L-4.4 1.2 L-4.4 2.8 L4 2.8 L4 1.2"
                  className="fill-terracotta"
                  transform="translate(0,-0.4) scale(1.05)"
                />
              </g>
            )}
          </g>
        ))}

        {/* Supplier markers */}
        {dots.map(({ s, x, y, r }) => {
          const isHovered = hovered?.id === s.id;
          const isSelected = selected?.id === s.id;
          return (
            <g key={s.id}>
              {isSelected && (
                <circle cx={x} cy={y} r={r + 4} className="ax-pulse fill-terracotta" aria-hidden />
              )}
              <circle
                cx={x}
                cy={y}
                r={r + 8}
                className="fill-transparent"
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered((h) => (h?.id === s.id ? null : h))}
                onClick={() => setInternalSelected(s.id)}
                tabIndex={0}
                role="button"
                aria-label={`${s.name} in ${s.supplier.town}, ${s.supplier.region}. ${formatKg(s.quantityKg)} available at ${formatCedis(s.pricePerKg)} per kilogram.`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setInternalSelected(s.id);
                  }
                }}
              />
              <circle
                cx={x}
                cy={y}
                r={r}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  isHovered || isSelected
                    ? "fill-terracotta stroke-terracotta"
                    : "fill-forest stroke-forest dark:fill-olive-light dark:stroke-olive-light",
                )}
                strokeOpacity={0.3}
                strokeWidth={4}
                style={{ pointerEvents: "none" }}
              />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5 rounded-lg border border-border bg-card/90 px-3 py-2.5 backdrop-blur-sm">
        <span className="ax-label mb-0.5 text-[8px] text-muted-foreground">Legend</span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-forest dark:bg-olive-light" aria-hidden />
          <span className="ax-label text-[8px] text-muted-foreground">Supply</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 bg-terracotta" aria-hidden />
          <span className="ax-label text-[8px] text-muted-foreground">Route</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border border-forest/70 dark:border-cream/70" aria-hidden />
          <span className="ax-label text-[8px] text-muted-foreground">Capital</span>
        </span>
      </div>

      {/* Hover card */}
      {hovered && (!selected || hovered.id !== selected.id) && (
        <div
          className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-lg border border-border bg-card/95 p-3 backdrop-blur-sm sm:left-auto sm:max-w-64"
          aria-live="polite"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-lg leading-none text-ink dark:text-cream">
              {hovered.name}
            </span>
            <span className="ax-data text-xs font-medium text-terracotta-deep dark:text-terracotta">
              {formatCedis(hovered.pricePerKg)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <span className="ax-label text-[9px] text-muted-foreground">
              {hovered.supplier.town} · {hovered.supplier.region}
            </span>
            <span className="ax-data text-[11px] text-muted-foreground">{formatKg(hovered.quantityKg)}</span>
          </div>
        </div>
      )}

      {/* Selected location card */}
      {selected && (
        <div
          className="absolute bottom-3 left-3 right-3 rounded-xl border border-border bg-card p-4 shadow-lg sm:left-auto sm:max-w-72"
          role="dialog"
          aria-label={`${selected.name} supply details`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl leading-none tracking-tight text-ink dark:text-cream">
                {selected.name}
              </h3>
              <p className="ax-label mt-1.5 text-[9px] text-muted-foreground">
                {selected.supplier.town} · {selected.supplier.region}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInternalSelected(null)}
              aria-label="Close supply card"
              className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-forest/5 hover:text-foreground dark:hover:bg-cream/10"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3">
            <span className="ax-data text-lg font-medium text-ink dark:text-cream">
              {formatKg(selected.quantityKg)}
            </span>
            <span className="ax-data text-lg font-medium text-terracotta-deep dark:text-terracotta">
              {formatCedis(selected.pricePerKg)}
              <span className="text-[10px] text-muted-foreground"> /KG</span>
            </span>
          </div>
          {onSelectSupply && (
            <button
              type="button"
              onClick={() => onSelectSupply(selected)}
              className="ax-label mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-forest text-[10.5px] text-cream transition-all hover:bg-forest-mid active:scale-[0.98] dark:bg-cream dark:text-ink"
            >
              View supply
            </button>
          )}
        </div>
      )}
    </div>
  );
}
