// ── AkuafoMarket shared DTO types (client + API) ─────────────────────────

export type SupplierSummary = {
  id: string;
  code: string;
  name: string;
  type: string;
  region: string;
  district: string;
  town: string;
  verified: boolean;
  yearsOperating: number;
  completedOrders: number;
  fulfilmentRate: number;
  responseTimeHrs: number;
  imageUrl: string | null;
  lat: number;
  lon: number;
};

export type Supply = {
  id: string;
  code: string;
  name: string;
  category: string;
  quantityKg: number;
  totalQuantityKg: number;
  pricePerKg: number;
  grade: string;
  harvestStart: string | null;
  harvestEnd: string | null;
  description: string;
  imageUrl: string;
  available: boolean;
  deliveryAvailable: boolean;
  minOrderKg: number;
  createdAt: string;
  supplier: SupplierSummary;
};

export type OrderEvent = {
  id: string;
  status: string;
  note: string;
  timestamp: string;
};

export type Order = {
  id: string;
  code: string;
  buyerName: string;
  buyerCompany: string;
  quantityKg: number;
  unitPrice: number;
  productValue: number;
  deliveryFee: number;
  deliveryMethod: string;
  destination: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  supply: {
    id: string;
    code: string;
    name: string;
    imageUrl: string;
    grade: string;
    supplier: {
      id: string;
      name: string;
      town: string;
      region: string;
      lat: number;
      lon: number;
      verified: boolean;
    };
  };
  events?: OrderEvent[];
};

export type SupplierProfile = SupplierSummary & {
  description: string;
  supplies: Supply[];
  activeOrders: number;
};

export const ORDER_JOURNEY = [
  "REQUESTED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "IN_TRANSIT",
  "DELIVERED",
] as const;

export type OrderStatus = (typeof ORDER_JOURNEY)[number];

export const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const GRADE_LABEL: Record<string, string> = {
  GRADE_A: "Grade A",
  GRADE_B: "Grade B",
  FIELD_RUN: "Field Run",
};

export const CATEGORY_LABEL: Record<string, string> = {
  VEGETABLE: "Vegetables",
  GRAIN: "Grains",
  TUBER: "Tubers & Roots",
  FRUIT: "Fruits",
  LEGUME: "Legumes",
};

export const GHANA_REGIONS = [
  "Ashanti",
  "Bono East",
  "Ahafo",
  "Eastern",
  "Volta",
  "Central",
  "Greater Accra",
  "Western",
  "Northern",
  "North East",
  "Upper East",
  "Upper West",
];

export function formatCedis(v: number, decimals = 2): string {
  return `GH₵ ${v.toLocaleString("en-GH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatKg(v: number): string {
  return `${v.toLocaleString("en-GH")} KG`;
}
