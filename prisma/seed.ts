import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const DEMO_PASSWORD = "market123";

const now = new Date();
const daysAgo = (d: number, h = 0) => new Date(now.getTime() - d * 86400000 - h * 3600000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

async function main() {
  await db.orderEvent.deleteMany();
  await db.order.deleteMany();
  await db.session.deleteMany();
  await db.passwordReset.deleteMany();
  await db.supply.deleteMany();
  await db.supplier.deleteMany();
  await db.user.deleteMany();

  // ── Suppliers ─────────────────────────────────────────────────────────
  const akwasi = await db.supplier.create({
    data: {
      code: "SUP-1042",
      name: "Akwasi Farms",
      type: "FARM",
      region: "Ashanti",
      district: "Offinso North",
      town: "Akomadan",
      verified: true,
      yearsOperating: 12,
      completedOrders: 148,
      fulfilmentRate: 0.96,
      responseTimeHrs: 4,
      description:
        "A family-run vegetable operation on 140 hectares in the Offinso North district. Akwasi Farms has supplied tomato and pepper to wholesalers and processors across Ashanti and Greater Accra since 2013, with on-farm grading and crate packing.",
      imageUrl: "/images/supplier-akwasi.png",
      lat: 6.92,
      lon: -1.98,
    },
  });

  const techiman = await db.supplier.create({
    data: {
      code: "SUP-1077",
      name: "Techiman Grain Cooperative",
      type: "COOPERATIVE",
      region: "Bono East",
      district: "Techiman Municipal",
      town: "Techiman",
      verified: true,
      yearsOperating: 18,
      completedOrders: 312,
      fulfilmentRate: 0.98,
      responseTimeHrs: 6,
      description:
        "A 240-member grain cooperative operating from the Techiman central market belt. The cooperative aggregates maize and soybean from member farms, dries to 13% moisture, and bags in 100 kg woven sacks.",
      imageUrl: "/images/supplier-grace.png",
      lat: 7.59,
      lon: -1.85,
    },
  });

  const volta = await db.supplier.create({
    data: {
      code: "SUP-1103",
      name: "Volta Roots Agro",
      type: "AGGREGATOR",
      region: "Volta",
      district: "Afadzato South",
      town: "Dodi",
      verified: true,
      yearsOperating: 7,
      completedOrders: 86,
      fulfilmentRate: 0.94,
      responseTimeHrs: 8,
      description:
        "A cassava aggregation hub serving smallholders along the eastern corridor. Roots are harvested to order, weighed at the Dodi collection centre, and loaded same-day for starch and gari processors.",
      imageUrl: "/images/supplier-kwame.png",
      lat: 6.95,
      lon: 0.25,
    },
  });

  const goaso = await db.supplier.create({
    data: {
      code: "SUP-1121",
      name: "Goaso Plantain Alliance",
      type: "COOPERATIVE",
      region: "Ahafo",
      district: "Asunafo North",
      town: "Goaso",
      verified: true,
      yearsOperating: 9,
      completedOrders: 121,
      fulfilmentRate: 0.95,
      responseTimeHrs: 10,
      description:
        "A producer alliance of 96 farms in the Asunafo cocoa–plantain belt. Bunches are cut to specification, graded by finger size, and packed in ventilated field crates for urban wholesalers.",
      lat: 6.8,
      lon: -2.93,
    },
  });

  const ejura = await db.supplier.create({
    data: {
      code: "SUP-1156",
      name: "Ejura Yam Traders",
      type: "AGGREGATOR",
      region: "Ashanti",
      district: "Ejura-Sekyedumase",
      town: "Ejura",
      verified: true,
      yearsOperating: 15,
      completedOrders: 203,
      fulfilmentRate: 0.92,
      responseTimeHrs: 12,
      description:
        "An aggregator at the Ejura yam market, one of West Africa's largest. Puna and serwaa yam are cured, graded by tuber weight, and stacked to order for southern retail chains and exporters.",
      lat: 7.38,
      lon: -1.37,
    },
  });

  const bunso = await db.supplier.create({
    data: {
      code: "SUP-1188",
      name: "Bunso Pineapple Estate",
      type: "ESTATE",
      region: "Eastern",
      district: "East Akim",
      town: "Bunso",
      verified: true,
      yearsOperating: 11,
      completedOrders: 167,
      fulfilmentRate: 0.97,
      responseTimeHrs: 5,
      description:
        "A 210-hectare smooth cayenne estate on the Accra–Kumasi corridor. Fruit is harvested at buyers' specified brix stage, crown-trimmed, and packed for fresh market and juice processing.",
      lat: 6.3,
      lon: -0.75,
    },
  });

  const nsawam = await db.supplier.create({
    data: {
      code: "SUP-1204",
      name: "Nsawam Fresh Collective",
      type: "COOPERATIVE",
      region: "Eastern",
      district: "Nsawam Adoagyiri",
      town: "Nsawam",
      verified: true,
      yearsOperating: 5,
      completedOrders: 54,
      fulfilmentRate: 0.91,
      responseTimeHrs: 6,
      description:
        "A young growers' collective supplying fresh vegetables to Accra restaurants and retail. Harvest is cut to order in the cool of morning and moved the same day on the N4 corridor.",
      lat: 5.8,
      lon: -0.23,
    },
  });

  const yendi = await db.supplier.create({
    data: {
      code: "SUP-1231",
      name: "Yendi Mango Partners",
      type: "FARM",
      region: "Northern",
      district: "Yendi Municipal",
      town: "Yendi",
      verified: true,
      yearsOperating: 8,
      completedOrders: 79,
      fulfilmentRate: 0.93,
      responseTimeHrs: 14,
      description:
        "An orchard partnership managing 85 hectares of keitt and kent mango under a hot-water treatment pack line, supplying processors and exporters from the Northern corridor.",
      lat: 9.44,
      lon: -0.01,
    },
  });

  const walewale = await db.supplier.create({
    data: {
      code: "SUP-1247",
      name: "Walewale Melon Fields",
      type: "FARM",
      region: "North East",
      district: "West Mamprusi",
      town: "Walewale",
      verified: true,
      yearsOperating: 6,
      completedOrders: 61,
      fulfilmentRate: 0.9,
      responseTimeHrs: 16,
      description:
        "An irrigated melon operation along the White Volta with 60 hectares under drip. Sugar baby and crimson sweet watermelon are cut to order and graded by brix and rind condition.",
      lat: 10.04,
      lon: -0.8,
    },
  });

  const bawku = await db.supplier.create({
    data: {
      code: "SUP-1262",
      name: "Bawku Onion Growers",
      type: "COOPERATIVE",
      region: "Upper East",
      district: "Bawku West",
      town: "Bawku",
      verified: true,
      yearsOperating: 14,
      completedOrders: 158,
      fulfilmentRate: 0.95,
      responseTimeHrs: 18,
      description:
        "A dry-season onion cooperative farming the Bugri irrigation plains. Red onions are field-cured, topped, and packed in 20 kg mesh sacks for southern distribution during the import off-season.",
      lat: 11.05,
      lon: -0.35,
    },
  });

  // ── Supplies ──────────────────────────────────────────────────────────
  const tomatoes = await db.supply.create({
    data: {
      code: "AKM-20491",
      name: "Tomatoes",
      category: "VEGETABLE",
      quantityKg: 2840,
      totalQuantityKg: 3500,
      pricePerKg: 8.4,
      grade: "GRADE_A",
      harvestStart: daysFromNow(5),
      harvestEnd: daysFromNow(11),
      description:
        "Pectofix variety grown under irrigation. Firm, deep-red fruit graded 60–80 g, field-ripened and hand-picked into 20 kg plastic crates. Suitable for fresh retail and minimal processing.",
      imageUrl: "/images/tomatoes.png",
      minOrderKg: 100,
      supplierId: akwasi.id,
    },
  });

  const gardenEggs = await db.supply.create({
    data: {
      code: "AKM-20465",
      name: "Garden Eggs",
      category: "VEGETABLE",
      quantityKg: 1420,
      totalQuantityKg: 1800,
      pricePerKg: 5.2,
      grade: "GRADE_A",
      harvestStart: daysFromNow(2),
      harvestEnd: daysFromNow(10),
      description:
        "Mixed purple and white African eggplant harvested at full firmness with fresh green calyxes. Cut every three days and graded by fruit size, packed in ventilated crates the same morning for the Accra corridor.",
      imageUrl: "/images/garden-eggs.png",
      minOrderKg: 100,
      supplierId: nsawam.id,
    },
  });

  const ginger = await db.supply.create({
    data: {
      code: "AKM-20458",
      name: "Fresh Ginger",
      category: "TUBER",
      quantityKg: 2260,
      totalQuantityKg: 2600,
      pricePerKg: 14.8,
      grade: "GRADE_B",
      harvestStart: daysAgo(4),
      harvestEnd: daysFromNow(3),
      description:
        "Well-cured rhizomes lifted at eight months, brushed clean and graded by hand size. A rotation crop on the tomato blocks with strong pungency and oil content, suited to spice processors and the dry-ginger trade.",
      imageUrl: "/images/ginger.png",
      minOrderKg: 100,
      supplierId: akwasi.id,
    },
  });

  const pawpaw = await db.supply.create({
    data: {
      code: "AKM-20444",
      name: "Pawpaw",
      category: "FRUIT",
      quantityKg: 1650,
      totalQuantityKg: 2100,
      pricePerKg: 4.2,
      grade: "GRADE_A",
      harvestStart: daysFromNow(1),
      harvestEnd: daysFromNow(9),
      description:
        "Solo variety fruit harvested at colour break and ripened in transit. Graded 700 g to 1.2 kg per fruit with stems trimmed, packed in single-layer crates for retail shelves and breakfast service.",
      imageUrl: "/images/pawpaw.png",
      minOrderKg: 150,
      supplierId: bunso.id,
    },
  });

  const pepper = await db.supply.create({
    data: {
      code: "AKM-20487",
      name: "Scotch Bonnet Pepper",
      category: "VEGETABLE",
      quantityKg: 860,
      totalQuantityKg: 1200,
      pricePerKg: 14.2,
      grade: "GRADE_A",
      harvestStart: daysFromNow(2),
      harvestEnd: daysFromNow(9),
      description:
        "High-capsaicin scotch bonnet with uniform colour break. Harvested at full red, sorted by size, and packed in ventilated crates. Preferred by spice processors and the shito trade.",
      imageUrl: "/images/pepper.png",
      minOrderKg: 50,
      supplierId: akwasi.id,
    },
  });

  await db.supply.create({
    data: {
      code: "AKM-20512",
      name: "Okra",
      category: "VEGETABLE",
      quantityKg: 1150,
      totalQuantityKg: 1500,
      pricePerKg: 9.8,
      grade: "GRADE_A",
      harvestStart: daysFromNow(1),
      harvestEnd: daysFromNow(6),
      description:
        "Clemson spineless pods cut at 6–9 cm every 48 hours. Harvested and dispatched the same morning to preserve fibre quality for fresh market and export grading.",
      imageUrl: "/images/okra.png",
      minOrderKg: 50,
      supplierId: nsawam.id,
    },
  });

  const maize = await db.supply.create({
    data: {
      code: "AKM-20338",
      name: "White Maize",
      category: "GRAIN",
      quantityKg: 12500,
      totalQuantityKg: 15000,
      pricePerKg: 3.2,
      grade: "GRADE_A",
      harvestStart: daysAgo(20),
      harvestEnd: daysAgo(6),
      description:
        "Obatanpa variety from the major season, dried to 13% moisture and aflatoxin-screened at the cooperative shed. Supplied in new 100 kg woven sacks, weighbridge-verified.",
      imageUrl: "/images/maize.png",
      minOrderKg: 500,
      supplierId: techiman.id,
    },
  });

  await db.supply.create({
    data: {
      code: "AKM-20355",
      name: "Soybeans",
      category: "LEGUME",
      quantityKg: 4800,
      totalQuantityKg: 6000,
      pricePerKg: 7.4,
      grade: "GRADE_B",
      harvestStart: daysAgo(30),
      harvestEnd: daysAgo(12),
      description:
        "Jenguma variety, machine-cleaned at 12.5% moisture with under 2% impurity. Sourced from cooperative members around Techiman and suited to feed millers and oil extraction.",
      imageUrl: "/images/soybeans.png",
      minOrderKg: 500,
      supplierId: techiman.id,
    },
  });

  await db.supply.create({
    data: {
      code: "AKM-20294",
      name: "Cassava",
      category: "TUBER",
      quantityKg: 18000,
      totalQuantityKg: 24000,
      pricePerKg: 2.1,
      grade: "FIELD_RUN",
      harvestStart: daysFromNow(3),
      harvestEnd: daysFromNow(14),
      description:
        "Ampong variety roots harvested to order from the eastern corridor. Weighed at the Dodi collection centre with same-day loading; ideal for starch, gari and high-quality cassava flour processing.",
      imageUrl: "/images/cassava.png",
      minOrderKg: 1000,
      supplierId: volta.id,
    },
  });

  const plantain = await db.supply.create({
    data: {
      code: "AKM-20320",
      name: "Plantain",
      category: "FRUIT",
      quantityKg: 6300,
      totalQuantityKg: 8000,
      pricePerKg: 5.6,
      grade: "GRADE_A",
      harvestStart: daysFromNow(2),
      harvestEnd: daysFromNow(10),
      description:
        "Apantu and french varieties cut at full mature green. Bunches graded by finger length and packed in ventilated crates, reducing bruising on the southern haul to Accra and Kumasi.",
      imageUrl: "/images/plantain.png",
      minOrderKg: 200,
      supplierId: goaso.id,
    },
  });

  await db.supply.create({
    data: {
      code: "AKM-20273",
      name: "Puna Yam",
      category: "TUBER",
      quantityKg: 9750,
      totalQuantityKg: 12000,
      pricePerKg: 4.5,
      grade: "GRADE_A",
      harvestStart: daysAgo(10),
      harvestEnd: daysFromNow(4),
      description:
        "Well-cured puna yam graded 1.5–2.5 kg per tuber, brushed and stacked for domestic retail chains and export consolidators. Supplied in 50 kg unit loads from the Ejura market.",
      imageUrl: "/images/yam.png",
      minOrderKg: 300,
      supplierId: ejura.id,
    },
  });

  await db.supply.create({
    data: {
      code: "AKM-20418",
      name: "Smooth Cayenne Pineapple",
      category: "FRUIT",
      quantityKg: 3400,
      totalQuantityKg: 4200,
      pricePerKg: 6.2,
      grade: "GRADE_A",
      harvestStart: daysFromNow(4),
      harvestEnd: daysFromNow(12),
      description:
        "Harvested at buyers' specified maturity from 12-month ratoons, crown-trimmed and packed at 1.2–1.8 kg per fruit. Suited to fresh retail, juicing and concentrate lines.",
      imageUrl: "/images/pineapple.png",
      minOrderKg: 200,
      supplierId: bunso.id,
    },
  });

  await db.supply.create({
    data: {
      code: "AKM-20387",
      name: "Keitt Mango",
      category: "FRUIT",
      quantityKg: 5600,
      totalQuantityKg: 7000,
      pricePerKg: 5.9,
      grade: "GRADE_A",
      harvestStart: daysFromNow(7),
      harvestEnd: daysFromNow(18),
      description:
        "Late-season keitt from the northern orchards, hot-water treated on a pack line and graded 300–500 g per fruit. Available for fresh market and pulp processing contracts.",
      imageUrl: "/images/mango.png",
      minOrderKg: 300,
      supplierId: yendi.id,
    },
  });

  await db.supply.create({
    data: {
      code: "AKM-20344",
      name: "Crimson Sweet Watermelon",
      category: "FRUIT",
      quantityKg: 7200,
      totalQuantityKg: 9000,
      pricePerKg: 3.8,
      grade: "GRADE_B",
      harvestStart: daysFromNow(1),
      harvestEnd: daysFromNow(8),
      description:
        "Drip-irrigated melons cut at full sugar development, graded 5–9 kg per fruit. Field-heat removed under shade before loading; sold as whole fruit on a per-kilo basis.",
      imageUrl: "/images/watermelon.png",
      minOrderKg: 300,
      supplierId: walewale.id,
    },
  });

  await db.supply.create({
    data: {
      code: "AKM-20361",
      name: "Red Onions",
      category: "VEGETABLE",
      quantityKg: 4100,
      totalQuantityKg: 5000,
      pricePerKg: 11.5,
      grade: "GRADE_A",
      harvestStart: daysAgo(8),
      harvestEnd: daysAgo(1),
      description:
        "Field-cured red onions from the Bugri irrigation plains, topped and graded 45–70 mm. Packed in 20 kg mesh sacks with strong shelf life ahead of the import season.",
      imageUrl: "/images/onion.png",
      minOrderKg: 200,
      supplierId: bawku.id,
    },
  });

  // ── Orders ────────────────────────────────────────────────────────────
  const journey = ["REQUESTED", "CONFIRMED", "PREPARING", "READY", "IN_TRANSIT", "DELIVERED"];
  const eventNotes: Record<string, string> = {
    REQUESTED: "Request submitted to supplier",
    CONFIRMED: "Supplier confirmed availability and price",
    PREPARING: "Lot allocated, grading and packing under way",
    READY: "Order packed and awaiting dispatch",
    IN_TRANSIT: "Loaded and dispatched to destination",
    DELIVERED: "Delivered and receipted by buyer",
  };

  async function createOrder(opts: {
    code: string;
    buyerName: string;
    buyerCompany: string;
    supplyId: string;
    quantityKg: number;
    unitPrice: number;
    deliveryMethod: string;
    destination: string;
    status: string;
    createdDaysAgo: number;
    deliveryFee?: number;
  }) {
    const productValue = opts.quantityKg * opts.unitPrice;
    const statusIdx = journey.indexOf(opts.status);
    const created = daysAgo(opts.createdDaysAgo);
    const stepHours = Math.max(6, (opts.createdDaysAgo * 24) / (statusIdx + 1));
    const order = await db.order.create({
      data: {
        code: opts.code,
        buyerName: opts.buyerName,
        buyerCompany: opts.buyerCompany,
        supplyId: opts.supplyId,
        quantityKg: opts.quantityKg,
        unitPrice: opts.unitPrice,
        productValue,
        deliveryFee: opts.deliveryFee ?? (opts.deliveryMethod === "DELIVERY" ? 420 : 0),
        deliveryMethod: opts.deliveryMethod,
        destination: opts.destination,
        status: opts.status,
        createdAt: created,
        updatedAt: created,
      },
    });
    for (let i = 0; i <= statusIdx; i++) {
      await db.orderEvent.create({
        data: {
          orderId: order.id,
          status: journey[i],
          note: eventNotes[journey[i]],
          timestamp: new Date(created.getTime() + i * stepHours * 3600000),
        },
      });
    }
    return order;
  }

  // Buyer history, Ama Mensah, Accra Fresh Mart (delivered)
  await createOrder({ code: "AKM-ORD-0987", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: tomatoes.id, quantityKg: 600, unitPrice: 8.2, deliveryMethod: "DELIVERY", destination: "Odorna, Accra", status: "DELIVERED", createdDaysAgo: 168 });
  await createOrder({ code: "AKM-ORD-1002", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: maize.id, quantityKg: 4000, unitPrice: 3.05, deliveryMethod: "PICKUP", destination: "Techiman shed pickup", status: "DELIVERED", createdDaysAgo: 150 });
  await createOrder({ code: "AKM-ORD-1013", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: plantain.id, quantityKg: 1200, unitPrice: 5.4, deliveryMethod: "DELIVERY", destination: "Odorna, Accra", status: "DELIVERED", createdDaysAgo: 132 });
  await createOrder({ code: "AKM-ORD-1024", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: pepper.id, quantityKg: 200, unitPrice: 13.8, deliveryMethod: "DELIVERY", destination: "Odorna, Accra", status: "DELIVERED", createdDaysAgo: 118 });
  await createOrder({ code: "AKM-ORD-1036", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: tomatoes.id, quantityKg: 800, unitPrice: 7.9, deliveryMethod: "DELIVERY", destination: "Kasoa, Central Region", status: "DELIVERED", createdDaysAgo: 96 });
  await createOrder({ code: "AKM-ORD-1044", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: plantain.id, quantityKg: 1500, unitPrice: 5.5, deliveryMethod: "DELIVERY", destination: "Odorna, Accra", status: "DELIVERED", createdDaysAgo: 74 });
  await createOrder({ code: "AKM-ORD-1051", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: maize.id, quantityKg: 6000, unitPrice: 3.15, deliveryMethod: "DELIVERY", destination: "Tema Community 25", status: "DELIVERED", createdDaysAgo: 58 });
  await createOrder({ code: "AKM-ORD-1063", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: tomatoes.id, quantityKg: 500, unitPrice: 8.1, deliveryMethod: "DELIVERY", destination: "Odorna, Accra", status: "DELIVERED", createdDaysAgo: 42 });
  await createOrder({ code: "AKM-ORD-1071", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: pepper.id, quantityKg: 150, unitPrice: 14.0, deliveryMethod: "PICKUP", destination: "Akomadan farm pickup", status: "DELIVERED", createdDaysAgo: 27 });
  await createOrder({ code: "AKM-ORD-1082", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: plantain.id, quantityKg: 1000, unitPrice: 5.6, deliveryMethod: "DELIVERY", destination: "Kasoa, Central Region", status: "DELIVERED", createdDaysAgo: 13 });

  // Buyer active orders
  await createOrder({ code: "AKM-ORD-1091", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: tomatoes.id, quantityKg: 500, unitPrice: 8.4, deliveryMethod: "DELIVERY", destination: "Odorna, Accra", status: "PREPARING", createdDaysAgo: 3, deliveryFee: 380 });
  await createOrder({ code: "AKM-ORD-1088", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: maize.id, quantityKg: 5000, unitPrice: 3.2, deliveryMethod: "DELIVERY", destination: "Tema Community 25", status: "IN_TRANSIT", createdDaysAgo: 5, deliveryFee: 900 });
  await createOrder({ code: "AKM-ORD-1094", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: plantain.id, quantityKg: 900, unitPrice: 5.6, deliveryMethod: "DELIVERY", destination: "Odorna, Accra", status: "CONFIRMED", createdDaysAgo: 2, deliveryFee: 420 });
  await createOrder({ code: "AKM-ORD-1097", buyerName: "Ama Mensah", buyerCompany: "Accra Fresh Mart", supplyId: pepper.id, quantityKg: 100, unitPrice: 14.2, deliveryMethod: "PICKUP", destination: "Akomadan farm pickup", status: "REQUESTED", createdDaysAgo: 1 });

  // Other buyers ordering from Akwasi Farms (supplier dashboard activity)
  await createOrder({ code: "AKM-ORD-1085", buyerName: "Kofi Asante", buyerCompany: "Adinkra Hotels, Kumasi", supplyId: tomatoes.id, quantityKg: 300, unitPrice: 8.4, deliveryMethod: "DELIVERY", destination: "Adum, Kumasi", status: "PREPARING", createdDaysAgo: 4, deliveryFee: 350 });
  await createOrder({ code: "AKM-ORD-1089", buyerName: "Efua Darko", buyerCompany: "Volta Foods Processing", supplyId: tomatoes.id, quantityKg: 1500, unitPrice: 8.3, deliveryMethod: "DELIVERY", destination: "Ho Industrial Area", status: "IN_TRANSIT", createdDaysAgo: 6, deliveryFee: 750 });
  await createOrder({ code: "AKM-ORD-1092", buyerName: "Yaw Owusu", buyerCompany: "Sun Lodge Restaurant", supplyId: pepper.id, quantityKg: 60, unitPrice: 14.2, deliveryMethod: "PICKUP", destination: "Akomadan farm pickup", status: "REQUESTED", createdDaysAgo: 1 });

  // ── Accounts ──────────────────────────────────────────────────────────
  await db.user.create({
    data: {
      email: "ama@accrafresh.com",
      passwordHash: hashPassword(DEMO_PASSWORD),
      name: "Ama Mensah",
      role: "BUYER",
      businessName: "Accra Fresh Mart",
      location: "Accra, Greater Accra",
      phone: "+233 24 000 1001",
      interests: "Vegetables,Grains,Fruits",
    },
  });

  await db.user.create({
    data: {
      email: "akwasi@akwasifarms.com",
      passwordHash: hashPassword(DEMO_PASSWORD),
      name: "Kwaku Akwasi",
      role: "SUPPLIER",
      businessName: "Akwasi Farms",
      location: "Akomadan, Ashanti",
      phone: "+233 24 000 1002",
      supplierId: akwasi.id,
    },
  });

  // Tag Ama's orders so her session sees them
  await db.order.updateMany({
    where: { buyerCompany: "Accra Fresh Mart" },
    data: { buyerEmail: "ama@accrafresh.com" },
  });

  console.log("Seed complete:", {
    suppliers: await db.supplier.count(),
    supplies: await db.supply.count(),
    orders: await db.order.count(),
    users: await db.user.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
